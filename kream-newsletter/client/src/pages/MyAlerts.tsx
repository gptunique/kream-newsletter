import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Trash2, Plus, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

type AlertType = "percent_change" | "price_below" | "price_above";

export default function MyAlerts() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [alertType, setAlertType] = useState<AlertType>("percent_change");
  const [thresholdPercent, setThresholdPercent] = useState(10);
  const [targetPrice, setTargetPrice] = useState("");

  // 알림 목록 조회
  const { data: alerts, isLoading, refetch } = trpc.userAlerts.list.useQuery();

  // 알림 등록
  const createMutation = trpc.userAlerts.create.useMutation({
    onSuccess: () => {
      toast.success("알림 등록 완료", {
        description: "제품 가격 변동 시 알림을 받게 됩니다.",
      });
      setIsDialogOpen(false);
      setProductUrl("");
      setAlertType("percent_change");
      setThresholdPercent(10);
      setTargetPrice("");
      refetch();
    },
    onError: (error) => {
      toast.error("알림 등록 실패", {
        description: error.message,
      });
    },
  });

  // 알림 삭제
  const deleteMutation = trpc.userAlerts.delete.useMutation({
    onSuccess: () => {
      toast.success("알림 삭제 완료", {
        description: "알림이 삭제되었습니다.",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("알림 삭제 실패", {
        description: error.message,
      });
    },
  });

  // 알림 토글
  const toggleMutation = trpc.userAlerts.toggle.useMutation({
    onSuccess: () => {
      toast.success("알림 상태 변경", {
        description: "알림 상태가 변경되었습니다.",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("알림 상태 변경 실패", {
        description: error.message,
      });
    },
  });

  const handleCreate = () => {
    if (!productUrl) {
      toast.error("입력 오류", {
        description: "제품 URL을 입력해주세요.",
      });
      return;
    }

    if (alertType === "percent_change" && !thresholdPercent) {
      toast.error("입력 오류", {
        description: "변동률 임계값을 입력해주세요.",
      });
      return;
    }

    if ((alertType === "price_below" || alertType === "price_above") && !targetPrice) {
      toast.error("입력 오류", {
        description: "목표 가격을 입력해주세요.",
      });
      return;
    }

    const payload: any = { productUrl, alertType };
    if (alertType === "percent_change") {
      payload.thresholdPercent = thresholdPercent;
    } else {
      payload.targetPrice = parseInt(targetPrice);
    }

    createMutation.mutate(payload);
  };

  const handleDelete = (alertId: number) => {
    if (confirm("정말로 이 알림을 삭제하시겠습니까?")) {
      deleteMutation.mutate({ alertId });
    }
  };

  const handleToggle = (alertId: number) => {
    toggleMutation.mutate({ alertId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-lime)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--accent-lime)] to-[var(--accent-cyan)] bg-clip-text text-transparent">
              내 알림 관리
            </h1>
            <p className="text-[var(--text-secondary)] mt-2">
              관심 제품의 가격 변동을 실시간으로 알림 받으세요
            </p>
          </div>

          {/* 알림 추가 버튼 */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--accent-lime)] text-black hover:bg-[var(--accent-lime)]/80">
                <Plus className="w-4 h-4 mr-2" />
                알림 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)]">
              <DialogHeader>
                <DialogTitle>새 알림 등록</DialogTitle>
                <DialogDescription className="text-[var(--text-secondary)]">
                  KREAM 제품 URL을 입력하여 가격 변동 알림을 받으세요
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="productUrl">제품 URL</Label>
                  <Input
                    id="productUrl"
                    placeholder="https://kream.co.kr/products/12345"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)]"
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    예: https://kream.co.kr/products/12345
                  </p>
                </div>

                <div>
                  <Label>알림 타입</Label>
                  <RadioGroup value={alertType} onValueChange={(value: AlertType) => setAlertType(value)} className="mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percent_change" id="percent_change" />
                      <Label htmlFor="percent_change" className="font-normal cursor-pointer">
                        가격 변동률 알림
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="price_below" id="price_below" />
                      <Label htmlFor="price_below" className="font-normal cursor-pointer">
                        목표 가격 이하 알림
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="price_above" id="price_above" />
                      <Label htmlFor="price_above" className="font-normal cursor-pointer">
                        목표 가격 이상 알림
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {alertType === "percent_change" ? (
                  <div>
                    <Label htmlFor="threshold">알림 임계값 (%)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="1"
                      max="100"
                      value={thresholdPercent}
                      onChange={(e) => setThresholdPercent(parseInt(e.target.value) || 10)}
                      className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)]"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      가격이 {thresholdPercent}% 이상 변동되면 알림을 받습니다
                    </p>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="targetPrice">
                      목표 가격 ({alertType === "price_below" ? "이하" : "이상"})
                    </Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      min="0"
                      placeholder="예: 100000"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="bg-[var(--bg-primary)] border-[var(--border)] text-[var(--text-primary)]"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      가격이 {alertType === "price_below" ? "이 가격 이하로 떨어지면" : "이 가격 이상 올라가면"} 알림을 받습니다
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full bg-[var(--accent-lime)] text-black hover:bg-[var(--accent-lime)]/80"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    "알림 등록"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 알림 목록 */}
        {alerts && alerts.length === 0 ? (
          <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-16 h-16 text-[var(--text-secondary)] mb-4" />
              <p className="text-[var(--text-secondary)] text-lg">등록된 알림이 없습니다</p>
              <p className="text-[var(--text-secondary)] text-sm mt-2">
                관심 제품의 URL을 등록하여 가격 변동 알림을 받아보세요
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts?.map((alert) => (
              <Card
                key={alert.id}
                className="bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent-lime)] transition-all"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{alert.productName}</CardTitle>
                      <CardDescription className="text-[var(--text-secondary)] mt-1">
                        {alert.brand}
                      </CardDescription>
                    </div>
                    {alert.thumbnailUrl && (
                      <img
                        src={alert.thumbnailUrl}
                        alt={alert.productName || ""}
                        className="w-16 h-16 object-cover rounded ml-2"
                      />
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* 현재 가격 */}
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">현재 가격</p>
                      <p className="text-xl font-bold text-[var(--accent-lime)]">
                        {alert.currentPrice?.toLocaleString()}원
                      </p>
                    </div>

                    {/* 알림 조건 */}
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">알림 조건</p>
                      <p className="text-sm font-medium">
                        {alert.alertType === "percent_change" && `${alert.thresholdPercent}% 이상 변동`}
                        {alert.alertType === "price_below" && `${alert.targetPrice?.toLocaleString()}원 이하`}
                        {alert.alertType === "price_above" && `${alert.targetPrice?.toLocaleString()}원 이상`}
                      </p>
                    </div>

                    {/* 마지막 알림 시간 */}
                    {alert.lastNotifiedAt && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">마지막 알림</p>
                        <p className="text-sm">
                          {new Date(alert.lastNotifiedAt).toLocaleString("ko-KR")}
                        </p>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(alert.id)}
                        disabled={toggleMutation.isPending}
                        className={`flex-1 ${
                          alert.isActive === 1
                            ? "border-[var(--accent-lime)] text-[var(--accent-lime)]"
                            : "border-[var(--border)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {alert.isActive === 1 ? (
                          <>
                            <Bell className="w-4 h-4 mr-1" />
                            활성
                          </>
                        ) : (
                          <>
                            <BellOff className="w-4 h-4 mr-1" />
                            비활성
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(alert.id)}
                        disabled={deleteMutation.isPending}
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
