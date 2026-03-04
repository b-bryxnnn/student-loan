"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { validateThaiId } from "@/lib/validateThaiId";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [idCard, setIdCard] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!idCard || !password) {
            toast.error("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        if (idCard.length !== 13) {
            toast.error("เลขบัตรประชาชนต้องมี 13 หลัก");
            return;
        }

        if (!validateThaiId(idCard)) {
            toast.error("เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
            return;
        }

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
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-primary/10 shadow-lg">
                <form onSubmit={handleLogin}>
                    <CardHeader className="space-y-2 text-center pb-5 border-b border-border/50">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="relative w-10 h-10">
                                <Image
                                    src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Student_Loan_logo.svg"
                                    alt="กยศ."
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                            <div className="relative w-10 h-10">
                                <Image
                                    src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png"
                                    alt="รส.ล."
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                        </div>
                        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">เข้าสู่ระบบ</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            สำหรับนักเรียน — ระบบ กยศ. รส.ล.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="idCard" className="text-xs">เลขประจำตัวประชาชน (13 หลัก)</Label>
                            <Input
                                id="idCard"
                                type="text"
                                placeholder="ตัวเลข 13 หลัก"
                                maxLength={13}
                                inputMode="numeric"
                                required
                                value={idCard}
                                onChange={(e) => setIdCard(e.target.value.replace(/[^0-9]/g, ''))}
                                className="bg-white font-mono tracking-wider text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-xs">รหัสผ่าน</Label>
                                <Link href="/forgot-password" className="text-[10px] text-primary hover:underline" tabIndex={-1}>
                                    ลืมรหัสผ่าน?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white text-sm"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-3 pt-5 border-t border-border/50">
                        <Button type="submit" className="w-full text-sm font-semibold shadow-md shadow-primary/20" disabled={loading}>
                            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
                        </Button>
                        <div className="text-center text-xs text-muted-foreground w-full">
                            ยังไม่มีบัญชี?{" "}
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
