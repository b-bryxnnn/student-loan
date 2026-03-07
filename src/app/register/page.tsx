"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, UserPlus, ShieldCheck, Camera, CreditCard, FileCheck, ChevronRight, ChevronLeft, Upload, ScrollText } from "lucide-react";
import { validateThaiId } from "@/lib/validateThaiId";
import FaceLiveness from "@/components/FaceLiveness";
import { createWorker } from 'tesseract.js';

// ====== PDPA agreement text ======
const PDPA_TEXT = `ประกาศความเป็นส่วนตัว (Privacy Notice) — ระบบส่งเอกสาร กยศ.
โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง

1. ผู้ควบคุมข้อมูลส่วนบุคคล
โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง เป็นผู้ควบคุมข้อมูลส่วนบุคคลตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)

2. ข้อมูลส่วนบุคคลที่จัดเก็บ
ระบบจัดเก็บข้อมูลดังต่อไปนี้เพื่อประกอบการพิจารณาคำขอกู้ยืมเงิน กยศ.:
- ชื่อ-นามสกุล, คำนำหน้า, เลขประจำตัวประชาชน
- เลขประจำตัวนักเรียน, ระดับชั้น
- อีเมล, เบอร์โทรศัพท์
- ภาพถ่ายบัตรประจำตัวประชาชน
- ภาพถ่ายใบหน้า (จากการยืนยันตัวตน)
- ผลการเรียน (GPAX, ปพ.1)
- ข้อมูลทางการเงิน (รายได้ครอบครัว, ทุนการศึกษา)
- เอกสารสัญญากู้ยืมเงินและแบบยืนยันเบิกเงิน

3. วัตถุประสงค์ในการจัดเก็บ
- เพื่อดำเนินการเกี่ยวกับการขอกู้ยืมเงินกองทุน กยศ.
- เพื่อตรวจสอบคุณสมบัติผู้กู้ยืม
- เพื่อยืนยันตัวตนของผู้กู้ยืม
- เพื่อติดต่อสื่อสารและแจ้งข้อมูลที่เกี่ยวข้อง

4. ระยะเวลาการจัดเก็บ
ข้อมูลจะถูกจัดเก็บตลอดระยะเวลาที่นักเรียนยังคงสถานะผู้กู้ยืม และจะถูกลบภายใน 1 ปีหลังจากสิ้นสุดสถานะ เว้นแต่จะมีความจำเป็นตามกฎหมาย

5. สิทธิของเจ้าของข้อมูล
ท่านมีสิทธิในการเข้าถึง แก้ไข ขอรับสำเนา คัดค้าน และขอให้ลบข้อมูลของท่านได้ โดยติดต่อผ่านงาน กยศ. ของโรงเรียน

6. การเปิดเผยข้อมูล
ข้อมูลอาจถูกส่งต่อให้กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) เท่านั้น เพื่อประกอบการพิจารณาคำขอกู้ยืม`;

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1=id 2=info 3=face 4=consent 5=otp
    const [loading, setLoading] = useState(false);
    const [isOcrProcessing, setIsOcrProcessing] = useState(false);
    const idCardInputRef = useRef<HTMLInputElement>(null);

    // Form Data
    const [formData, setFormData] = useState({
        prefix: "",
        firstName: "",
        lastName: "",
        studentId: "",
        gradeLevel: "",
        idCard: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        borrowerType: "NEW",
    });

    // Images
    const [idCardImage, setIdCardImage] = useState<string | null>(null);
    const [faceImage, setFaceImage] = useState<string | null>(null);

    // Consent
    const [consentParent, setConsentParent] = useState(false);
    const [consentLoan, setConsentLoan] = useState(false);
    const [consentPdpa, setConsentPdpa] = useState(false);

    // OTP
    const [otpCode, setOtpCode] = useState("");
    const [tempUserId, setTempUserId] = useState("");

    // Errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    };

    const handleIdCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, idCard: value }));
        if (errors.idCard) setErrors(prev => ({ ...prev, idCard: "" }));
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, phone: value }));
    };

    // ====== ID Card Photo & OCR ======
    const handleIdCardPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("ขนาดไฟล์ต้องไม่เกิน 5MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            setIdCardImage(base64);

            // Auto OCR Processing
            setIsOcrProcessing(true);
            toast.info("กำลังดึงข้อมูลจากบัตร โปรดรอสักครู่...", { duration: 5000 });
            try {
                const worker = await createWorker('tha+eng');
                const ret = await worker.recognize(base64);
                const text = ret.data.text;
                await worker.terminate();

                const idCardMatch = text.match(/\b[1-9]\s?\d{4}\s?\d{5}\s?\d{2}\s?\d\b/);
                const idCardNumber = idCardMatch ? idCardMatch[0].replace(/\s+/g, '') : '';

                let prefix = '';
                let firstName = '';
                let lastName = '';

                const thaiNameRegex = /(นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)\s*([ก-๙]+)\s+([ก-๙]+)/;
                const nameMatch = text.match(thaiNameRegex);

                if (nameMatch) {
                    prefix = nameMatch[1];
                    firstName = nameMatch[2];
                    lastName = nameMatch[3];
                }

                if (idCardNumber || firstName) {
                    if (idCardNumber) handleIdCardChange({ target: { value: idCardNumber } } as any);
                    if (prefix) handleSelectChange('prefix', prefix);
                    if (firstName) handleChange({ target: { name: 'firstName', value: firstName } } as any);
                    if (lastName) handleChange({ target: { name: 'lastName', value: lastName } } as any);

                    toast.success("ดึงข้อมูลจากบัตรสำเร็จ กรุณาตรวจสอบความถูกต้อง");
                    setTimeout(() => setStep(2), 1500); // Auto go to next step
                } else {
                    toast.error("อ่านข้อมูลไม่สำเร็จ กรุณากรอกข้อมูลด้วยตนเอง");
                    setTimeout(() => setStep(2), 1500); // Auto go to next step anyway
                }
            } catch (err) {
                console.error("OCR Error:", err);
                toast.error("เกิดข้อผิดพลาดในการดึงข้อมูล กรุณากรอกด้วยตนเอง");
                setTimeout(() => setStep(2), 1500); // Auto go to next step anyway
            } finally {
                setIsOcrProcessing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    // ====== Validation ======
    const validateStep1 = (): boolean => {
        if (!idCardImage) { toast.error("กรุณาถ่ายรูปบัตรประชาชน"); return false; }
        return true;
    };

    const validateStep2 = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.prefix) newErrors.prefix = "กรุณาเลือกคำนำหน้า";
        if (!formData.firstName.trim()) newErrors.firstName = "กรุณากรอกชื่อ";
        if (!formData.lastName.trim()) newErrors.lastName = "กรุณากรอกนามสกุล";
        if (!formData.studentId.trim()) newErrors.studentId = "กรุณากรอกรหัสนักเรียน";
        if (!formData.gradeLevel) newErrors.gradeLevel = "กรุณาเลือกระดับชั้น";
        if (!formData.idCard) newErrors.idCard = "กรุณากรอกเลขประจำตัวประชาชน";
        else if (formData.idCard.length !== 13) newErrors.idCard = "เลขบัตรประชาชนต้องมี 13 หลัก";
        if (!formData.phone) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
        else if (!/^0\d{8,9}$/.test(formData.phone)) newErrors.phone = "รูปแบบเบอร์โทรไม่ถูกต้อง";
        if (!formData.email) newErrors.email = "กรุณากรอกอีเมล";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
        if (!formData.password) newErrors.password = "กรุณากรอกรหัสผ่าน";
        else if (formData.password.length < 8) newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = (): boolean => {
        if (!faceImage) { toast.error("กรุณายืนยันตัวตนด้วยใบหน้า"); return false; }
        return true;
    };

    const validateStep4 = (): boolean => {
        if (!consentParent || !consentLoan || !consentPdpa) {
            toast.error("กรุณายอมรับเงื่อนไขทั้ง 3 ข้อก่อนดำเนินการต่อ");
            return false;
        }
        return true;
    };

    const goNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) { toast.error("กรุณาตรวจสอบข้อมูลให้ครบถ้วน"); return; }
        if (step === 3 && !validateStep3()) return;
        if (step === 4) { if (!validateStep4()) return; handleRegister(); return; }
        setStep(prev => prev + 1);
    };

    const goBack = () => { if (step > 1) setStep(prev => prev - 1); };

    // ====== Register ======
    const handleRegister = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    idCardImage,
                    faceImage,
                    consentParent,
                    consentLoan,
                    consentPdpa,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("ระบบได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว");
                setTempUserId(data.userId);
                setStep(5);
            } else {
                toast.error(data.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    // ====== Verify OTP ======
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
                <AlertCircle className="w-3 h-3 shrink-0" />{errors[field]}
            </p>
        );
    };

    // Step indicator
    const STEPS = [
        { num: 1, label: "สแกนบัตร", icon: CreditCard },
        { num: 2, label: "ข้อมูลส่วนตัว", icon: UserPlus },
        { num: 3, label: "สแกนหน้า", icon: Camera },
        { num: 4, label: "เงื่อนไข", icon: ScrollText },
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] py-6 sm:py-10 px-4 flex justify-center">
            <Card className="w-full max-w-2xl border-primary/10 shadow-lg h-fit gradient-border animate-in fade-in slide-in-from-bottom-6 duration-700">

                {/* Step indicator */}
                <div className="px-6 pt-5 pb-2">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        {STEPS.map(({ num, label, icon: Icon }) => (
                            <div key={num} className="flex flex-col items-center gap-1">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= num ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground"
                                    }`}>
                                    {step > num ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                </div>
                                <span className={`text-[9px] sm:text-[10px] font-medium ${step >= num ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ====================== STEP 1: ID Card ====================== */}
                {step === 1 && (
                    <>
                        <CardHeader className="text-center space-y-1 pb-3 border-b border-border/50">
                            <CardTitle className="text-xl font-bold tracking-tight">อัปโหลดบัตรประชาชน</CardTitle>
                            <CardDescription className="text-xs">ถ่ายรูปบัตรประชาชนเพื่อให้ระบบกรอกข้อมูลเบื้องต้นให้คุณอัติโนมัติ</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-5">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    ถ่ายรูปบัตรประจำตัวประชาชน <span className="text-destructive">*</span>
                                </div>
                                <p className="text-xs text-muted-foreground">ถ่ายรูปด้านหน้าบัตรให้ชัดเจน เห็นข้อมูลครบถ้วน (JPG/PNG ไม่เกิน 5MB)</p>

                                {idCardImage ? (
                                    <div className="space-y-4">
                                        <div className="relative rounded-lg overflow-hidden border border-primary/20 max-w-sm mx-auto">
                                            <img src={idCardImage} alt="บัตรประชาชน" className="w-full h-auto opacity-70" />
                                            {isOcrProcessing && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                                    <p className="text-white text-xs font-semibold">กำลังดึงข้อมูล...</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center gap-3">
                                            <Button variant="ghost" size="sm" onClick={() => { setIdCardImage(null); if (idCardInputRef.current) idCardInputRef.current.value = ""; }} className="text-xs" disabled={isOcrProcessing}>
                                                ถ่ายรูปบัตรใหม่
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="border-2 border-dashed border-primary/20 rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
                                        onClick={() => idCardInputRef.current?.click()}
                                    >
                                        <Upload className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">คลิกเพื่ออัปโหลดหรือถ่ายรูประบบจะช่วยกรอกข้อมูลอัตโนมัติ</p>
                                    </div>
                                )}
                                <input
                                    ref={idCardInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleIdCardPhoto}
                                    className="hidden"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-3 border-t border-border/50 pt-5">
                            <Button type="button" size="lg" className="w-full text-sm font-semibold shadow-md shadow-primary/20" onClick={goNext} disabled={isOcrProcessing}>
                                ถัดไป — กรอก/ตรวจสอบข้อมูลส่วนตัว <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                            <div className="text-center text-xs text-muted-foreground w-full">
                                มีบัญชีอยู่แล้ว? <Link href="/login" className="text-primary hover:underline font-semibold">เข้าสู่ระบบ</Link>
                            </div>
                        </CardFooter>
                    </>
                )}

                {/* ====================== STEP 2: Personal Info ====================== */}
                {step === 2 && (
                    <>
                        <CardHeader className="text-center space-y-1 pb-3 border-b border-border/50">
                            <CardTitle className="text-xl font-bold tracking-tight">ข้อมูลส่วนตัว</CardTitle>
                            <CardDescription className="text-xs">กรอกข้อมูลให้ครบถ้วนและถูกต้องตามจริง</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-5">
                            {/* Prefix + Name */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">คำนำหน้า <span className="text-destructive">*</span></Label>
                                    <Select onValueChange={(v) => handleSelectChange('prefix', v)} value={formData.prefix || undefined}>
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

                            {/* Student ID + Grade */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="studentId" className="text-xs">เลขประจำตัวนักเรียน <span className="text-destructive">*</span></Label>
                                    <Input id="studentId" name="studentId" value={formData.studentId} onChange={handleChange} className={`bg-white text-sm ${errors.studentId ? 'border-destructive' : ''}`} placeholder="เช่น 12345" />
                                    <FieldError field="studentId" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">ระดับชั้น <span className="text-destructive">*</span></Label>
                                    <Select onValueChange={(v) => handleSelectChange('gradeLevel', v)} value={formData.gradeLevel || undefined}>
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

                            {/* ID Card + Phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="idCard" className="text-xs">เลขประจำตัวประชาชน <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="idCard" name="idCard" value={formData.idCard}
                                        onChange={handleIdCardChange} maxLength={13} inputMode="numeric"
                                        className={`bg-white font-mono tracking-wider text-sm ${errors.idCard ? 'border-destructive' : ''}`}
                                        placeholder="ตัวเลข 13 หลัก"
                                    />
                                    {errors.idCard ? <FieldError field="idCard" /> : formData.idCard.length === 13 && validateThaiId(formData.idCard) ? (
                                        <p className="text-xs text-success flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3" /> เลขบัตรถูกต้อง</p>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground">ระบบจะตรวจสอบอัตโนมัติ</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="phone" className="text-xs">เบอร์โทรศัพท์ <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="phone" name="phone" value={formData.phone}
                                        onChange={handlePhoneChange} maxLength={10} inputMode="numeric"
                                        className={`bg-white text-sm ${errors.phone ? 'border-destructive' : ''}`} placeholder="0812345678"
                                    />
                                    <FieldError field="phone" />
                                </div>
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
                                        <SelectItem value="OLD">ผู้กู้รายเก่า (เคยกู้ กยศ. มาก่อนแล้ว)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 border-t border-border/50 pt-5">
                            <Button variant="outline" onClick={goBack} className="flex-1">
                                <ChevronLeft className="w-4 h-4 mr-1" /> ย้อนกลับ
                            </Button>
                            <Button type="button" onClick={goNext} className="flex-1 shadow-md shadow-primary/20">
                                ถัดไป — ยืนยันตัวตน <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {/* ====================== STEP 3: Face Liveness ====================== */}
                {step === 3 && (
                    <>
                        <CardHeader className="text-center space-y-1 pb-3 border-b border-border/50">
                            <CardTitle className="text-xl font-bold tracking-tight">สแกนใบหน้า</CardTitle>
                            <CardDescription className="text-xs">สแกนใบหน้าเพื่อยืนยันตัวตน ป้องกันการสวมรอย</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-5">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <Camera className="w-4 h-4 text-primary" />
                                    ถ่ายภาพใบหน้า <span className="text-destructive">*</span>
                                </div>
                                <FaceLiveness
                                    onComplete={(img) => setFaceImage(img)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 border-t border-border/50 pt-5">
                            <Button variant="outline" onClick={goBack} className="flex-1">
                                <ChevronLeft className="w-4 h-4 mr-1" /> ย้อนกลับ
                            </Button>
                            <Button onClick={goNext} className="flex-1 shadow-md shadow-primary/20">
                                ถัดไป — เงื่อนไข <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardFooter>
                    </>
                )}

                {/* ====================== STEP 4: Consent ====================== */}
                {step === 4 && (
                    <>
                        <CardHeader className="text-center space-y-1 pb-3 border-b border-border/50">
                            <CardTitle className="text-xl font-bold tracking-tight">ข้อตกลงและเงื่อนไข</CardTitle>
                            <CardDescription className="text-xs">กรุณาอ่านและยอมรับเงื่อนไขทั้ง 3 ข้อ จึงจะสามารถดำเนินการต่อได้</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-5">

                            {/* Consent 1: Parent */}
                            <div className="flex items-start space-x-3 bg-muted/30 p-3 sm:p-4 rounded-lg border border-border/50">
                                <Checkbox id="consent1" checked={consentParent} onCheckedChange={(v) => setConsentParent(!!v)} className="mt-0.5" />
                                <div className="space-y-1">
                                    <label htmlFor="consent1" className="text-sm font-semibold cursor-pointer leading-tight">
                                        ผู้ปกครองรับทราบและอนุญาตแล้ว
                                    </label>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        ข้าพเจ้ายืนยันว่าบิดา มารดา หรือผู้ปกครองตามกฎหมายของข้าพเจ้า ได้รับทราบและอนุญาตให้ข้าพเจ้าดำเนินการยื่นคำขอกู้ยืมเงินจากกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) แล้ว
                                    </p>
                                </div>
                            </div>

                            {/* Consent 2: Loan amount */}
                            <div className="flex items-start space-x-3 bg-muted/30 p-3 sm:p-4 rounded-lg border border-border/50">
                                <Checkbox id="consent2" checked={consentLoan} onCheckedChange={(v) => setConsentLoan(!!v)} className="mt-0.5" />
                                <div className="space-y-1">
                                    <label htmlFor="consent2" className="text-sm font-semibold cursor-pointer leading-tight">
                                        รับทราบวงเงินค่าครองชีพ
                                    </label>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        ข้าพเจ้ารับทราบว่าโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง ในฐานะสถานศึกษาของรัฐ ให้กู้ยืมเฉพาะ<strong className="text-foreground">ค่าครองชีพ จำนวน 1,800 บาทต่อเดือน (21,600 บาทต่อปี)</strong> ค่าเล่าเรียนจะได้รับการสนับสนุนจากรัฐบาลโดยตรง
                                    </p>
                                </div>
                            </div>

                            {/* Consent 3: PDPA */}
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3 bg-muted/30 p-3 sm:p-4 rounded-lg border border-border/50">
                                    <Checkbox id="consent3" checked={consentPdpa} onCheckedChange={(v) => setConsentPdpa(!!v)} className="mt-0.5" />
                                    <div className="space-y-1">
                                        <label htmlFor="consent3" className="text-sm font-semibold cursor-pointer leading-tight">
                                            ยินยอมให้จัดเก็บและใช้ข้อมูลส่วนบุคคล (PDPA)
                                        </label>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            ข้าพเจ้าได้อ่านและทำความเข้าใจประกาศความเป็นส่วนตัว (Privacy Notice) ด้านล่างนี้แล้ว และ<strong className="text-foreground">ให้ความยินยอม</strong>ในการจัดเก็บ ใช้ และเปิดเผยข้อมูลส่วนบุคคลตามวัตถุประสงค์ที่ระบุ
                                        </p>
                                    </div>
                                </div>
                                {/* PDPA Full text scroll area */}
                                <div className="bg-white border border-border rounded-lg max-h-48 overflow-y-auto p-4">
                                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                                        {PDPA_TEXT}
                                    </pre>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2 border-t border-border/50 pt-5">
                            <Button variant="outline" onClick={goBack} className="flex-1">
                                <ChevronLeft className="w-4 h-4 mr-1" /> ย้อนกลับ
                            </Button>
                            <Button
                                onClick={goNext}
                                disabled={!consentParent || !consentLoan || !consentPdpa || loading}
                                className="flex-1 shadow-md shadow-primary/20"
                            >
                                {loading ? "กำลังส่งข้อมูล..." : <>สมัครสมาชิก <FileCheck className="w-4 h-4 ml-1" /></>}
                            </Button>
                        </CardFooter>
                    </>
                )}

                {/* ====================== STEP 5: OTP ====================== */}
                {step === 5 && (
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
                                    id="otpCode" value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    maxLength={6} inputMode="numeric" required
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
                                <button type="button" onClick={() => handleRegister()} disabled={loading} className="text-xs text-primary hover:underline disabled:opacity-50">
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
