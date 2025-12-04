import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutGrid, List, Loader2, RefreshCw, Edit, TrendingUp, Search, Bell, Shield } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";

type ViewMode = "card" | "table";

interface RankingItem {
  rankingId: number;
  rank: number;
  price: number | null;
  tradeVolume: string | null;
  wishCount: number | null;
  recordedAt: Date;
  productId: number;
  kreamId: string | null;
  brand: string | null;
  name: string | null;
  nameKo: string | null;
  thumbnailUrl: string | null;
  detailUrl: string | null;
}

export default function Home() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [sortBy, setSortBy] = useState<"rank" | "price-asc" | "price-desc" | "popularity">("rank");
  const { data: rankings, isLoading, refetch } = trpc.rankings.latest.useQuery();
  const scrapeMutation = trpc.scraper.trigger.useMutation({
    onSuccess: () => {
      toast.success("스크래핑이 완료되었습니다!");
      refetch();
    },
    onError: (error) => {
      toast.error(`스크래핑 실패: ${error.message}`);
    },
  });

  // localStorage에서 뷰 모드 불러오기
  useEffect(() => {
    const savedMode = localStorage.getItem("kream-view-mode") as ViewMode | null;
    if (savedMode) {
      setViewMode(savedMode);
    }
  }, []);

  // 뷰 모드 변경 시 localStorage에 저장
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("kream-view-mode", mode);
  };

  const handleScrape = (mode: "mock" | "realtime" | "popular") => {
    scrapeMutation.mutate({ mode });
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return "gradient-rank-1 text-black font-bold";
    if (rank === 2) return "gradient-rank-2 text-black font-bold";
    if (rank === 3) return "gradient-rank-3 text-black font-bold";
    return "bg-muted text-muted-foreground";
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "가격 정보 없음";
    return `${price.toLocaleString()}원`;
  };

  const formatWishCount = (count: number | null) => {
    if (!count) return "0";
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}만`;
    }
    return count.toLocaleString();
  };

  // 검색, 필터 및 정렬 로직
  const filteredRankings = useMemo(() => {
    if (!rankings) return [];

    // 1. 필터링
    let filtered = rankings.filter((item) => {
      // 브랜드 필터
      const brandMatch = selectedBrand === "all" || item.brand === selectedBrand;

      // 검색어 필터 (제품명에서 검색)
      const searchMatch =
        searchQuery === "" ||
        (item.nameKo && item.nameKo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      return brandMatch && searchMatch;
    });

    // 2. 정렬
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "popularity":
          return (b.wishCount || 0) - (a.wishCount || 0);
        case "rank":
        default:
          return a.rank - b.rank;
      }
    });

    return sorted;
  }, [rankings, selectedBrand, searchQuery, sortBy]);

  // 고유 브랜드 목록 추출
  const uniqueBrands = useMemo(() => {
    if (!rankings) return [];
    const brands = rankings
      .map((item) => item.brand)
      .filter((brand): brand is string => brand !== null);
    return Array.from(new Set(brands)).sort();
  }, [rankings]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                KREAM 스니커즈 랭킹
              </h1>
              <p className="text-muted-foreground">
                실시간 인기 스니커즈 TOP 30
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user && user.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    관리자
                  </Button>
                </Link>
              )}
              {user && (
                <Link href="/my-alerts">
                  <Button
                    variant="outline"
                    className="bg-[var(--accent-lime)] text-black hover:bg-[var(--accent-lime)]/80"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    내 알림
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleViewModeChange("card")}
                className={viewMode === "card" ? "bg-accent" : ""}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleViewModeChange("table")}
                className={viewMode === "table" ? "bg-accent" : ""}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="제품명 또는 브랜드 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="브랜드 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 브랜드</SelectItem>
                {uniqueBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="정렬 기준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank">순위순</SelectItem>
                <SelectItem value="price-asc">가격 낮은순</SelectItem>
                <SelectItem value="price-desc">가격 높은순</SelectItem>
                <SelectItem value="popularity">인기순 (관심수)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scrape Controls */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScrape("mock")}
              disabled={scrapeMutation.isPending}
            >
              {scrapeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Mock 데이터
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScrape("realtime")}
              disabled={scrapeMutation.isPending}
            >
              실시간 가격 조회
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleScrape("popular")}
              disabled={scrapeMutation.isPending}
            >
              인기 페이지 스크래핑
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container py-8">
        {!rankings || rankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              아직 데이터가 없습니다. 스크래핑을 시작해주세요.
            </p>
            <Button onClick={() => handleScrape("mock")}>
              Mock 데이터로 시작하기
            </Button>
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              검색 결과가 없습니다.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedBrand("all");
              }}
            >
              필터 초기화
            </Button>
          </div>
        ) : viewMode === "card" ? (
          <CardView 
            rankings={filteredRankings} 
            getRankBadgeClass={getRankBadgeClass} 
            formatPrice={formatPrice} 
            formatWishCount={formatWishCount} 
            isAdmin={user?.role === "admin"} 
            onThumbnailUpdate={refetch}
            onViewPriceHistory={(productId, productName) => {
              setSelectedProductId(productId);
              setSelectedProductName(productName);
            }}
          />
        ) : (
          <TableView 
            rankings={filteredRankings} 
            getRankBadgeClass={getRankBadgeClass} 
            formatPrice={formatPrice} 
            formatWishCount={formatWishCount} 
            isAdmin={user?.role === "admin"} 
            onThumbnailUpdate={refetch}
            onViewPriceHistory={(productId, productName) => {
              setSelectedProductId(productId);
              setSelectedProductName(productName);
            }}
          />
        )}
      </main>

      {/* 가격 히스토리 다이얼로그 */}
      <PriceHistoryDialog
        productId={selectedProductId}
        productName={selectedProductName}
        open={selectedProductId !== null}
        onClose={() => {
          setSelectedProductId(null);
          setSelectedProductName("");
        }}
      />
    </div>
  );
}

// 가격 히스토리 다이얼로그 컴포넌트
interface PriceHistoryDialogProps {
  productId: number | null;
  productName: string;
  open: boolean;
  onClose: () => void;
}

function PriceHistoryDialog({ productId, productName, open, onClose }: PriceHistoryDialogProps) {
  const { data: priceHistory, isLoading } = trpc.products.priceHistory.useQuery(
    { productId: productId!, days: 30 },
    { enabled: productId !== null }
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>가격 변동 추이</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : priceHistory && priceHistory.length > 0 ? (
          <PriceHistoryChart data={priceHistory} productName={productName} />
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            가격 히스토리 데이터가 없습니다.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ViewProps {
  rankings: RankingItem[];
  getRankBadgeClass: (rank: number) => string;
  formatPrice: (price: number | null) => string;
  formatWishCount: (count: number | null) => string;
  isAdmin?: boolean;
  onThumbnailUpdate: () => void;
  onViewPriceHistory: (productId: number, productName: string) => void;
}

function CardView({ rankings, getRankBadgeClass, formatPrice, formatWishCount, isAdmin, onThumbnailUpdate, onViewPriceHistory }: ViewProps) {
  const [editingProduct, setEditingProduct] = useState<RankingItem | null>(null);
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const utils = trpc.useUtils();
  const updateThumbnailMutation = trpc.products.updateThumbnail.useMutation({
    onSuccess: () => {
      toast.success("썸네일이 업데이트되었습니다!");
      setDialogOpen(false);
      setEditingProduct(null);
      setNewThumbnailUrl("");
      onThumbnailUpdate();
    },
    onError: (error) => {
      toast.error(`업데이트 실패: ${error.message}`);
    },
  });

  const handleEditClick = (item: RankingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(item);
    setNewThumbnailUrl(item.thumbnailUrl || "");
    setDialogOpen(true);
  };

  const handleUpdateThumbnail = () => {
    if (!editingProduct || !newThumbnailUrl) return;
    updateThumbnailMutation.mutate({
      productId: editingProduct.productId,
      thumbnailUrl: newThumbnailUrl,
    });
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>썸네일 이미지 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제품명</Label>
              <p className="text-sm text-muted-foreground">{editingProduct?.nameKo}</p>
            </div>
            <div>
              <Label htmlFor="thumbnail-url">썸네일 URL</Label>
              <Input
                id="thumbnail-url"
                value={newThumbnailUrl}
                onChange={(e) => setNewThumbnailUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {newThumbnailUrl && (
              <div>
                <Label>미리보기</Label>
                <img src={newThumbnailUrl} alt="Preview" className="w-full h-48 object-cover rounded" />
              </div>
            )}
            <Button
              onClick={handleUpdateThumbnail}
              disabled={updateThumbnailMutation.isPending || !newThumbnailUrl}
              className="w-full"
            >
              {updateThumbnailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              업데이트
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rankings.map((item) => (
        <Tooltip key={item.rankingId} delayDuration={300}>
          <TooltipTrigger asChild>
        <Card
          className={`group hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
            item.rank === 1 ? "md:col-span-2 lg:col-span-2" : ""
          }`}
          onClick={() => {
            if (item.detailUrl) {
              window.open(item.detailUrl, "_blank");
            }
          }}
        >
          <CardContent className="p-0">
            <div className={`relative ${item.rank === 1 ? "h-80" : "h-64"}`}>
              <img
                src={item.thumbnailUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"}
                alt={item.nameKo || "제품 이미지"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 left-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getRankBadgeClass(item.rank)}`}>
                  #{item.rank}
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm text-muted-foreground">{item.brand}</p>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleEditClick(item, e)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                {item.nameKo || item.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(item.price)}
                </span>
                <div className="text-sm text-muted-foreground">
                  관심 {formatWishCount(item.wishCount)}
                </div>
              </div>
              {item.tradeVolume && (
                <div className="text-xs text-muted-foreground mt-1">
                  거래 {item.tradeVolume}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPriceHistory(item.productId, item.nameKo || item.name || "");
                }}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                가격 변동 보기
              </Button>
            </div>
          </CardContent>
        </Card>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p><strong>거래량:</strong> {item.tradeVolume || "정보 없음"}</p>
              <p><strong>KREAM ID:</strong> {item.kreamId || "정보 없음"}</p>
              <p><strong>마지막 업데이트:</strong> {item.recordedAt ? new Date(item.recordedAt).toLocaleString("ko-KR") : "정보 없음"}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
      </div>
      </TooltipProvider>
    </>
  );
}

