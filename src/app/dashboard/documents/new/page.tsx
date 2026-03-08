"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { FileUp, Info, ShieldAlert, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Suspense } from 'react';

function DocumentForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const typeParam = searchParams.get("type"); // 'CONFIRMATION' or 'CONTRACT'

    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        type: typeParam === 'CONTRACT' ? 'CONTRACT' : 'CONFIRMATION',
        lastThreeDigits: "",
        academicYear: "2567",
        semester: "1",
    });

    const [agreements, setAgreements] = useState({
        consultedParents: false,
        livingExpensesOnly: false,
        pdpaConsent: false,
    });

    const [settings, setSettings] = useState<any>(null);
    const [settingsLoading, setSettingsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // We'll create a public endpoint for settings soon, or use a general info endpoint
                const res = await fetch('/api/settings/public');
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);

                    // Auto-fill academic year and semester from settings
                    setFormData(prev => ({
                        ...prev,
                        academicYear: data.academicYear || "2567",
                        semester: data.semester || "1"
                    }));
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setSettingsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const isConfirmation = formData.type === 'CONFIRMATION';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "application/pdf") {
                toast.error("กรุณาอัปโหลดไฟล์ PDF เท่านั้น");
                e.target.value = "";
                return;
            }
            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB Limit
                toast.error("ขนาดไฟล์ต้องไม่เกิน 10MB");
                e.target.value = "";
                return;
            }

            // Name validation Check locally first to save server roundtrip
            const fileName = selectedFile.name.toUpperCase();
            if (isConfirmation) {
                if (!fileName.startsWith('R') || !fileName.endsWith('.PDF')) {
                    toast.warning("ชื่อไฟล์ควรขึ้นต้นด้วย R สำหรับแบบยืนยัน");
                }
            } else {
                if (!fileName.startsWith('C') || !fileName.endsWith('.PDF')) {
                    toast.warning("ชื่อไฟล์ควรขึ้นต้นด้วย C สำหรับสัญญา");
                }
            }

            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreements.consultedParents || !agreements.livingExpensesOnly || !agreements.pdpaConsent) {
            toast.error("กรุณายอมรับเงื่อนไขและข้อตกลงทั้งหมดก่อนดำเนินการ");
            return;
        }

        if (!file) {
            toast.error("กรุณาแนบไฟล์เอกสาร PDF");
            return;
        }

        if (formData.lastThreeDigits.length !== 3) {
            toast.error("กรุณาระบุเลขท้าย 3 หลักให้ถูกต้อง");
            return;
        }

        setLoading(true);

        const data = new FormData();
        data.append("type", formData.type);
        data.append("lastThreeDigits", formData.lastThreeDigits);
        data.append("academicYear", formData.academicYear);
        data.append("semester", formData.semester);
        data.append("documentFile", file);

        try {
            const res = await fetch("/api/documents", {
                method: "POST",
                body: data,
            });

            const result = await res.json();
            if (res.ok) {
                toast.success("ส่งเอกสารสำเร็จ");
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาดในการส่งข้อมูล");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="outline" size="sm">กลับ</Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">ส่งมอบเอกสาร กยศ.</h1>
                    <p className="text-muted-foreground mt-1">
                        อัปโหลด {isConfirmation ? "แบบยืนยันเบิกเงินกู้ยืม" : "สัญญากู้ยืมเงิน"}
                    </p>
                </div>
            </div>

            {settings && !settings.documentSubmissionOpen && (
                <Alert className="border-destructive bg-destructive/10">
                    <ShieldAlert className="w-5 h-5 text-destructive" />
                    <AlertTitle className="text-destructive font-semibold">ระบบปิดรับเอกสารชั่วคราว</AlertTitle>
                    <AlertDescription className="mt-2 text-destructive">
                        ขณะนี้ระบบยังไม่เปิดรับเอกสารสำหรับเทอม {settings.semester}/{settings.academicYear} กรุณารอประกาศจากเจ้าหน้าที่
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Rules Sidebar */}
                <div className="md:col-span-1 space-y-4">
                    <Card className="glass border-primary/20 bg-primary/5">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                <ShieldAlert className="w-5 h-5" />
                                กฎการอัปโหลดไฟล์
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">การตั้งชื่อไฟล์:</h4>
                                <p className="text-muted-foreground">
                                    {isConfirmation ?
                                        "ต้องขึ้นต้นด้วยอักษร 'R' ตามด้วยเลขท้าย 3 หลักของแบบยืนยัน (เช่น R123.pdf)" :
                                        "ต้องขึ้นต้นด้วยอักษร 'C' ตามด้วยเลขท้าย 3 หลักของสัญญา (เช่น C456.pdf)"}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">จำนวนหน้าขั้นต่ำ:</h4>
                                <p className="text-muted-foreground">
                                    {isConfirmation ? "อย่างน้อย 3 หน้าขึ้นไป" : "อย่างน้อย 9 หน้าขึ้นไป"}
                                    (รวมสำเนาบัตรประชาชนผู้กู้และผู้ปกครอง)
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-1">ความชัดเจน:</h4>
                                <p className="text-muted-foreground">สแกนให้เห็นข้อความและลายเซ็นชัดเจน ห้ามเบลอหรือตัดขอบทิ้ง</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Form */}
                <div className="md:col-span-2">
                    <Card className="glass hover-lift shadow-sm">
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-6 pt-6">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ปีการศึกษา</Label>
                                        <Input
                                            value={formData.academicYear}
                                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value.replace(/[^0-9]/g, '') })}
                                            maxLength={4}
                                            required
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ภาคเรียนที่</Label>
                                        <Select value={formData.semester} onValueChange={(v) => setFormData({ ...formData, semester: v })}>
                                            <SelectTrigger className="bg-background/50">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1</SelectItem>
                                                <SelectItem value="2">2</SelectItem>
                                                <SelectItem value="3">3 (ฤดูร้อน)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>เลขท้าย 3 หลักของเอกสาร <span className="text-destructive">*</span></Label>
                                    <Input
                                        value={formData.lastThreeDigits}
                                        onChange={(e) => setFormData({ ...formData, lastThreeDigits: e.target.value.replace(/[^0-9]/g, '') })}
                                        maxLength={3}
                                        minLength={3}
                                        required
                                        placeholder="เช่น 123"
                                        className="bg-background/50"
                                    />
                                    <p className="text-xs text-muted-foreground">ดูเลขจากมุมขวาบนของเอกสาร กยศ.</p>
                                </div>

                                <div className="space-y-2 bg-muted/20 p-4 rounded-lg border border-border/50">
                                    <Label className="text-base font-semibold flex items-center gap-2 mb-2">
                                        <FileUp className="w-5 h-5 text-primary" />
                                        อัปโหลดไฟล์ PDF <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileChange}
                                        required
                                        className="bg-background cursor-pointer"
                                    />
                                    {file && (
                                        <p className="text-sm text-primary mt-2 flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> ชื่อไฟล์ที่คุณแนบ: {file.name}
                                        </p>
                                    )}
                                </div>

                                {/* Checkboxes */}
                                <Alert className="border-warning/50 bg-warning/5">
                                    <Info className="w-5 h-5 text-warning" />
                                    <AlertTitle className="text-warning font-semibold">ข้อตกลงและเงื่อนไข (บังคับ)</AlertTitle>
                                    <AlertDescription className="mt-4 space-y-4">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="chk1"
                                                checked={agreements.consultedParents}
                                                onCheckedChange={(c) => setAgreements({ ...agreements, consultedParents: !!c })}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor="chk1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                                    ข้าพเจ้าได้ปรึกษาและแจ้งผู้ปกครองของข้าพเจ้าเรียบร้อยแล้ว ก่อนทำการแจ้งความประสงค์
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="chk2"
                                                checked={agreements.livingExpensesOnly}
                                                onCheckedChange={(c) => setAgreements({ ...agreements, livingExpensesOnly: !!c })}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor="chk2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                                    รับทราบว่าโรงเรียนให้กู้ยืมเฉพาะ "ค่าครองชีพเท่านั้น" มิได้ให้กู้ยืมค่าเทอม
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="chk3"
                                                checked={agreements.pdpaConsent}
                                                onCheckedChange={(c) => setAgreements({ ...agreements, pdpaConsent: !!c })}
                                            />
                                            <div className="grid gap-1.5 leading-none">
                                                <label htmlFor="chk3" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                                                    ข้าพเจ้ายินยอมให้ทางโรงเรียนเก็บรวบรวมไฟล์และข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                                                </label>
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>

                            </CardContent>
                            <CardFooter className="pt-2 pb-6 px-6">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full text-base"
                                    disabled={loading || (settings && !settings.documentSubmissionOpen)}
                                >
                                    {loading ? "กำลังตรวจสอบและอัปโหลด..." :
                                        (settings && !settings.documentSubmissionOpen) ? "ระบบปิดรับเอกสาร" : "ส่งเอกสารเข้าระบบ"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>

            </div>
        </div>
    );
}

// Wrap in Suspense because we use useSearchParams
export default function DocumentSubmissionPage() {
    return (
        <Suspense fallback={<div>Loading form...</div>}>
            <DocumentForm />
        </Suspense>
    );
}
