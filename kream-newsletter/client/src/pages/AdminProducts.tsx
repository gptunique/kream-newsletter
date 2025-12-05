import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ArrowLeft, Edit, Package, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Product {
  id: number;
  kreamId: string | null;
  brand: string | null;
  name: string | null;
  nameKo: string | null;
  thumbnailUrl: string | null;
  detailUrl: string | null;
  category: string | null;
  createdAt: Date;
}

export default function AdminProducts() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: "", nameKo: "", thumbnailUrl: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading, refetch } = trpc.admin.products.useQuery({ limit: 100 });

  const updateMutation = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      toast.success("제품 정보 수정 완료");
      setEditingProduct(null);
      refetch();
    },
    onError: (error) => {
      toast.error("수정 실패", { description: error.message });
    },
  });

  const uploadImageMutation = trpc.admin.uploadProductImage.useMutation({
    onSuccess: (data) => {
      toast.success("이미지 업로드 성공");
      setEditForm({ ...editForm, thumbnailUrl: data.url });
      setUploadingImage(false);
      refetch();
    },
    onError: (error) => {
      toast.error("업로드 실패", { description: error.message });
      setUploadingImage(false);
    },
  });

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || "",
      nameKo: product.nameKo || "",
      thumbnailUrl: product.thumbnailUrl || "",
    });
  };

  const processFile = (file: File) => {
    if (!editingProduct) return;

    // 이미지 파일만 허용
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다");
      return;
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다");
      return;
    }

    setUploadingImage(true);

    // 파일을 Base64로 변환
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      uploadImageMutation.mutate({
        productId: editingProduct.id,
        imageBase64: base64,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]); // 첫 번째 파일만 처리
    }
  };

  const handleSave = () => {
    if (!editingProduct) return;

    const updates: { name?: string; nameKo?: string; thumbnailUrl?: string } = {};
    if (editForm.name !== editingProduct.name) updates.name = editForm.name;
    if (editForm.nameKo !== editingProduct.nameKo) updates.nameKo = editForm.nameKo;
    if (editForm.thumbnailUrl !== editingProduct.thumbnailUrl) updates.thumbnailUrl = editForm.thumbnailUrl;

    if (Object.keys(updates).length === 0) {
      toast.info("변경된 내용이 없습니다");
      return;
    }

    updateMutation.mutate({
      productId: editingProduct.id,
      ...updates,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 헤더 */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">제품 관리</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">등록된 제품 정보 수정</p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              전체 제품 목록 (최대 100개)
            </CardTitle>
            <CardDescription>제품명과 이미지를 수정할 수 있습니다</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">로딩 중...</div>
            ) : products && products.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">등록된 제품이 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이미지</TableHead>
                      <TableHead>브랜드</TableHead>
                      <TableHead>제품명 (영문)</TableHead>
                      <TableHead>제품명 (한글)</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.thumbnailUrl ? (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.nameKo || product.name || "제품 이미지"}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.brand}</TableCell>
                        <TableCell className="max-w-xs truncate">{product.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{product.nameKo}</TableCell>
                        <TableCell>{new Date(product.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(product)}>
                            <Edit className="w-4 h-4 mr-2" />
                            수정
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>제품 정보 수정</DialogTitle>
            <DialogDescription>제품명과 이미지를 수정할 수 있습니다</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 현재 이미지 미리보기 */}
            {editForm.thumbnailUrl && (
              <div className="flex justify-center">
                <img
                  src={editForm.thumbnailUrl}
                  alt="미리보기"
                  className="w-32 h-32 object-cover rounded border border-[var(--border)]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">제품명 (영문)</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nike Air Force 1 '07"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nameKo">제품명 (한글)</Label>
              <Input
                id="nameKo"
                value={editForm.nameKo}
                onChange={(e) => setEditForm({ ...editForm, nameKo: e.target.value })}
                placeholder="나이키 에어포스 1 '07"
              />
            </div>

            {/* 이미지 업로드 - 드래그 앤 드롭 */}
            <div className="grid gap-2">
              <Label>이미지 업로드</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                  ${isDragging 
                    ? "border-[var(--accent-lime)] bg-[var(--accent-lime)]/10" 
                    : "border-[var(--border)] hover:border-[var(--accent-lime)]/50"
                  }
                  ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${
                  isDragging ? "text-[var(--accent-lime)]" : "text-[var(--text-secondary)]"
                }`} />
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
                  {uploadingImage 
                    ? "업로드 중..." 
                    : isDragging 
                      ? "여기에 드롭하세요" 
                      : "이미지를 드래그하거나 클릭하세요"
                  }
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  PNG, JPG, GIF 등 (5MB 이하)
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="thumbnailUrl">이미지 URL (직접 입력)</Label>
              <Input
                id="thumbnailUrl"
                value={editForm.thumbnailUrl}
                onChange={(e) => setEditForm({ ...editForm, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-[var(--text-secondary)]">
                또는 KREAM 제품 이미지 URL을 직접 입력하세요
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
