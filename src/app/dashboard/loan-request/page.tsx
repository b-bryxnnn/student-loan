"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { FileText, UploadCloud, Info, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

interface UserProfile {
    prefix: string;
    firstName: string;
    lastName: string;
    idCard: string;
    studentId: string | null;
    gradeLevel: string | null;
    phone: string | null;
    email: string;
}

interface EduRow {
    level: string;
    school: string;
    year: string;
}

interface ScholarRow {
    name: string;
    amount: string;
    year: string;
}

export default function LoanRequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [file, setFile] = useState<File | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    const [formData, setFormData] = useState({ purpose: "", gpa: "" });

    // Table: ประวัติการศึกษา
    const [eduRows, setEduRows] = useState<EduRow[]>([
        { level: "ป.6", school: "", year: "" },
        { level: "ม.3", school: "", year: "" },
    ]);

    // Table: ทุนการศึกษา
    const [scholarRows, setScholarRows] = useState<ScholarRow[]>([]);

    // Fetch profile
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                }
            } catch {
                console.error("Failed to fetch profile");
            } finally {
                setProfileLoading(false);
            }
        })();
    }, []);

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

    // Education table helpers
    const updateEduRow = (index: number, field: keyof EduRow, value: string) => {
        setEduRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };
    const addEduRow = () => setEduRows(prev => [...prev, { level: "", school: "", year: "" }]);
    const removeEduRow = (index: number) => setEduRows(prev => prev.filter((_, i) => i !== index));

    // Scholarship table helpers
    const updateScholarRow = (index: number, field: keyof ScholarRow, value: string) => {
        setScholarRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };
    const addScholarRow = () => setScholarRows(prev => [...prev, { name: "", amount: "", year: "" }]);
    const removeScholarRow = (index: number) => setScholarRows(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!file) {
            toast.error("กรุณาแนบไฟล์ ปพ.1 หรือเอกสารแสดงผลการเรียน");
            setLoading(false);
            return;
        }

        // Compile education history and scholarships from tables
        const educationHistory = eduRows
            .filter(r => r.school.trim())
            .map(r => `${r.level} — ${r.school}${r.year ? ` (พ.ศ. ${r.year})` : ''}`)
            .join('\n');

        const scholarships = scholarRows
            .filter(r => r.name.trim())
            .map(r => `${r.name}: ${r.amount} บาท${r.year ? ` (${r.year})` : ''}`)
            .join('\n');

        const data = new FormData();
        data.append("purpose", formData.purpose);
        data.append("gpa", formData.gpa);
        data.append("educationHistory", educationHistory);
        data.append("scholarships", scholarships);
        data.append("transcriptFile", file);

        try {
            const res = await fetch("/api/loan-request", { method: "POST", body: data });
            const result = await res.json();
            if (res.ok) {
                toast.success("ส่งคำขอกู้ยืมเงินเบื้องต้นสำเร็จ");
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาดในการส่งข้อมูล");
            }
        } catch {
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
                    <p className="text-muted-foreground mt-1">สำหรับผู้กู้รายใหม่ที่ต้องการขออนุมัติการกู้ยืมเงิน กยศ.</p>
                </div>
            </div>

            {/* ข้อมูลผู้กู้ (Auto-fill) */}
            <Card className="glass border-primary/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        ข้อมูลผู้กู้ยืม
                    </CardTitle>
                    <CardDescription className="text-xs">ดึงจากข้อมูลที่ลงทะเบียนไว้ (แก้ไขได้ในหน้าโปรไฟล์)</CardDescription>
                </CardHeader>
                <CardContent>
                    {profileLoading ? (
                        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลดข้อมูล...
                        </div>
                    ) : profile ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <div><Label className="text-xs text-muted-foreground">ชื่อ-นามสกุล</Label><p className="font-medium mt-0.5">{profile.prefix}{profile.firstName} {profile.lastName}</p></div>
                            <div><Label className="text-xs text-muted-foreground">เลขประจำตัวประชาชน</Label><p className="font-mono mt-0.5">{profile.idCard}</p></div>
                            <div><Label className="text-xs text-muted-foreground">รหัสนักเรียน</Label><p className="mt-0.5">{profile.studentId || '-'}</p></div>
                            <div><Label className="text-xs text-muted-foreground">ระดับชั้น</Label><p className="mt-0.5">{profile.gradeLevel || '-'}</p></div>
                            <div><Label className="text-xs text-muted-foreground">อีเมล</Label><p className="mt-0.5">{profile.email}</p></div>
                            <div><Label className="text-xs text-muted-foreground">เบอร์โทร</Label><p className="mt-0.5">{profile.phone || '-'}</p></div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">ไม่สามารถโหลดข้อมูลได้</p>
                    )}
                </CardContent>
            </Card>

            {/* ฟอร์มหลัก */}
            <Card className="glass hover-lift border-primary/20">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            ข้อมูลประกอบการพิจารณา
                        </CardTitle>
                        <CardDescription>กรอกข้อมูลให้ครบถ้วนและแนบเอกสารตามความจริง</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <Alert className="bg-primary/5 text-primary border-primary/20 pb-4">
                            <Info className="w-4 h-4 text-primary" />
                            <AlertDescription className="ml-2">
                                คำขอนี้เป็นส่วนหนึ่งของการพิจารณาเพื่อขอกู้ยืมค่าครองชีพเท่านั้น
                            </AlertDescription>
                        </Alert>

                        {/* จุดประสงค์ */}
                        <div className="space-y-2">
                            <Label htmlFor="purpose">จุดประสงค์ที่ต้องการกู้ยืมเงินเบื้องต้น <span className="text-destructive">*</span></Label>
                            <Textarea
                                id="purpose" name="purpose" value={formData.purpose} onChange={handleChange}
                                placeholder="บรรยายความจำเป็น หรือปัญหาทางการเงินของครอบครัว..."
                                required className="min-h-[100px] bg-background/50"
                            />
                        </div>

                        {/* GPA */}
                        <div className="max-w-xs">
                            <Label htmlFor="gpa">เกรดเฉลี่ยสะสม (GPAX) ล่าสุด <span className="text-destructive">*</span></Label>
                            <Input
                                id="gpa" name="gpa" type="number" step="0.01" max="4.00" min="0.00"
                                value={formData.gpa} onChange={handleChange} required
                                placeholder="เช่น 3.50" className="bg-background/50 mt-1"
                            />
                        </div>

                        {/* ประวัติการศึกษา — ตาราง */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">ประวัติการศึกษาโดยย่อ <span className="text-destructive">*</span></Label>
                                <Button type="button" variant="ghost" size="sm" onClick={addEduRow} className="text-xs gap-1">
                                    <Plus className="w-3 h-3" /> เพิ่มแถว
                                </Button>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="px-3 py-2 text-left text-xs font-semibold w-24">ระดับ</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold">ชื่อสถานศึกษา</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold w-24">ปี พ.ศ.</th>
                                            <th className="px-2 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {eduRows.map((row, i) => (
                                            <tr key={i}>
                                                <td className="px-2 py-1.5">
                                                    <Input value={row.level} onChange={e => updateEduRow(i, 'level', e.target.value)} className="text-xs h-8 bg-background" placeholder="ป.6" />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <Input value={row.school} onChange={e => updateEduRow(i, 'school', e.target.value)} className="text-xs h-8 bg-background" placeholder="โรงเรียน..." />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <Input value={row.year} onChange={e => updateEduRow(i, 'year', e.target.value)} className="text-xs h-8 bg-background" placeholder="2567" />
                                                </td>
                                                <td className="px-1 py-1.5">
                                                    {eduRows.length > 1 && (
                                                        <Button type="button" variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => removeEduRow(i)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ทุนการศึกษา — ตาราง */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">ทุนการศึกษาที่เคยได้รับ <span className="text-muted-foreground font-normal">(ถ้ามี)</span></Label>
                                <Button type="button" variant="ghost" size="sm" onClick={addScholarRow} className="text-xs gap-1">
                                    <Plus className="w-3 h-3" /> เพิ่มแถว
                                </Button>
                            </div>
                            {scholarRows.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">ยังไม่มีข้อมูลทุนการศึกษา — กดปุ่ม &quot;เพิ่มแถว&quot; เพื่อเพิ่ม</p>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50">
                                                <th className="px-3 py-2 text-left text-xs font-semibold">ชื่อทุน</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold w-28">จำนวนเงิน (บาท)</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold w-24">ปี พ.ศ.</th>
                                                <th className="px-2 py-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {scholarRows.map((row, i) => (
                                                <tr key={i}>
                                                    <td className="px-2 py-1.5">
                                                        <Input value={row.name} onChange={e => updateScholarRow(i, 'name', e.target.value)} className="text-xs h-8 bg-background" placeholder="ทุนเรียนดี" />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <Input value={row.amount} onChange={e => updateScholarRow(i, 'amount', e.target.value)} className="text-xs h-8 bg-background" placeholder="5000" />
                                                    </td>
                                                    <td className="px-2 py-1.5">
                                                        <Input value={row.year} onChange={e => updateScholarRow(i, 'year', e.target.value)} className="text-xs h-8 bg-background" placeholder="2567" />
                                                    </td>
                                                    <td className="px-1 py-1.5">
                                                        <Button type="button" variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => removeScholarRow(i)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* File upload */}
                        <div className="space-y-2 bg-muted/30 p-4 rounded-lg border border-border/50">
                            <Label htmlFor="transcriptFile" className="text-base font-semibold flex items-center gap-2 mb-2">
                                <UploadCloud className="w-5 h-5 text-primary" />
                                อัปโหลดผลการเรียน (ปพ.1) <span className="text-destructive">*</span>
                            </Label>
                            <p className="text-sm text-muted-foreground mb-4">
                                แนบไฟล์ PDF ที่สแกนเอกสาร ปพ.1 หรือเอกสารแสดงผลการเรียนล่าสุด (ขนาดไม่เกิน 5MB)
                            </p>
                            <Input id="transcriptFile" type="file" accept="application/pdf" onChange={handleFileChange} required className="bg-background cursor-pointer" />
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
