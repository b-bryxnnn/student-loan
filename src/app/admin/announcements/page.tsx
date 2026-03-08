"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Plus, Trash2, Send, RefreshCw, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface Announcement {
    id: string;
    title: string;
    content: string;
    isActive: boolean;
    createdAt: string;
}

export default function AdminAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);

    // Form
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [sendNotification, setSendNotification] = useState(false);

    // Copy Helper
    const [showCopyDialog, setShowCopyDialog] = useState(false);
    const [copyContent, setCopyContent] = useState("");

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/announcements");
            const data = await res.json();
            if (res.ok) {
                setAnnouncements(data.announcements);
            }
        } catch {
            toast.error("โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("กรุณากรอกหัวข้อและเนื้อหา");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/admin/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, sendNotification })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "สร้างประกาศสำเร็จ");

                // Set Up Copy Helper instead of LINE Notify
                const appUrl = window.location.origin;
                const textToCopy = `📣 ประกาศใหม่จาก กยศ. รส.ล.\nหัวข้อ: ${title}\n\nรายละเอียด:\n${content}\n\nเข้าสู่ระบบเพื่อดำเนินการ: ${appUrl}/login`;
                setCopyContent(textToCopy);
                setShowCopyDialog(true);

                setTitle("");
                setContent("");
                setSendNotification(false);
                setIsCreateOpen(false);
                fetchAnnouncements();
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("ซ่อนประกาศเรียบร้อยแล้ว");
                fetchAnnouncements();
            }
        } catch {
            toast.error("เกิดข้อผิดพลาด");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Bell className="w-7 h-7 text-primary" />
                        จัดการประกาศ
                    </h1>
                    <p className="text-muted-foreground mt-1">สร้าง, แก้ไข, และส่งแจ้งเตือนนักเรียนทางอีเมล</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchAnnouncements}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> รีเฟรช
                    </Button>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover-lift">
                                <Plus className="w-4 h-4 mr-2" /> สร้างประกาศใหม่
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>สร้างประกาศใหม่</DialogTitle>
                                <DialogDescription>ประกาศจะแสดงบนหน้าแรกของเว็บไซต์ทันที</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">หัวข้อประกาศ</Label>
                                    <Input
                                        id="title"
                                        placeholder="เช่น แจ้งกำหนดส่งเอกสารภาคเรียนที่ 1/2567"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        maxLength={200}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="content">เนื้อหาประกาศ</Label>
                                    <Textarea
                                        id="content"
                                        placeholder="รายละเอียด..."
                                        value={content}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                                        rows={5}
                                    />
                                </div>

                                <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <Checkbox
                                        id="sendEmail"
                                        checked={sendNotification}
                                        onCheckedChange={(v) => setSendNotification(v === true)}
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                        <label htmlFor="sendEmail" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                                            <Send className="w-3.5 h-3.5 text-primary" />
                                            ส่งอีเมลแจ้งเตือนนักเรียนทุกคน
                                        </label>
                                        <p className="text-xs text-muted-foreground">
                                            ระบบจะส่งอีเมล HTML สวยงามไปยังนักเรียนที่ยืนยันอีเมลแล้วทุกคน
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={creating || !title.trim() || !content.trim()}>
                                    {creating ? "กำลังสร้าง..." : "เผยแพร่ประกาศ"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* รายการประกาศ */}
            <div className="space-y-3">
                {loading ? (
                    <Card className="glass">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            กำลังโหลดข้อมูล...
                        </CardContent>
                    </Card>
                ) : announcements.length === 0 ? (
                    <Card className="glass">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            ยังไม่มีประกาศ — กดปุ่ม "สร้างประกาศใหม่" เพื่อเริ่มต้น
                        </CardContent>
                    </Card>
                ) : (
                    announcements.map((a) => (
                        <Card key={a.id} className={`glass border-border/50 ${!a.isActive ? 'opacity-50' : ''}`}>
                            <CardContent className="py-4 px-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{a.title}</h3>
                                            {a.isActive ? (
                                                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">แสดง</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">ซ่อนแล้ว</Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-line">{a.content}</p>
                                        <p className="text-xs text-muted-foreground/60 mt-2">
                                            {format(new Date(a.createdAt), 'dd MMM yyyy HH:mm', { locale: th })}
                                        </p>
                                    </div>
                                    {a.isActive && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10 shrink-0"
                                            onClick={() => handleDelete(a.id)}
                                            title="ซ่อนประกาศนี้"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Copy Helper Dialog */}
            <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-success flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6" />
                            ประกาศสำเร็จ!
                        </DialogTitle>
                        <DialogDescription>
                            กรุณากดคัดลอกข้อความด้านล่างนี้ เพื่อนำไปวางประกาศในกลุ่ม LINE หรือช่องทางที่ติดต่อกับนักเรียน
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md border border-border">
                        <pre className="text-sm font-sans whitespace-pre-wrap text-foreground">{copyContent}</pre>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(copyContent);
                                toast.success("คัดลอกข้อความสำเร็จ! สามารถนำไปวางในช่องแชทได้เลย");
                                setShowCopyDialog(false);
                            }}
                            className="w-full bg-[#06C755] hover:bg-[#05a546] text-white"
                        >
                            <Copy className="w-4 h-4 mr-2" />
                            คัดลอกข้อความสำหรับ LINE
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
