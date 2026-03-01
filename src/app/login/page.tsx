"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Fingerprint } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [idCard, setIdCard] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idCard, password }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("เข้าสู่ระบบสำเร็จ!");
                router.push("/dashboard");
            } else {
                toast.error(data.error || "เลขบัตรประชาชนหรือรหัสผ่านไม่ถูกต้อง");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-40 -z-10" />

            <Card className="w-full max-w-md glass border-primary/20 shadow-2xl hover-lift">
                <form onSubmit={handleLogin}>
                    <CardHeader className="space-y-3 text-center">
                        <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center text-primary mb-2">
                            <Fingerprint className="w-10 h-10" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">เข้าสู่ระบบ</CardTitle>
                        <CardDescription>
                            กยศ. โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="idCard">เลขประจำตัวประชาชน (13 หลัก)</Label>
                            <Input
                                id="idCard"
                                type="text"
                                placeholder="x-xxxx-xxxxx-xx-x"
                                maxLength={13}
                                required
                                value={idCard}
                                onChange={(e) => setIdCard(e.target.value.replace(/[^0-9]/g, ''))}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">รหัสผ่าน</Label>
                                <Link href="/forgot-password" className="text-xs text-primary hover:underline" tabIndex={-1}>
                                    ลืมรหัสผ่าน?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-border/50">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground w-full">
                            ยังไม่มีบัญชีใช่หรือไม่?{" "}
                            <Link href="/register" className="text-primary hover:underline font-semibold">
                                ลงทะเบียนเลย
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
