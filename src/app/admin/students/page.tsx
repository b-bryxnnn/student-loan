"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Trash2, Archive, RotateCcw, ChevronLeft, ChevronRight, RefreshCw, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface Student {
    id: string;
    prefix: string;
    firstName: string;
    lastName: string;
    studentId: string | null;
    gradeLevel: string | null;
    idCard: string;
    phone: string | null;
    email: string;
    borrowerType: string;
    accountStatus: string;
    emailVerified: boolean;
    createdAt: string;
    _count: { documents: number; loanRequests: number };
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function AdminStudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Delete/Archive dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogAction, setDialogAction] = useState<"DELETE" | "ARCHIVE" | "RESTORE">("DELETE");
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [editForm, setEditForm] = useState({ prefix: "", firstName: "", lastName: "", email: "", phone: "", gradeLevel: "", borrowerType: "" });
    const [editLoading, setEditLoading] = useState(false);

    const fetchStudents = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", page.toString());
            params.set("limit", "20");
            if (search.trim()) params.set("search", search.trim());
            if (statusFilter !== "ALL") params.set("status", statusFilter);

            const res = await fetch(`/api/admin/students?${params}`);
            const data = await res.json();
            if (res.ok) {
                setStudents(data.students);
                setPagination(data.pagination);
            } else {
                toast.error(data.error || "โหลดข้อมูลไม่สำเร็จ");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const openDialog = (student: Student, action: "DELETE" | "ARCHIVE" | "RESTORE") => {
        setSelectedStudent(student);
        setDialogAction(action);
        setDialogOpen(true);
    };

    const handleAction = async () => {
        if (!selectedStudent) return;
        setActionLoading(true);
        try {
            if (dialogAction === "DELETE") {
                const res = await fetch(`/api/admin/students?id=${selectedStudent.id}`, { method: "DELETE" });
                const data = await res.json();
                if (res.ok) {
                    toast.success("ลบนักเรียนเรียบร้อยแล้ว");
                } else {
                    toast.error(data.error);
                    return;
                }
            } else {
                const res = await fetch("/api/admin/students", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selectedStudent.id, action: dialogAction })
                });
                const data = await res.json();
                if (res.ok) {
                    toast.success(dialogAction === "ARCHIVE" ? "จำหน่ายออกเรียบร้อยแล้ว" : "กู้คืนสถานะเรียบร้อยแล้ว");
                } else {
                    toast.error(data.error);
                    return;
                }
            }
            setDialogOpen(false);
            fetchStudents(pagination.page);
        } catch {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setActionLoading(false);
        }
    };

    const openEdit = (s: Student) => {
        setEditStudent(s);
        setEditForm({
            prefix: s.prefix,
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phone: s.phone || "",
            gradeLevel: s.gradeLevel || "",
            borrowerType: s.borrowerType,
        });
        setEditOpen(true);
    };

    const handleEdit = async () => {
        if (!editStudent) return;
        setEditLoading(true);
        try {
            const res = await fetch("/api/admin/students", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editStudent.id, ...editForm }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("แก้ไขข้อมูลเรียบร้อยแล้ว");
                setEditOpen(false);
                fetchStudents(pagination.page);
            } else {
                toast.error(data.error);
            }
        } catch {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setEditLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStudents(1);
    };

    const dialogLabels = {
        DELETE: { title: "ยืนยันการลบนักเรียน", desc: "ข้อมูลนักเรียนรวมถึงเอกสารและคำขอทั้งหมดจะถูกลบอย่างถาวร การดำเนินการนี้ไม่สามารถย้อนกลับได้", btn: "ลบอย่างถาวร", color: "bg-destructive text-destructive-foreground hover:bg-destructive/90" },
        ARCHIVE: { title: "ยืนยันการจำหน่ายออก", desc: "นักเรียนจะไม่สามารถเข้าสู่ระบบได้ แต่ข้อมูลยังคงอยู่ในระบบ สามารถกู้คืนได้ภายหลัง", btn: "จำหน่ายออก", color: "bg-orange-600 text-white hover:bg-orange-700" },
        RESTORE: { title: "ยืนยันการกู้คืนสถานะ", desc: "นักเรียนจะสามารถเข้าสู่ระบบและใช้งานได้ตามปกติ", btn: "กู้คืนสถานะ", color: "bg-success text-white hover:bg-success/90" },
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/admin">
                            <Button variant="ghost" size="sm">← กลับ</Button>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="w-7 h-7 text-primary" />
                        จัดการนักเรียน
                    </h1>
                    <p className="text-muted-foreground mt-1">ดูรายชื่อ ค้นหา และจัดการสถานะนักเรียนในระบบ</p>
                </div>
                <Button variant="outline" onClick={() => fetchStudents(pagination.page)}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> รีเฟรช
                </Button>
            </div>

            {/* Search & Filter */}
            <Card className="glass border-border/50">
                <CardContent className="py-4 px-5">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหาชื่อ นามสกุล รหัสนักเรียน เลขบัตร หรืออีเมล..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            {["ALL", "ACTIVE", "ARCHIVED"].map((s) => (
                                <Button
                                    key={s}
                                    type="button"
                                    variant={statusFilter === s ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => { setStatusFilter(s); }}
                                >
                                    {s === "ALL" ? "ทั้งหมด" : s === "ACTIVE" ? "ปกติ" : "จำหน่ายแล้ว"}
                                </Button>
                            ))}
                            <Button type="submit" size="sm">
                                <Search className="w-4 h-4 mr-1" /> ค้นหา
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">ทั้งหมด {pagination.total} คน</Badge>
                <span>หน้า {pagination.page} / {pagination.totalPages || 1}</span>
            </div>

            {/* Table */}
            <Card className="glass border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-primary/10 text-primary">
                                <th className="px-4 py-3 text-left font-semibold text-xs">ชื่อ-นามสกุล</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs">รหัส</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs">ระดับชั้น</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs">ประเภท</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs">สถานะ</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs">เอกสาร</th>
                                <th className="px-4 py-3 text-left font-semibold text-xs">สมัครเมื่อ</th>
                                <th className="px-4 py-3 text-center font-semibold text-xs">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">กำลังโหลด...</td></tr>
                            ) : students.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">ไม่พบข้อมูลนักเรียน</td></tr>
                            ) : (
                                students.map((s) => (
                                    <tr key={s.id} className={`hover:bg-muted/30 transition-colors ${s.accountStatus === 'ARCHIVED' ? 'opacity-60' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-sm">{s.prefix}{s.firstName} {s.lastName}</div>
                                            <div className="text-xs text-muted-foreground">{s.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono">{s.studentId || '-'}</td>
                                        <td className="px-4 py-3 text-xs">{s.gradeLevel || '-'}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`text-xs ${s.borrowerType === 'NEW' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                {s.borrowerType === 'NEW' ? 'รายใหม่' : 'รายเก่า'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            {s.accountStatus === 'ACTIVE' ? (
                                                <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">ปกติ</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">จำหน่ายแล้ว</Badge>
                                            )}
                                            {!s.emailVerified && (
                                                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-xs ml-1">ยังไม่ยืนยัน</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs">{s._count.documents} ไฟล์</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {format(new Date(s.createdAt), 'dd MMM yy', { locale: th })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-primary hover:bg-primary/10" onClick={() => openEdit(s)} title="แก้ไข">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                {s.accountStatus === 'ACTIVE' ? (
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-orange-600 hover:bg-orange-50" onClick={() => openDialog(s, "ARCHIVE")} title="จำหน่ายออก">
                                                        <Archive className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-success hover:bg-success/10" onClick={() => openDialog(s, "RESTORE")} title="กู้คืน">
                                                        <RotateCcw className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:bg-destructive/10" onClick={() => openDialog(s, "DELETE")} title="ลบถาวร">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchStudents(pagination.page - 1)}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">หน้า {pagination.page} / {pagination.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchStudents(pagination.page + 1)}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Confirm Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogLabels[dialogAction].title}</DialogTitle>
                        <DialogDescription>{dialogLabels[dialogAction].desc}</DialogDescription>
                    </DialogHeader>
                    {selectedStudent && (
                        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-1">
                            <p><strong>ชื่อ:</strong> {selectedStudent.prefix}{selectedStudent.firstName} {selectedStudent.lastName}</p>
                            <p><strong>รหัสนักเรียน:</strong> {selectedStudent.studentId || '-'}</p>
                            <p><strong>เลขบัตรประชาชน:</strong> {selectedStudent.idCard}</p>
                            <p><strong>อีเมล:</strong> {selectedStudent.email}</p>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
                        <Button className={dialogLabels[dialogAction].color} onClick={handleAction} disabled={actionLoading}>
                            {actionLoading ? "กำลังดำเนินการ..." : dialogLabels[dialogAction].btn}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลนักเรียน</DialogTitle>
                        <DialogDescription>แก้ไขข้อมูลแล้วกด "บันทึก" เพื่อยืนยัน</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">คำนำหน้า</Label>
                                <Select value={editForm.prefix} onValueChange={(v) => setEditForm(p => ({ ...p, prefix: v }))}>
                                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ด.ช.">ด.ช.</SelectItem>
                                        <SelectItem value="ด.ญ.">ด.ญ.</SelectItem>
                                        <SelectItem value="นาย">นาย</SelectItem>
                                        <SelectItem value="นางสาว">นางสาว</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">ชื่อ</Label>
                                <Input value={editForm.firstName} onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))} className="text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">นามสกุล</Label>
                                <Input value={editForm.lastName} onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))} className="text-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">อีเมล</Label>
                                <Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">เบอร์โทร</Label>
                                <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="text-sm" placeholder="0812345678" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">ระดับชั้น</Label>
                                <Select value={editForm.gradeLevel} onValueChange={(v) => setEditForm(p => ({ ...p, gradeLevel: v }))}>
                                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ม.4">ม.4</SelectItem>
                                        <SelectItem value="ม.5">ม.5</SelectItem>
                                        <SelectItem value="ม.6">ม.6</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">ประเภทผู้กู้</Label>
                                <Select value={editForm.borrowerType} onValueChange={(v) => setEditForm(p => ({ ...p, borrowerType: v }))}>
                                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">รายใหม่</SelectItem>
                                        <SelectItem value="OLD">รายเก่า</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleEdit} disabled={editLoading}>
                            {editLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
