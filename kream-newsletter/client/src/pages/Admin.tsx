import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bell, Package, Activity } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.dashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-[var(--text-secondary)]">로딩 중...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: "전체 사용자",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "등록된 사용자 수",
      link: "/admin/users",
      color: "text-blue-500",
    },
    {
      title: "전체 알림",
      value: stats?.totalAlerts || 0,
      icon: Bell,
      description: `활성: ${stats?.activeAlerts || 0}개`,
      link: "/admin/alerts",
      color: "text-[var(--accent-lime)]",
    },
    {
      title: "등록 제품",
      value: stats?.totalProducts || 0,
      icon: Package,
      description: "스크래핑된 제품 수",
      link: "/admin/products",
      color: "text-purple-500",
    },
    {
      title: "최근 스크래핑",
      value: stats?.recentScrapings || 0,
      icon: Activity,
      description: "최근 7일",
      link: "/admin/scraping",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 헤더 */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">관리자 대시보드</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">KREAM 스니커즈 랭킹 시스템 관리</p>
            </div>
            <Link href="/">
              <Button variant="outline">메인으로</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => (
            <Link key={card.title} href={card.link}>
              <Card className="bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--accent-lime)] transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">{card.title}</CardTitle>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[var(--text-primary)]">{card.value.toLocaleString()}</div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* 빠른 액세스 */}
        <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
          <CardHeader>
            <CardTitle>빠른 액세스</CardTitle>
            <CardDescription>자주 사용하는 관리 기능</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  사용자 관리
                </Button>
              </Link>
              <Link href="/admin/alerts">
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  알림 관리
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  제품 관리
                </Button>
              </Link>
              <Link href="/admin/scraping">
                <Button variant="outline" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  스크래핑 히스토리
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
