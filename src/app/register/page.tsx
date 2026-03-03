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
import { AlertCircle, CheckCircle2, UserPlus, ShieldCheck } from "lucide-react";
import { validateThaiId } from "@/lib/validateThaiId";

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

    // Field-level errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [otpCode, setOtpCode] = useState("");
    const [tempUserId, setTempUserId] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    // Client-side ID card handler — only numbers, validate on blur
    const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, idCard: value }));
        if (errors.idCard) {
            setErrors(prev => ({ ...prev, idCard: "" }));
        }
    };

    const handleIdCardBlur = () => {
        if (formData.idCard.length === 13) {
            if (!validateThaiId(formData.idCard)) {
                setErrors(prev => ({ ...prev, idCard: "เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" }));
            }
        } else if (formData.idCard.length > 0) {
            setErrors(prev => ({ ...prev, idCard: "เลขบัตรประชาชนต้องมี 13 หลัก" }));
        }
    };

    // Client-side validation
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.prefix) newErrors.prefix = "กรุณาเลือกคำนำหน้า";
        if (!formData.firstName.trim()) newErrors.firstName = "กรุณากรอกชื่อ";
        if (!formData.lastName.trim()) newErrors.lastName = "กรุณากรอกนามสกุล";
        if (!formData.studentId.trim()) newErrors.studentId = "กรุณากรอกรหัสนักเรียน";

        if (!formData.idCard) {
            newErrors.idCard = "กรุณากรอกเลขประจำตัวประชาชน";
        } else if (!validateThaiId(formData.idCard)) {
            newErrors.idCard = "เลขบัตรประชาชนไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";
        }

        if (!formData.email) {
            newErrors.email = "กรุณากรอกอีเมล";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        }

        if (!formData.password) {
            newErrors.password = "กรุณากรอกรหัสผ่าน";
        } else if (formData.password.length < 8) {
            newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!validateForm()) {
            toast.error("กรุณาตรวจสอบข้อมูลให้ครบถ้วนและถูกต้อง");
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
                toast.success("สมัครสมาชิกสำเร็จ! ระบบได้ส่ง OTP ไปยังอีเมลของคุณแล้ว");
                setTempUserId(data.userId);
                setStep(2);
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
            }
        } catch {
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
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    const FieldError = ({ field }: { field: string }) => {
        if (!errors[field]) return null;
        return (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />
                {errors[field]}
            </p>
        );
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4 flex justify-center">
            <div className="absolute top-1/2 left-3/4 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] opacity-30 -z-10 -translate-y-1/2" />

            <Card className="w-full max-w-2xl glass border-border/50 shadow-2xl h-fit animate-in fade-in slide-in-from-bottom-6 duration-700">
                {step === 1 ? (
                    <form onSubmit={handleRegister}>
                        <CardHeader className="text-center space-y-3 pb-6 border-b border-border/50">
                            <div className="mx-auto bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center text-primary">
                                <UserPlus className="w-7 h-7" />
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">ลงทะเบียนผู้ใช้ใหม่</CardTitle>
                            <CardDescription>
                                กรอกข้อมูลให้ครบถ้วนและถูกต้องตามความเป็นจริง
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">

                            {/* Row: Prefix + First + Last */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>คำนำหน้า <span className="text-destructive">*</span></Label>
                                    <Select onValueChange={(v) => handleSelectChange('prefix', v)}>
                                        <SelectTrigger className={`bg-background/50 ${errors.prefix ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="เลือก..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ด.ช.">เด็กชาย (ด.ช.)</SelectItem>
                                            <SelectItem value="ด.ญ.">เด็กหญิง (ด.ญ.)</SelectItem>
                                            <SelectItem value="นาย">นาย</SelectItem>
                                            <SelectItem value="นางสาว">นางสาว</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError field="prefix" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">ชื่อ <span className="text-destructive">*</span></Label>
                                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={`bg-background/50 ${errors.firstName ? 'border-destructive' : ''}`} placeholder="ชื่อ" />
                                    <FieldError field="firstName" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">นามสกุล <span className="text-destructive">*</span></Label>
                                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={`bg-background/50 ${errors.lastName ? 'border-destructive' : ''}`} placeholder="นามสกุล" />
                                    <FieldError field="lastName" />
                                </div>
                            </div>

                            {/* Row: ID Card + Student ID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="idCard">เลขประจำตัวประชาชน <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="idCard" name="idCard" value={formData.idCard}
                                        onChange={handleIdCardChange}
                                        onBlur={handleIdCardBlur}
                                        maxLength={13}
                                        className={`bg-background/50 font-mono tracking-wider ${errors.idCard ? 'border-destructive' : ''}`}
                                        placeholder="ตัวเลข 13 หลัก"
                                    />
                                    {errors.idCard ? (
                                        <FieldError field="idCard" />
                                    ) : formData.idCard.length === 13 && validateThaiId(formData.idCard) ? (
                                        <p className="text-xs text-success flex items-center gap-1 mt-1">
                                            <CheckCircle2 className="w-3 h-3" />
                                            เลขบัตรถูกต้อง
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">ระบบจะตรวจสอบความถูกต้องอัตโนมัติ</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="studentId">เลขประจำตัวนักเรียน <span className="text-destructive">*</span></Label>
                                    <Input id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} className={`bg-background/50 ${errors.studentId ? 'border-destructive' : ''}`} placeholder="เช่น 12345" />
                                    <FieldError field="studentId" />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email">ที่อยู่อีเมล (สำหรับรับ OTP) <span className="text-destructive">*</span></Label>
                                <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`bg-background/50 ${errors.email ? 'border-destructive' : ''}`} placeholder="example@gmail.com" />
                                <FieldError field="email" />
                            </div>

                            {/* Password */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">รหัสผ่าน <span className="text-destructive">*</span></Label>
                                    <Input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className={`bg-background/50 ${errors.password ? 'border-destructive' : ''}`} />
                                    {errors.password ? <FieldError field="password" /> : <p className="text-xs text-muted-foreground">ต้องมีอย่างน้อย 8 ตัวอักษร</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน <span className="text-destructive">*</span></Label>
                                    <Input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`bg-background/50 ${errors.confirmPassword ? 'border-destructive' : ''}`} />
                                    <FieldError field="confirmPassword" />
                                </div>
                            </div>

                            {/* Borrower Type */}
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
                                    ** หากเลือกรายใหม่ จะต้องกรอกฟอร์มขอกู้ยืมออนไลน์ (ระบุจุดประสงค์, เกรด, ทุน) อีกครั้งในขั้นตอนต่อไป
                                </p>
                            </div>

                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 border-t border-border/50 pt-6">
                            <Button type="submit" size="lg" className="w-full text-base font-semibold shadow-lg shadow-primary/20" disabled={loading}>
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
                        <CardHeader className="text-center space-y-3 pb-6 border-b border-border/50">
                            <div className="mx-auto bg-success/10 p-3 rounded-full w-14 h-14 flex items-center justify-center text-success">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">ยืนยันรหัส OTP</CardTitle>
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
                                    className="bg-background/50 text-center text-3xl tracking-widest h-16 font-mono"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-6">
                            <Button type="submit" size="lg" className="w-full text-base font-semibold shadow-lg shadow-primary/20" disabled={loading}>
                                {loading ? "กำลังยืนยัน..." : "ยืนยันและเข้าใช้งาน"}
                            </Button>
                            <div className="text-center space-y-2">
                                <p className="text-xs text-muted-foreground">
                                    ไม่ได้รับอีเมล? ลองตรวจสอบโฟลเดอร์ <strong>"สแปม (Spam/Junk)"</strong> ด้วย
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleRegister()}
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
