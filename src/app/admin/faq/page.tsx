"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Plus, Trash2, Edit2, RefreshCw, Eye, EyeOff, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface FaqItem {
    id: string;
    question: string;
    answer: string;
    sortOrder: number;
    isActive: boolean;
}

export default function AdminFaqPage() {
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    // Edit inline
    const [editId, setEditId] = useState<string | null>(null);
    const [editQ, setEditQ] = useState("");
    const [editA, setEditA] = useState("");

    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/faq");
            const data = await res.json();
            if (res.ok) setFaqs(data.faqs);
        } catch { toast.error("โหลดข้อมูลไม่สำเร็จ"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFaqs(); }, []);

    const handleCreate = async () => {
        if (!question.trim() || !answer.trim()) { toast.error("กรุณากรอกข้อมูลให้ครบ"); return; }
        setCreating(true);
        try {
            const res = await fetch("/api/admin/faq", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, answer })
            });
            if (res.ok) {
                toast.success("เพิ่มคำถามสำเร็จ");
                setQuestion(""); setAnswer(""); setIsCreateOpen(false); fetchFaqs();
            } else { const d = await res.json(); toast.error(d.error); }
        } catch { toast.error("เกิดข้อผิดพลาด"); }
        finally { setCreating(false); }
    };

    const handleUpdate = async (id: string) => {
        try {
            const res = await fetch("/api/admin/faq", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, question: editQ, answer: editA })
            });
            if (res.ok) { toast.success("แก้ไขสำเร็จ"); setEditId(null); fetchFaqs(); }
            else { const d = await res.json(); toast.error(d.error); }
        } catch { toast.error("เกิดข้อผิดพลาด"); }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            await fetch("/api/admin/faq", {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: !isActive })
            });
            fetchFaqs();
        } catch { toast.error("เกิดข้อผิดพลาด"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("ลบคำถามนี้จริงหรือ?")) return;
        try {
            const res = await fetch(`/api/admin/faq?id=${id}`, { method: "DELETE" });
            if (res.ok) { toast.success("ลบสำเร็จ"); fetchFaqs(); }
        } catch { toast.error("เกิดข้อผิดพลาด"); }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <HelpCircle className="w-7 h-7 text-primary" /> จัดการ FAQ
                    </h1>
                    <p className="text-muted-foreground mt-1">เพิ่ม แก้ไข ซ่อน หรือลบคำถามที่พบบ่อย</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchFaqs}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> รีเฟรช
                    </Button>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover-lift"><Plus className="w-4 h-4 mr-2" /> เพิ่มคำถาม</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>เพิ่มคำถามใหม่</DialogTitle>
                                <DialogDescription>คำถามจะแสดงในหน้า FAQ สาธารณะทันที</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>คำถาม</Label>
                                    <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="เช่น กู้ได้เท่าไหร่ต่อปี?" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>คำตอบ</Label>
                                    <Textarea value={answer} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)} rows={4} placeholder="คำตอบ..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} disabled={creating || !question.trim() || !answer.trim()}>
                                    {creating ? "กำลังบันทึก..." : "เพิ่มคำถาม"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <Card className="glass"><CardContent className="py-12 text-center text-muted-foreground">กำลังโหลด...</CardContent></Card>
                ) : faqs.length === 0 ? (
                    <Card className="glass"><CardContent className="py-12 text-center text-muted-foreground">ยังไม่มีคำถาม — กดปุ่ม "เพิ่มคำถาม" เพื่อเริ่ม</CardContent></Card>
                ) : faqs.map((faq, i) => (
                    <Card key={faq.id} className={`glass border-border/50 ${!faq.isActive ? 'opacity-50' : ''}`}>
                        <CardContent className="py-4 px-5">
                            {editId === faq.id ? (
                                <div className="space-y-3">
                                    <Input value={editQ} onChange={(e) => setEditQ(e.target.value)} placeholder="คำถาม" />
                                    <Textarea value={editA} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditA(e.target.value)} rows={3} placeholder="คำตอบ" />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleUpdate(faq.id)}><Save className="w-3.5 h-3.5 mr-1" /> บันทึก</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setEditId(null)}><X className="w-3.5 h-3.5 mr-1" /> ยกเลิก</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">{i + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-sm">{faq.question}</h3>
                                                {!faq.isActive && <Badge variant="outline" className="text-xs bg-muted">ซ่อน</Badge>}
                                            </div>
                                            <p className="text-sm text-muted-foreground whitespace-pre-line">{faq.answer}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditId(faq.id); setEditQ(faq.question); setEditA(faq.answer); }} title="แก้ไข">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(faq.id, faq.isActive)} title={faq.isActive ? "ซ่อน" : "แสดง"}>
                                            {faq.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(faq.id)} title="ลบ">
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
