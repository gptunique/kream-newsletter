import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Calendar, Database } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminScraping() {
  const { data: history, isLoading } = trpc.admin.scrapingHistory.useQuery({ limit: 50 });

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
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">스크래핑 히스토리</h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">일별 스냅샷 기록</p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="container mx-auto px-4 py-8">
        <Card className="bg-[var(--bg-secondary)] border-[var(--border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              스크래핑 기록 (최근 50개)
            </CardTitle>
            <CardDescription>일별 스냅샷 데이터 저장 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">로딩 중...</div>
            ) : history && history.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">스크래핑 기록이 없습니다</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>스냅샷 날짜</TableHead>
                      <TableHead>생성 일시</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history?.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                            {new Date(record.snapshotDate).toLocaleDateString("ko-KR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(record.createdAt).toLocaleString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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
