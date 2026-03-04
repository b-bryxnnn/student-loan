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
        gradeLevel: "",
        idCard: "",
        email: "",
        password: "",
        confirmPassword: "",
        borrowerType: "NEW"
    });

    // Field-level errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [otpCode, setOtpCode] = useState("");
    const [tempUserId, setTempUserId] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    // ID card — only numbers, validate on blur
    const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, idCard: value }));
        if (errors.idCard) {
            setErrors(prev => ({ ...prev, idCard: "" }));
        }
    };

    const handleIdCardBlur = () => {
        if (formData.idCard.length > 0 && formData.idCard.length !== 13) {
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
        if (!formData.gradeLevel) newErrors.gradeLevel = "กรุณาเลือกระดับชั้น";

        if (!formData.idCard) {
            newErrors.idCard = "กรุณากรอกเลขประจำตัวประชาชน";
        } else if (formData.idCard.length !== 13) {
            newErrors.idCard = "เลขบัตรประชาชนต้องมี 13 หลัก";
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
                <AlertCircle className="w-3 h-3 shrink-0" />
                {errors[field]}
            </p>
        );
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-10 px-4 flex justify-center">
            <Card className="w-full max-w-2xl border-primary/10 shadow-lg h-fit gradient-border animate-in fade-in slide-in-from-bottom-6 duration-700">
                {step === 1 ? (
                    <form onSubmit={handleRegister}>
                        <CardHeader className="text-center space-y-2 pb-5 border-b border-border/50">
                            <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center text-primary ring-2 ring-warning/20">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">ลงทะเบียนผู้ใช้ใหม่</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                กรอกข้อมูลให้ครบถ้วนและถูกต้อง
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5">

                            {/* Row: Prefix + First + Last */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">คำนำหน้า <span className="text-destructive">*</span></Label>
                                    <Select onValueChange={(v) => handleSelectChange('prefix', v)}>
                                        <SelectTrigger className={`bg-white text-sm ${errors.prefix ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="เลือก" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4}>
                                            <SelectItem value="ด.ช.">ด.ช.</SelectItem>
                                            <SelectItem value="ด.ญ.">ด.ญ.</SelectItem>
                                            <SelectItem value="นาย">นาย</SelectItem>
                                            <SelectItem value="นางสาว">นางสาว</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError field="prefix" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="firstName" className="text-xs">ชื่อ <span className="text-destructive">*</span></Label>
                                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} className={`bg-white text-sm ${errors.firstName ? 'border-destructive' : ''}`} placeholder="ชื่อ" />
                                    <FieldError field="firstName" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="lastName" className="text-xs">นามสกุล <span className="text-destructive">*</span></Label>
                                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} className={`bg-white text-sm ${errors.lastName ? 'border-destructive' : ''}`} placeholder="นามสกุล" />
                                    <FieldError field="lastName" />
                                </div>
                            </div>

                            {/* Row: Student ID + Grade Level */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="studentId" className="text-xs">เลขประจำตัวนักเรียน <span className="text-destructive">*</span></Label>
                                    <Input id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} className={`bg-white text-sm ${errors.studentId ? 'border-destructive' : ''}`} placeholder="เช่น 12345" />
                                    <FieldError field="studentId" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">ระดับชั้น <span className="text-destructive">*</span></Label>
                                    <Select onValueChange={(v) => handleSelectChange('gradeLevel', v)}>
                                        <SelectTrigger className={`bg-white text-sm ${errors.gradeLevel ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder="เลือกระดับชั้น" />
                                        </SelectTrigger>
                                        <SelectContent position="popper" sideOffset={4}>
                                            <SelectItem value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</SelectItem>
                                            <SelectItem value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</SelectItem>
                                            <SelectItem value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FieldError field="gradeLevel" />
                                </div>
                            </div>

                            {/* ID Card */}
                            <div className="space-y-1.5">
                                <Label htmlFor="idCard" className="text-xs">เลขประจำตัวประชาชน <span className="text-destructive">*</span></Label>
                                <Input
                                    id="idCard" name="idCard" value={formData.idCard}
                                    onChange={handleIdCardChange}
                                    onBlur={handleIdCardBlur}
                                    maxLength={13}
                                    inputMode="numeric"
                                    className={`bg-white font-mono tracking-wider text-sm ${errors.idCard ? 'border-destructive' : ''}`}
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
                                    <p className="text-[10px] text-muted-foreground">ระบบจะตรวจสอบความถูกต้องอัตโนมัติ</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs">อีเมล (สำหรับรับ OTP) <span className="text-destructive">*</span></Label>
                                <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`bg-white text-sm ${errors.email ? 'border-destructive' : ''}`} placeholder="example@gmail.com" />
                                <FieldError field="email" />
                            </div>

                            {/* Password */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="password" className="text-xs">รหัสผ่าน <span className="text-destructive">*</span></Label>
                                    <Input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className={`bg-white text-sm ${errors.password ? 'border-destructive' : ''}`} />
                                    {errors.password ? <FieldError field="password" /> : <p className="text-[10px] text-muted-foreground">อย่างน้อย 8 ตัวอักษร</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirmPassword" className="text-xs">ยืนยันรหัสผ่าน <span className="text-destructive">*</span></Label>
                                    <Input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={`bg-white text-sm ${errors.confirmPassword ? 'border-destructive' : ''}`} />
                                    <FieldError field="confirmPassword" />
                                </div>
                            </div>

                            {/* Borrower Type */}
                            <div className="bg-muted/30 p-3 sm:p-4 rounded-lg border border-border/50">
                                <Label className="text-xs sm:text-sm mb-2 block font-semibold">สถานะผู้กู้ยืม</Label>
                                <Select onValueChange={(v) => handleSelectChange('borrowerType', v)} defaultValue="NEW">
                                    <SelectTrigger className="bg-white text-sm">
                                        <SelectValue placeholder="เลือกประเภท..." />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="NEW">ผู้กู้รายใหม่ (ยังไม่เคยกู้ กยศ. มาก่อน)</SelectItem>
                                        <SelectItem value="OLD">ผู้กู้รายเก่า (เคยกู้ กยศ. มาก่อนหน้านี้แล้ว)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    ผู้กู้รายใหม่จะต้องกรอกฟอร์มขอกู้ยืมออนไลน์เพิ่มเติมในขั้นตอนต่อไป
                                </p>
                            </div>

                        </CardContent>
                        <CardFooter className="flex flex-col space-y-3 border-t border-border/50 pt-5">
                            <Button type="submit" size="lg" className="w-full text-sm font-semibold shadow-md shadow-primary/20" disabled={loading}>
                                {loading ? "กำลังส่งข้อมูล..." : "สมัครสมาชิกและรับรหัส OTP"}
                            </Button>
                            <div className="text-center text-xs text-muted-foreground w-full">
                                มีบัญชีอยู่แล้ว?{" "}
                                <Link href="/login" className="text-primary hover:underline font-semibold">
                                    เข้าสู่ระบบ
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP}>
                        <CardHeader className="text-center space-y-2 pb-5 border-b border-border/50">
                            <div className="mx-auto bg-success/10 p-3 rounded-full w-12 h-12 flex items-center justify-center text-success">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">ยืนยันรหัส OTP</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                ระบบได้ส่งรหัส 6 หลักไปยัง <strong>{formData.email}</strong> แล้ว
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5 flex flex-col items-center">
                            <div className="space-y-1.5 w-full max-w-xs text-center">
                                <Label htmlFor="otpCode" className="text-xs">รหัส OTP</Label>
                                <Input
                                    id="otpCode"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    maxLength={6}
                                    inputMode="numeric"
                                    required
                                    className="bg-white text-center text-2xl tracking-widest h-14 font-mono"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-3 pt-5">
                            <Button type="submit" size="lg" className="w-full text-sm font-semibold shadow-md shadow-primary/20" disabled={loading}>
                                {loading ? "กำลังยืนยัน..." : "ยืนยันและเข้าใช้งาน"}
                            </Button>
                            <div className="text-center space-y-1.5">
                                <p className="text-[10px] text-muted-foreground">
                                    ไม่ได้รับอีเมล? ตรวจสอบโฟลเดอร์ &quot;สแปม (Spam/Junk)&quot; ด้วย
                                </p>
                                <button
                                    type="button"
                                    onClick={() => handleRegister()}
                                    disabled={loading}
                                    className="text-xs text-primary hover:underline disabled:opacity-50"
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
