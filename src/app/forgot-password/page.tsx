"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldAlert, Mail, KeyRound, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);

    // States
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleRequestOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("กรุณากรอกอีเมล");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                setStep(2); // Go to OTP and reset step
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("การเชื่อมต่อมีปัญหา");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error("กรุณากรอก OTP ให้ครบ 6 หลัก");
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

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                router.push("/login?reset=success");
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("การเชื่อมต่อมีปัญหา");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 min-h-[80vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">

            <div className="mb-8 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <ShieldAlert className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    กู้คืนรหัสผ่าน
                </h1>
                <p className="text-muted-foreground mt-2">ระบบกู้ยืมเงิน กยศ. โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</p>
            </div>

            <Card className="w-full max-w-md glass border-white/20 shadow-xl overflow-hidden relative group">
                {/* Decorative gradients */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors duration-500"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-500"></div>

                {step === 1 ? (
                    <form onSubmit={handleRequestOTP} className="relative z-10">
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <KeyRound className="w-5 h-5 text-primary" /> ขอรหัสผ่านใหม่
                            </CardTitle>
                            <CardDescription>
                                กรอกอีเมลที่คุณใช้ลงทะเบียนเพื่อรับรหัส OTP สำหรับตั้งรหัสผ่านใหม่
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" /> อีเมล
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-background/50 border-white/10 focus:border-primary/50"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button type="submit" className="w-full shadow-lg shadow-primary/25 hover-lift" disabled={loading}>
                                {loading ? "กำลังส่งข้อมูล..." : "ส่งรหัส OTP"}
                            </Button>
                            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                <ArrowLeft className="w-3 h-3" /> กลับไปหน้าเข้าสู่ระบบ
                            </Link>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="relative z-10 animate-in slide-in-from-right-8 duration-300">
                        <CardHeader>
                            <CardTitle className="text-2xl">ตั้งรหัสผ่านใหม่</CardTitle>
                            <CardDescription>
                                กรอกรหัส OTP ที่ได้รับทางอีเมล <span className="text-primary font-medium">{email}</span> และตั้งรหัสผ่านใหม่
                                <br />
                                <span className="text-xs text-muted-foreground">ไม่ได้รับอีเมล? ลองตรวจโฟลเดอร์ <strong>"สแปม (Spam/Junk)"</strong> ด้วยนะคะ</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label className="flex justify-center">รหัส OTP 6 หลัก</Label>
                                <div className="flex justify-center">
                                    <InputOTP maxLength={6} value={otp} onChange={setOtp} required>
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} className="w-10 h-12 text-lg bg-background/50 border-primary/20" />
                                            <InputOTPSlot index={1} className="w-10 h-12 text-lg bg-background/50 border-primary/20" />
                                            <InputOTPSlot index={2} className="w-10 h-12 text-lg bg-background/50 border-primary/20" />
                                            <InputOTPSlot index={3} className="w-10 h-12 text-lg bg-background/50 border-primary/20" />
                                            <InputOTPSlot index={4} className="w-10 h-12 text-lg bg-background/50 border-primary/20" />
                                            <InputOTPSlot index={5} className="w-10 h-12 text-lg bg-background/50 border-primary/20" />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-border/50">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password" className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-muted-foreground" /> รหัสผ่านใหม่
                                    </Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        required
                                        minLength={8}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-background/50"
                                    />
                                    <p className="text-xs text-muted-foreground">ต้องมีความยาวอย่างน้อย 8 ตัวอักษร</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password" className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-muted-foreground" /> ยืนยันรหัสผ่านใหม่
                                    </Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        required
                                        minLength={8}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3">
                            <Button type="submit" className="w-full shadow-lg shadow-primary/25 hover-lift" disabled={loading}>
                                {loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
                            </Button>
                            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                ขอ OTP ใหม่อีกครั้ง
                            </button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
