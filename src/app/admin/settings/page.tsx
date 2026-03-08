"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Settings2, Save } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        academicYear: "2567",
        semester: "1",
        documentSubmissionOpen: false,
        submissionOpenDate: "",
        submissionCloseDate: ""
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();

                    setFormData({
                        academicYear: data.academicYear,
                        semester: data.semester,
                        documentSubmissionOpen: data.documentSubmissionOpen,
                        submissionOpenDate: data.submissionOpenDate ? new Date(data.submissionOpenDate).toISOString().slice(0, 16) : "",
                        submissionCloseDate: data.submissionCloseDate ? new Date(data.submissionCloseDate).toISOString().slice(0, 16) : ""
                    });
                }
            } catch (error) {
                console.error(error);
                toast.error("ไม่สามารถโหลดการตั้งค่าได้");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleToggle = (checked: boolean) => {
        setFormData(prev => ({ ...prev, documentSubmissionOpen: checked }));
    };

    const handleSave = async () => {
        if (!formData.academicYear || !formData.semester) {
            toast.error('กรุณากรอกปีการศึกษาและภาคเรียนให้ครบถ้วน');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to update");

            toast.success("บันทึกการตั้งค่าเรียบร้อยแล้ว");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin">
                    <Button variant="outline" size="sm">กลับ</Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Settings2 className="w-8 h-8" />
                        ตั้งค่าระบบ (System Settings)
                    </h1>
                    <p className="text-muted-foreground mt-1">จัดการปีการศึกษา, ภาคเรียน และเปิด-ปิดระบบส่งเอกสาร</p>
                </div>
            </div>

            <Card className="glass border-primary/20 shadow-lg">
                <CardHeader>
                    <CardTitle>การตั้งค่าภาคการศึกษา</CardTitle>
                    <CardDescription>การเปลี่ยนเทอมจะส่งผลต่อการตรวจจับเงื่อนไขการส่งเอกสารของนักเรียน</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="academicYear">ปีการศึกษา <span className="text-destructive">*</span></Label>
                            <Input
                                id="academicYear" name="academicYear"
                                value={formData.academicYear} onChange={handleChange}
                                placeholder="เช่น 2567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="semester">ภาคเรียน <span className="text-destructive">*</span></Label>
                            <Input
                                id="semester" name="semester"
                                value={formData.semester} onChange={handleChange}
                                placeholder="เช่น 1 หรือ 2"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-border/50 my-6" />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between border rounded-lg p-4 bg-background/50">
                            <div>
                                <h3 className="font-semibold text-lg">เปิดระบบรับเอกสาร</h3>
                                <p className="text-sm text-muted-foreground">อนุญาตให้นักเรียนอัปโหลดเอกสารเข้าสู่ระบบ</p>
                            </div>
                            <Switch
                                checked={formData.documentSubmissionOpen}
                                onCheckedChange={handleToggle}
                                className={formData.documentSubmissionOpen ? "bg-success" : ""}
                            />
                        </div>

                        {formData.documentSubmissionOpen && (
                            <div className="grid grid-cols-2 gap-6 pt-4 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-2">
                                    <Label htmlFor="submissionOpenDate">วัน/เวลา ที่เปิดให้ส่ง (ถ้ามี)</Label>
                                    <Input
                                        id="submissionOpenDate" name="submissionOpenDate"
                                        type="datetime-local"
                                        value={formData.submissionOpenDate} onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="submissionCloseDate">วัน/เวลา ที่ปิดระบบ (ถ้ามี)</Label>
                                    <Input
                                        id="submissionCloseDate" name="submissionCloseDate"
                                        type="datetime-local"
                                        value={formData.submissionCloseDate} onChange={handleChange}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">หากเว้นว่าง ระบบจะเปิดตลอดจนกว่าจะกดปิดด้วยตนเอง</p>
                                </div>
                            </div>
                        )}
                    </div>

                </CardContent>
                <CardFooter className="bg-muted/30 pt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="hover-lift flex gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        บันทึกการตั้งค่า
                    </Button>
                </CardFooter>
            </Card>

            <Card className="glass border-warning/20">
                <CardHeader>
                    <CardTitle className="text-warning">คำแนะนำระบบเทอม (Semester Logic)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>เทอม 1:</strong> ผู้กู้รายใหม่ต้องส่งทั้ง "คำขอกู้ยืมเบื้องต้น", "เอกสารแบบยืนยัน" และ "สัญญากู้ยืม"</li>
                        <li><strong>เทอม 2:</strong> ผู้กู้รายใหม่ (ที่ทำสัญญาเทอม 1 แล้ว) และผู้กู้รายเก่า ส่งเฉพาะ "เอกสารแบบยืนยัน" เท่านั้น</li>
                        <li>ระบบจะใช้วันที่ที่บันทึกร่วมกับข้อมูลชั้นปีของผู้เรียนในการตัดสินใจว่าต้องส่งเอกสารชุดใด</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