function TableView({ rankings, getRankBadgeClass, formatPrice, formatWishCount, isAdmin, onThumbnailUpdate, onViewPriceHistory }: ViewProps) {
  const [editingProduct, setEditingProduct] = useState<RankingItem | null>(null);
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const updateThumbnailMutation = trpc.products.updateThumbnail.useMutation({
    onSuccess: () => {
      toast.success("썸네일이 업데이트되었습니다!");
      setDialogOpen(false);
      setEditingProduct(null);
      setNewThumbnailUrl("");
      onThumbnailUpdate();
    },
    onError: (error) => {
      toast.error(`업데이트 실패: ${error.message}`);
    },
  });

  const handleEditClick = (item: RankingItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(item);
    setNewThumbnailUrl(item.thumbnailUrl || "");
    setDialogOpen(true);
  };

  const handleUpdateThumbnail = () => {
    if (!editingProduct || !newThumbnailUrl) return;
    updateThumbnailMutation.mutate({
      productId: editingProduct.productId,
      thumbnailUrl: newThumbnailUrl,
    });
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>썸네일 이미지 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>제품명</Label>
              <p className="text-sm text-muted-foreground">{editingProduct?.nameKo}</p>
            </div>
            <div>
              <Label htmlFor="thumbnail-url-table">썸네일 URL</Label>
              <Input
                id="thumbnail-url-table"
                value={newThumbnailUrl}
                onChange={(e) => setNewThumbnailUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            {newThumbnailUrl && (
              <div>
                <Label>미리보기</Label>
                <img src={newThumbnailUrl} alt="Preview" className="w-full h-48 object-cover rounded" />
              </div>
            )}
            <Button
              onClick={handleUpdateThumbnail}
              disabled={updateThumbnailMutation.isPending || !newThumbnailUrl}
              className="w-full"
            >
              {updateThumbnailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              업데이트
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <TooltipProvider>
      <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-4 text-foreground font-semibold">순위</th>
            <th className="text-left p-4 text-foreground font-semibold">제품</th>
            <th className="text-left p-4 text-foreground font-semibold">브랜드</th>
            <th className="text-right p-4 text-foreground font-semibold">가격</th>
            <th className="text-right p-4 text-foreground font-semibold">관심수</th>
            <th className="text-right p-4 text-foreground font-semibold">거래량</th>
            <th className="text-center p-4 text-foreground font-semibold">가격 변동</th>
            {isAdmin && <th className="text-right p-4 text-foreground font-semibold">편집</th>}
          </tr>
        </thead>
        <tbody>
          {rankings.map((item) => (
            <Tooltip key={item.rankingId} delayDuration={300}>
              <TooltipTrigger asChild>
            <tr
              className="border-b border-border hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => {
                if (item.detailUrl) {
                  window.open(item.detailUrl, "_blank");
                }
              }}
            >
              <td className="p-4">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getRankBadgeClass(item.rank)}`}>
                  #{item.rank}
                </span>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.thumbnailUrl || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"}
                    alt={item.nameKo || "제품 이미지"}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium text-foreground">{item.nameKo || item.name}</p>
                  </div>
                </div>
              </td>
              <td className="p-4 text-muted-foreground">{item.brand}</td>
              <td className="p-4 text-right font-semibold text-foreground">
                {formatPrice(item.price)}
              </td>
              <td className="p-4 text-right text-muted-foreground">
                {formatWishCount(item.wishCount)}
              </td>
              <td className="p-4 text-right text-muted-foreground">
                {item.tradeVolume || "-"}
              </td>
              <td className="p-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewPriceHistory(item.productId, item.nameKo || item.name || "");
                  }}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  보기
                </Button>
              </td>
              {isAdmin && (
                <td className="p-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleEditClick(item, e)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </td>
              )}
            </tr>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p><strong>거래량:</strong> {item.tradeVolume || "정보 없음"}</p>
                  <p><strong>KREAM ID:</strong> {item.kreamId || "정보 없음"}</p>
                  <p><strong>마지막 업데이트:</strong> {item.recordedAt ? new Date(item.recordedAt).toLocaleString("ko-KR") : "정보 없음"}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </tbody>
      </table>
      </div>
      </TooltipProvider>
    </>
  );
}
