import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Trash2, BellOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function AdminAlerts() {
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  const { data: stats, isLoading: statsLoading } = trpc.admin.alertStats.useQuery();
  const { data: alerts, isLoading: alertsLoading, refetch } = trpc.admin.allAlerts.useQuery();

  const bulkDeactivateMutation = trpc.admin.bulkDeactivateAlerts.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.count}개 알림 비활성화 완료`);
      setSelectedAlerts([]);
      refetch();
    },
    onError: (error) => {
      toast.error("비활성화 실패", { description: error.message });
    },
  });

  const bulkDeleteMutation = trpc.admin.bulkDeleteAlerts.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.count}개 알림 삭제 완료`);
      setSelectedAlerts([]);
      refetch();
    },
    onError: (error) => {
      toast.error("삭제 실패", { description: error.message });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && alerts) {
      setSelectedAlerts(alerts.map((alert) => alert.id));
    } else {
      setSelectedAlerts([]);
    }
  };

  const handleSelectAlert = (alertId: number, checked: boolean) => {
    if (checked) {
      setSelectedAlerts([...selectedAlerts, alertId]);
    } else {
      setSelectedAlerts(selectedAlerts.filter((id) => id !== alertId));
    }
  };

  const handleBulkDeactivate = () => {
    if (selectedAlerts.length === 0) return;
    if (confirm(`선택한 ${selectedAlerts.length}개 알림을 비활성화하시겠습니까?`)) {
      bulkDeactivateMutation.mutate({ alertIds: selectedAlerts });
    }
  };

  const handleBulkDelete = () => {
    if (selectedAlerts.length === 0) return;
    if (confirm(`선택한 ${selectedAlerts.length}개 알림을 영구적으로 삭제하시겠습니까?`)) {
      bulkDeleteMutation.mutate({ alertIds: selectedAlerts });
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "percent_change":
        return "변동률";
      case "price_below":
        return "목표가 이하";
      case "price_above":
        return "목표가 이상";
      default:
        return type;
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "percent_change":
        return <Activity className="w-3 h-3 mr-1" />;
      case "price_below":
        return <TrendingDown className="w-3 h-3 mr-1" />;
      case "price_above":
        return <TrendingUp className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
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
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">알림 관리</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">전체 알림 통계 및 목록</p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">전체 알림</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--text-primary)]">
                {statsLoading ? "-" : (stats?.total || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">활성 알림</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[var(--accent-lime)]">
                {statsLoading ? "-" : (stats?.active || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">변동률 알림</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {statsLoading ? "-" : (stats?.byType?.percent_change || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">목표가 알림</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">
                {statsLoading
                  ? "-"
                  : ((stats?.byType?.price_below || 0) + (stats?.byType?.price_above || 0)).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 알림 목록 */}
        <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>최근 알림 목록 (최대 100개)</CardTitle>
                <CardDescription>사용자별 등록된 알림 현황</CardDescription>
              </div>
              {selectedAlerts.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {selectedAlerts.length}개 선택됨
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDeactivate}
                    disabled={bulkDeactivateMutation.isPending}
                  >
                    <BellOff className="w-4 h-4 mr-2" />
                    비활성화
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">로딩 중...</div>
            ) : alerts && alerts.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">등록된 알림이 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={alerts && selectedAlerts.length === alerts.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>사용자</TableHead>
                      <TableHead>제품명</TableHead>
                      <TableHead>현재가</TableHead>
                      <TableHead>알림 타입</TableHead>
                      <TableHead>조건</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>등록일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts?.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedAlerts.includes(alert.id)}
                            onCheckedChange={(checked) => handleSelectAlert(alert.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{alert.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{alert.userName}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{alert.userEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{alert.productName}</TableCell>
                        <TableCell>{alert.currentPrice?.toLocaleString()}원</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="whitespace-nowrap">
                            {getAlertTypeIcon(alert.alertType)}
                            {getAlertTypeLabel(alert.alertType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {alert.alertType === "percent_change" && `${alert.thresholdPercent}%`}
                          {alert.alertType === "price_below" && `${alert.targetPrice?.toLocaleString()}원 이하`}
                          {alert.alertType === "price_above" && `${alert.targetPrice?.toLocaleString()}원 이상`}
                        </TableCell>
                        <TableCell>
                          {alert.isActive === 1 ? (
                            <Badge className="bg-[var(--accent-lime)] text-black">활성</Badge>
                          ) : (
                            <Badge variant="outline">비활성</Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(alert.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
