"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { FileText, UploadCloud, Info } from "lucide-react";
import Link from "next/link";

export default function LoanRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        purpose: "",
        gpa: "",
        educationHistory: "",
        scholarships: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "application/pdf") {
                toast.error("กรุณาอัปโหลดไฟล์ PDF เท่านั้น");
                e.target.value = "";
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error("ขนาดไฟล์ต้องไม่เกิน 5MB");
                e.target.value = "";
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!file) {
            toast.error("กรุณาแนบไฟล์ ปพ.1 หรือเอกสารแสดงผลการเรียน");
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append("purpose", formData.purpose);
        data.append("gpa", formData.gpa);
        data.append("educationHistory", formData.educationHistory);
        data.append("scholarships", formData.scholarships);
        data.append("transcriptFile", file);

        try {
            const res = await fetch("/api/loan-request", {
                method: "POST",
                body: data,
            });

            const result = await res.json();
            if (res.ok) {
                toast.success("ส่งคำขอกู้ยืมเงินเบื้องต้นสำเร็จ");
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
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="outline" size="sm">กลับ</Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">แบบฟอร์มคำขอกู้ยืมเงินเบื้องต้น</h1>
                    <p className="text-muted-foreground mt-1">
                        สำหรับผู้กู้รายใหม่ที่ต้องการขออนุมัติการกู้ยืมเงิน กยศ.
                    </p>
                </div>
            </div>

            <Card className="glass hover-lift border-primary/20">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            ข้อมูลประกอบการพิจารณา
                        </CardTitle>
                        <CardDescription>
                            กรอกข้อมูลให้ครบถ้วนและแนบเอกสารตามความจริง
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <Alert className="bg-primary/5 text-primary border-primary/20 pb-4">
                            <Info className="w-4 h-4 text-primary" />
                            <AlertDescription className="ml-2">
                                จุดประสงค์การกู้ยืมนี้เป็นส่วนหนึ่งของการพิจารณาเพื่อให้ขอกู้ในลักษณะ 1 (ค่าครองชีพ) เท่านั้น
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">จุดประสงค์ที่ต้องการกู้ยืมเงินเบื้องต้น <span className="text-destructive">*</span></Label>
                            <Textarea
                                id="purpose"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                placeholder="บรรยายความจำเป็น หรือปัญหาทางการเงินของครอบครัว..."
                                required
                                className="min-h-[100px] bg-background/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="gpa">เกรดเฉลี่ยสะสม (GPAX) ล่าสุด <span className="text-destructive">*</span></Label>
                                <Input
                                    id="gpa"
                                    name="gpa"
                                    type="number"
                                    step="0.01"
                                    max="4.00"
                                    min="0.00"
                                    value={formData.gpa}
                                    onChange={handleChange}
                                    required
                                    placeholder="เช่น 3.50"
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scholarships">ทุนการศึกษาที่เคยได้รับ (จำนวนเงิน) <span className="text-muted-foreground font-normal">(ถ้ามี)</span></Label>
                                <Input
                                    id="scholarships"
                                    name="scholarships"
                                    value={formData.scholarships}
                                    onChange={handleChange}
                                    placeholder="เช่น ทุนเรียนดี 5,000 บาท"
                                    className="bg-background/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="educationHistory">ประวัติการศึกษาโดยย่อ <span className="text-destructive">*</span></Label>
                            <Textarea
                                id="educationHistory"
                                name="educationHistory"
                                value={formData.educationHistory}
                                onChange={handleChange}
                                placeholder="จบ ป.6 จากโรงเรียน... จบ ม.3 จากโรงเรียน..."
                                required
                                className="min-h-[80px] bg-background/50"
                            />
                        </div>

                        <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-border/50">
                            <Label htmlFor="transcriptFile" className="text-base font-semibold flex items-center gap-2 mb-2">
                                <UploadCloud className="w-5 h-5 text-primary" />
                                อัปโหลดผลการเรียน (ปพ.1) <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-sm text-muted-foreground mb-4">
                                แนบไฟล์ PDF ที่สแกนเอกสาร ปพ.1 หรือเอกสารแสดงผลการเรียนล่าสุด (ขนาดไม่เกิน 5MB)
                            </p>
                            <Input
                                id="transcriptFile"
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                required
                                className="bg-background cursor-pointer"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-6 border-t border-border/50">
                        <Button type="submit" className="w-full text-base" disabled={loading}>
                            {loading ? "กำลังบันทึกข้อมูล..." : "บันทึกและส่งคำขอ"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

