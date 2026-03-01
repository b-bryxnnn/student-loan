"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        prefix: "",
        firstName: "",
        lastName: "",
        studentId: "",
        idCard: "",
        email: "",
        password: "",
        confirmPassword: "",
        borrowerType: "NEW" // NEW or OLD
    });

    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [tempUserId, setTempUserId] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("รหัสผ่านไม่ตรงกัน");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("สมัครสมาชิกเบื้องต้นสำเร็จ ระบบได้ส่ง OTP ไปยังอีเมลของคุณแล้ว");
                setTempUserId(data.userId);
                setStep(2); // Go to OTP Step
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: tempUserId, otp: otpCode }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success("ยืนยันตัวตนสำเร็จ กำลังเข้าสู่ระบบ...");
                router.push("/dashboard");
            } else {
                toast.error(data.error || "OTP ไม่ถูกต้อง");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 px-4 flex justify-center">
            <div className="absolute top-1/2 left-3/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] opacity-30 -z-10 -translate-y-1/2" />

            <Card className="w-full max-w-2xl glass border-border/50 shadow-2xl hover-lift h-fit">
                {step === 1 ? (
                    <form onSubmit={handleRegister}>
                        <CardHeader className="text-center space-y-2 pb-6 border-b border-border/50">
                            <CardTitle className="text-3xl font-extrabold tracking-tight">ลงทะเบียนผู้ใช้ใหม่</CardTitle>
                            <CardDescription>
                                กรอกข้อมูลให้ครบถ้วนและถูกต้องตามความเป็นจริง
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>คำนำหน้า</Label>
                                    <Select onValueChange={(v) => handleSelectChange('prefix', v)} required>
                                        <SelectTrigger className="bg-background/50">
                                            <SelectValue placeholder="เลือกคำนำหน้า" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ด.ช.">เด็กชาย (ด.ช.)</SelectItem>
                                            <SelectItem value="ด.ญ.">เด็กหญิง (ด.ญ.)</SelectItem>
                                            <SelectItem value="นาย">นาย</SelectItem>
                                            <SelectItem value="นางสาว">นางสาว</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">ชื่อ</Label>
                                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className="bg-background/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">นามสกุล</Label>
                                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className="bg-background/50" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="idCard">เลขประจำตัวประชาชน</Label>
                                    <Input
                                        id="idCard" name="idCard" value={formData.idCard} onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value.replace(/[^0-9]/g, ''), name: 'idCard' } } as any)}
                                        maxLength={13} minLength={13} required className="bg-background/50" placeholder="ตัวเลข 13 หลักตั้งติดกัน"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="studentId">เลขประจำตัวนักเรียน (ไม่บังคับ)</Label>
                                    <Input id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} className="bg-background/50" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">ที่อยู่อีเมล (สำหรับรับ OTP)</Label>
                                <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="bg-background/50" placeholder="exampe@school.ac.th / @gmail.com" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">รหัสผ่าน</Label>
                                    <Input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} className="bg-background/50" />
                                    <p className="text-xs text-muted-foreground">ต้องมีอย่างน้อย 8 ตัวอักษร</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
                                    <Input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="bg-background/50" />
                                </div>
                            </div>

                            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                                <Label className="text-base mb-2 block">สถานะผู้กู้ยืม</Label>
                                <Select onValueChange={(v) => handleSelectChange('borrowerType', v)} defaultValue="NEW">
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder="เลือกประเภท..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">ผู้กู้รายใหม่ (แบบยืนยัน และ สัญญา)</SelectItem>
                                        <SelectItem value="OLD">ผู้กู้รายเก่าเลื่อนชั้นปี/ย้ายสถานศึกษา (แบบยืนยัน)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-2">
                                    ** หากเลือกรายใหม่ คุณจะต้องกรอกฟอร์มขอกู้ยืมออนไลน์ (ระบุจุดประสงค์, เกรด, ทุน) อีกครั้งในขั้นตอนต่อไป
                                </p>
                            </div>

                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 border-t border-border/50 pt-6">
                            <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={loading}>
                                {loading ? "กำลังส่งข้อมูล..." : "สมัครสมาชิกและรับรหัส OTP"}
                            </Button>
                            <div className="text-center text-sm text-muted-foreground w-full">
                                มีบัญชีอยู่แล้ว?{" "}
                                <Link href="/login" className="text-primary hover:underline font-semibold">
                                    เข้าสู่ระบบ
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP}>
                        <CardHeader className="text-center space-y-2 pb-6 border-b border-border/50">
                            <CardTitle className="text-3xl font-extrabold tracking-tight">ยืนยันรหัส OTP</CardTitle>
                            <CardDescription>
                                ระบบได้ส่งรหัส 6 หลักไปยังอีเมล <strong>{formData.email}</strong> แล้ว
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6 flex flex-col items-center">
                            <div className="space-y-2 w-full max-w-xs text-center">
                                <Label htmlFor="otpCode">รหัสผ่านชั่วคราว (OTP)</Label>
                                <Input
                                    id="otpCode"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    maxLength={6}
                                    required
                                    className="bg-background/50 text-center text-3xl tracking-widest h-16 uppercase"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-6">
                            <Button type="submit" size="lg" className="w-full text-base font-semibold" disabled={loading}>
                                {loading ? "กำลังยืนยัน..." : "ยืนยันและเข้าใช้งาน"}
                            </Button>
                            <div className="text-center space-y-2">
                                <p className="text-xs text-muted-foreground">
                                    ไม่ได้รับอีเมล? ลองตรวจสอบโฟลเดอร์ <strong>"สแปม (Spam/Junk)"</strong> ด้วยนะคะ
                                </p>
                                <button
                                    type="button"
                                    onClick={handleRegister}
                                    disabled={loading}
                                    className="text-sm text-primary hover:underline disabled:opacity-50"
                                >
                                    ขอ OTP ใหม่อีกครั้ง
                                </button>
                            </div>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
