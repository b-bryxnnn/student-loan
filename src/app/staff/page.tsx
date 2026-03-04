"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function StaffLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idCard: username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                if (data.role === 'ADMIN') {
                    toast.success("เข้าสู่ระบบเจ้าหน้าที่สำเร็จ!");
                    router.push("/admin");
                } else {
                    toast.error("บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้าเจ้าหน้าที่");
                }
            } else {
                toast.error(data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <Card className="w-full max-w-sm border-primary/10 shadow-lg gradient-border animate-in fade-in slide-in-from-bottom-6 duration-700">
                <form onSubmit={handleLogin}>
                    <CardHeader className="space-y-2 text-center pb-5 border-b border-border/50">
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center text-primary ring-2 ring-warning/20 mb-1">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-lg font-bold tracking-tight">เข้าสู่ระบบเจ้าหน้าที่</CardTitle>
                        <CardDescription className="text-xs">
                            สำหรับผู้ดูแลระบบ กยศ. รส.ล. เท่านั้น
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="username" className="text-xs">ชื่อผู้ใช้</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="ชื่อผู้ใช้"
                                required
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-white text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs">รหัสผ่าน</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white text-sm"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-5 border-t border-border/50">
                        <Button type="submit" className="w-full text-sm font-semibold shadow-md shadow-primary/20" disabled={loading}>
                            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบเจ้าหน้าที่"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
