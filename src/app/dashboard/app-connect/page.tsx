"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FileUp, Info, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AppConnectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [existingProof, setExistingProof] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const data = await res.json();
                    if (data.appConnectProof) {
                        setExistingProof(data.appConnectProof);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user data:", error);
            } finally {
                setIsFetching(false);
            }
        };
        fetchUserData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.type.startsWith("image/")) {
                toast.error("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG)");
                e.target.value = "";
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB Limit
                toast.error("ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB");
                e.target.value = "";
                return;
            }

            setFile(selectedFile);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file && !previewUrl) {
            toast.error("กรุณาแนบไฟล์รูปภาพ Screenshot");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/user/app-connect", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    appConnectProof: previewUrl
                }),
            });

            const result = await res.json();
            if (res.ok) {
                toast.success("บันทึกหลักฐานแอป กยศ. Connect สำเร็จ");
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        } finally {
            setLoading(false);
        }
    };

    if (isFetching) {
        return <div className="p-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        กลับหน้ารวม
                    </Button>
                </Link>
            </div>

            <Card className="glass border-blue-100 dark:border-blue-900 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 sm:p-8 text-white">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shrink-0">
                            <Download className="w-12 h-12 text-white" />
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold mb-2">อัปโหลดหลักฐานแอป กยศ. Connect</h2>
                            <p className="text-blue-50 max-w-lg">
                                เพื่อความสะดวกรวดเร็วในการตรวจสอบยอดหนี้และการชำระเงินในอนาคต นักเรียนกู้ยืมทุกคนต้องมีแอปพลิเคชัน กยศ. Connect ติดตั้งไว้ในเครื่องส่วนตัว
                            </p>
                        </div>
                    </div>
                </div>

                <CardContent className="p-6 sm:p-8 pt-8">
                    {existingProof && !file ? (
                        <div className="space-y-6 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-green-700">คุณอัปโหลดหลักฐานเรียบร้อยแล้ว</h3>
                                <p className="text-muted-foreground mt-1">สามารถรับชมรูปหลักฐานเดิมได้ด้านล่าง หากต้องการเปลี่ยนรูปสามารถอัปโหลดใหม่ได้ทันที</p>
                            </div>

                            <div className="relative w-64 h-auto mx-auto border-4 border-muted rounded-2xl overflow-hidden shadow-lg">
                                <img src={existingProof} alt="Existing Proof" className="w-full h-auto object-cover" />
                            </div>

                            <div className="pt-6 border-t">
                                <h4 className="font-semibold mb-4">ต้องการเปลี่ยนรูปภาพหลักฐาน?</h4>
                                <Input
                                    type="file"
                                    accept="image/jpeg, image/png"
                                    onChange={handleFileChange}
                                    className="max-w-sm mx-auto cursor-pointer"
                                />
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 sm:p-6 rounded-xl border border-blue-100 dark:border-blue-900 border-dashed">
                                <h3 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-3">
                                    <Info className="w-5 h-5" />
                                    คำแนะนำการแคปหน้าจอ (Screenshot)
                                </h3>
                                <ul className="list-disc list-inside text-sm text-blue-800/80 dark:text-blue-200/80 space-y-2">
                                    <li>ดาวน์โหลดแอปและลงทะเบียนเข้าสู่ระบบด้วยเลขประจำตัวประชาชน</li>
                                    <li>ไปที่หน้า <strong>"โปรไฟล์ (Profile)"</strong> หรือหน้า <strong>"หน้าหลัก (Home)"</strong></li>
                                    <li>แคปหน้าจอที่แสดง <strong>ชื่อ-นามสกุล ของนักเรียนอย่างชัดเจน</strong></li>
                                    <li>รูปภาพต้องไม่เบลอ และเป็นไฟล์ .JPG หรือ .PNG เท่านั้น (ขนาดไม่เกิน 5MB)</li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${previewUrl ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50 dark:hover:bg-muted/10'}`}>
                                        {previewUrl ? (
                                            <div className="relative w-full h-full flex items-center justify-center p-4">
                                                <img src={previewUrl} alt="Preview" className="max-h-full object-contain rounded-lg shadow-sm" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                                    <p className="text-white font-medium flex items-center gap-2">
                                                        <FileUp className="w-5 h-5" /> เปลี่ยนรูปภาพ
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                                                <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileUp className="w-8 h-8" />
                                                </div>
                                                <p className="mb-2 text-sm font-semibold">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
                                                <p className="text-xs">รองรับไฟล์ JPG, PNG (สูงสุดไม่เกิน 5MB)</p>
                                            </div>
                                        )}
                                        <input id="dropzone-file" type="file" className="hidden" accept="image/jpeg, image/png" onChange={handleFileChange} />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    className="w-full sm:w-auto min-w-[200px] h-12 shadow-md hover:shadow-lg transition-all"
                                    disabled={loading || !previewUrl}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            กำลังอัปโหลด...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2 font-semibold">
                                            <FileUp className="w-5 h-5" />
                                            {existingProof ? "บันทึกรูปใหม่" : "อัปโหลดหลักฐาน"}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
