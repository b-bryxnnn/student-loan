import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminDashboardPage() {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') redirect('/dashboard');

    // Fetch Stats
    const totalUsers = await db.user.count({ where: { role: 'STUDENT' } });
    const pendingDocs = await db.document.count({ where: { status: 'PENDING' } });
    const approvedDocs = await db.document.count({ where: { status: 'APPROVED' } });
    const rejectedDocs = await db.document.count({ where: { status: 'REJECTED' } });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">ระบบผู้ดูแลระบบ กยศ.</h1>
                    <p className="text-muted-foreground mt-2">ภาพรวมการส่งเอกสารและคำขอกู้ยืม</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/students">
                        <Button variant="outline" className="hover-lift" size="sm">จัดการนักเรียน</Button>
                    </Link>
                    <Link href="/admin/announcements">
                        <Button variant="outline" className="hover-lift" size="sm">จัดการประกาศ</Button>
                    </Link>
                    <Link href="/admin/faq">
                        <Button variant="outline" className="hover-lift" size="sm">จัดการ FAQ</Button>
                    </Link>
                    <Link href="/admin/loan-info">
                        <Button variant="outline" className="hover-lift" size="sm">จัดการข้อมูลกู้ยืม</Button>
                    </Link>
                    <Link href="/admin/documents">
                        <Button className="hover-lift" size="sm">จัดการเอกสารทั้งหมด</Button>
                    </Link>
                    <Link href="/admin/settings">
                        <Button variant="secondary" className="hover-lift" size="sm">ตั้งค่าระบบ</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">ผู้ใช้งานทั้งหมด</CardTitle>
                        <Users className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">นักเรียนในระบบ</p>
                    </CardContent>
                </Card>

                <Card className="glass border-warning/20 bg-warning/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-warning">รอตรวจสอบ</CardTitle>
                        <Clock className="w-4 h-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-warning-foreground">{pendingDocs}</div>
                        <p className="text-xs text-warning-foreground/80 mt-1">เอกสารแบบยืนยันและสัญญา</p>
                    </CardContent>
                </Card>

                <Card className="glass border-success/20 bg-success/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-success">ผ่านการตรวจสอบแล้ว</CardTitle>
                        <CheckCircle className="w-4 h-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success-foreground">{approvedDocs}</div>
                        <p className="text-xs text-success-foreground/80 mt-1">พร้อมนำส่ง</p>
                    </CardContent>
                </Card>

                <Card className="glass border-destructive/20 bg-destructive/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">ต้องแก้ไข</CardTitle>
                        <FileText className="w-4 h-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive-foreground">{rejectedDocs}</div>
                        <p className="text-xs text-destructive-foreground/80 mt-1">รอผู้กู้แก้ไขเพื่อตรวจสอบใหม่</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Pending Table Mockup or link to the full page */}
            <Card className="glass border-border/50">
                <CardHeader>
                    <CardTitle className="text-xl">รายการรอตรวจสอบล่าสุด</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">คลิก "จัดการเอกสารทั้งหมด" เพื่อตรวจสอบ ดาวน์โหลด และเปลี่ยนสถานะเอกสาร</p>
                    <Link href="/admin/documents?status=PENDING">
                        <Button variant="outline" className="w-full">ดูรายการรอตรวจสอบทั้งหมด</Button>
                    </Link>
                </CardContent>
            </Card>

        </div>
    );
}
