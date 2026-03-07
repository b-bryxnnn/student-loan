"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { User, Mail, CreditCard, GraduationCap, Lock, ShieldCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface UserProfile {
    id: string;
    prefix: string;
    firstName: string;
    lastName: string;
    studentId: string | null;
    idCard: string;
    email: string;
    borrowerType: string;
    role: string;
    emailVerified: boolean;
    createdAt: string;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Change Password
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changing, setChanging] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/profile");
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
            } else {
                toast.error("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
            return;
        }

        setChanging(true);
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
                setIsPasswordOpen(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setChanging(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p className="text-muted-foreground">ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <User className="w-7 h-7 text-primary" />
                    โปรไฟล์ของฉัน
                </h1>
                <p className="text-muted-foreground mt-1">ดูข้อมูลบัญชีผู้ใช้ของคุณ</p>
            </div>

            {/* ข้อมูลส่วนตัว */}
            <Card className="glass border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg">ข้อมูลส่วนตัว</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> ชื่อ-นามสกุล</p>
                            <p className="font-medium">{profile.prefix}{profile.firstName} {profile.lastName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> อีเมล</p>
                            <p className="font-medium">{profile.email}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" /> เลขบัตรประชาชน</p>
                            <p className="font-medium font-mono">{profile.idCard}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><GraduationCap className="w-3 h-3" /> รหัสนักเรียน</p>
                            <p className="font-medium">{profile.studentId || "—"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* สถานะบัญชี */}
            <Card className="glass border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg">สถานะบัญชี</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">ประเภทผู้กู้</p>
                            <Badge variant="outline" className={profile.borrowerType === 'NEW' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-secondary text-secondary-foreground'}>
                                {profile.borrowerType === 'NEW' ? 'ผู้กู้รายใหม่' : 'ผู้กู้รายเก่า'}
                            </Badge>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">ยืนยันอีเมล</p>
                            {profile.emailVerified ? (
                                <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                    <ShieldCheck className="w-3 h-3 mr-1" /> ยืนยันแล้ว
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                                    ยังไม่ยืนยัน
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> วันที่ลงทะเบียน</p>
                            <p className="text-sm">{new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date(profile.createdAt))}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* เปลี่ยนรหัสผ่าน */}
            <Card className="glass border-border/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" />
                        ความปลอดภัย
                    </CardTitle>
                    <CardDescription>เปลี่ยนรหัสผ่านบัญชีของคุณ</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="hover-lift">เปลี่ยนรหัสผ่าน</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>เปลี่ยนรหัสผ่าน</DialogTitle>
                                <DialogDescription>กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ที่ต้องการ</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                                    <Input
                                        type="password"
                                        id="currentPassword"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                                    <Input
                                        type="password"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        minLength={8}
                                    />
                                    <p className="text-xs text-muted-foreground">ต้องมีอย่างน้อย 8 ตัวอักษร</p>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                                    <Input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    onClick={handleChangePassword}
                                    disabled={changing || !currentPassword || !newPassword || newPassword !== confirmPassword}
                                >
                                    {changing ? "กำลังเปลี่ยน..." : "ยืนยันเปลี่ยนรหัสผ่าน"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
        </div>
    );
}
