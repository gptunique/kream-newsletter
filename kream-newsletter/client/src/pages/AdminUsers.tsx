import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Shield, User } from "lucide-react";
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

export default function AdminUsers() {
  const { data: users, isLoading, refetch } = trpc.admin.users.useQuery();
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("역할 변경 완료");
      refetch();
    },
    onError: (error) => {
      toast.error("역할 변경 실패", {
        description: error.message,
      });
    },
  });

  const handleRoleToggle = (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (confirm(`이 사용자를 ${newRole === "admin" ? "관리자" : "일반 사용자"}로 변경하시겠습니까?`)) {
      updateRoleMutation.mutate({ userId, role: newRole as "admin" | "user" });
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
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">사용자 관리</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">등록된 사용자 목록 및 권한 관리</p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
          <CardHeader>
            <CardTitle>전체 사용자 ({users?.length || 0}명)</CardTitle>
            <CardDescription>사용자 정보 및 역할 관리</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">로딩 중...</div>
            ) : users && users.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">등록된 사용자가 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.role === "admin" ? (
                            <Badge className="bg-[var(--accent-lime)] text-black">
                              <Shield className="w-3 h-3 mr-1" />
                              관리자
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <User className="w-3 h-3 mr-1" />
                              사용자
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString("ko-KR")}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleToggle(user.id, user.role)}
                            disabled={updateRoleMutation.isPending}
                          >
                            {user.role === "admin" ? "일반으로 변경" : "관리자로 변경"}
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
    </div>
  );
}
