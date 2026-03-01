"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Trash2, Edit2, RefreshCw, Eye, EyeOff, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface LoanSection {
    id: string;
    title: string;
    content: string;
    sortOrder: number;
    isActive: boolean;
}

export default function AdminLoanInfoPage() {
    const [sections, setSections] = useState<LoanSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [editId, setEditId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");

    const fetchSections = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/loan-info");
            const data = await res.json();
            if (res.ok) setSections(data.sections);
        } catch { toast.error("โหลดข้อมูลไม่สำเร็จ"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchSections(); }, []);

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) { toast.error("กรุณากรอกข้อมูลให้ครบ"); return; }
        setCreating(true);
        try {
            const res = await fetch("/api/admin/loan-info", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content })
            });
            if (res.ok) {
                toast.success("เพิ่มข้อมูลสำเร็จ");
                setTitle(""); setContent(""); setIsCreateOpen(false); fetchSections();
            } else { const d = await res.json(); toast.error(d.error); }
        } catch { toast.error("เกิดข้อผิดพลาด"); }
        finally { setCreating(false); }
    };

    const handleUpdate = async (id: string) => {
        try {
            const res = await fetch("/api/admin/loan-info", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, title: editTitle, content: editContent })
            });
            if (res.ok) { toast.success("แก้ไขสำเร็จ"); setEditId(null); fetchSections(); }
            else { const d = await res.json(); toast.error(d.error); }
        } catch { toast.error("เกิดข้อผิดพลาด"); }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            await fetch("/api/admin/loan-info", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: !isActive })
            });
            fetchSections();
        } catch { toast.error("เกิดข้อผิดพลาด"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("ลบข้อมูลนี้จริงหรือ?")) return;
        try {
            const res = await fetch(`/api/admin/loan-info?id=${id}`, { method: "DELETE" });
            if (res.ok) { toast.success("ลบสำเร็จ"); fetchSections(); }
        } catch { toast.error("เกิดข้อผิดพลาด"); }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BookOpen className="w-7 h-7 text-primary" /> จัดการข้อมูลการกู้ยืม
                    </h1>
                    <p className="text-muted-foreground mt-1">เพิ่ม แก้ไข หรือซ่อนข้อมูลที่แสดงในหน้า "ข้อมูล กยศ."</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchSections}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> รีเฟรช
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover-lift"><Plus className="w-4 h-4 mr-2" /> เพิ่มหัวข้อ</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>เพิ่มข้อมูลใหม่</DialogTitle>
                                <DialogDescription>ข้อมูลจะแสดงในหน้า "ข้อมูล กยศ." สาธารณะทันที</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>หัวข้อ</Label>
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น เงื่อนไขพิเศษปี 2568" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>เนื้อหา</Label>
                                    <Textarea value={content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)} rows={6} placeholder="รายละเอียด... (สามารถใช้ขึ้นบรรทัดใหม่ได้)" />
                                    <p className="text-xs text-muted-foreground">กด Enter เพื่อขึ้นบรรทัดใหม่ / แยกหัวข้อย่อยด้วย • หรือ -</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={creating || !title.trim() || !content.trim()}>
                                    {creating ? "กำลังบันทึก..." : "เพิ่มข้อมูล"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <Card className="glass"><CardContent className="py-12 text-center text-muted-foreground">กำลังโหลด...</CardContent></Card>
                ) : sections.length === 0 ? (
                    <Card className="glass"><CardContent className="py-12 text-center text-muted-foreground">ยังไม่มีข้อมูล — กดปุ่ม "เพิ่มหัวข้อ" เพื่อเริ่ม</CardContent></Card>
                ) : sections.map((s, i) => (
                    <Card key={s.id} className={`glass border-border/50 ${!s.isActive ? 'opacity-50' : ''}`}>
                        <CardContent className="py-4 px-5">
                            {editId === s.id ? (
                                <div className="space-y-3">
                                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="หัวข้อ" />
                                    <Textarea value={editContent} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditContent(e.target.value)} rows={5} placeholder="เนื้อหา" />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleUpdate(s.id)}><Save className="w-3.5 h-3.5 mr-1" /> บันทึก</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="w-3.5 h-3.5 mr-1" /> ยกเลิก</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-sm">{s.title}</h3>
                                                {!s.isActive && <Badge variant="outline" className="text-xs bg-muted">ซ่อน</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground whitespace-pre-line">{s.content}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(s.id); setEditTitle(s.title); setEditContent(s.content); }} title="แก้ไข">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(s.id, s.isActive)} title={s.isActive ? "ซ่อน" : "แสดง"}>
                                            {s.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(s.id)} title="ลบ">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
