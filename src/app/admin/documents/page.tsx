"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Edit2, CheckCircle2, AlertCircle, RefreshCw, Send, Settings, MailWarning } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    // Action dialog state
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [actionType, setActionType] = useState("");
    const [actionRemark, setActionRemark] = useState("");
    const [actionDeadline, setActionDeadline] = useState("");

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus !== "ALL") params.append("status", filterStatus);
            if (searchQuery) params.append("q", searchQuery);

            const res = await fetch(`/api/admin/documents?${params.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setDocuments(data.documents);
            } else {
                toast.error("ดึงข้อมูลไม่สำเร็จ");
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [filterStatus]); // Re-fetch when status filter changes

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDocuments();
    };

    const toggleRow = (id: string) => {
        const newSet = new Set(selectedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedRows(newSet);
    };

    const toggleAll = () => {
        if (selectedRows.size === documents.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(documents.map(d => d.id)));
        }
    };

    const handleBulkAction = async () => {
        if (selectedRows.size === 0) return;

        try {
            const payload = {
                documentIds: Array.from(selectedRows),
                action: actionType,
                remark: actionType === 'REJECTED' ? actionRemark : null,
                deadline: actionType === 'REJECTED' && actionDeadline ? actionDeadline : null,
            };

            const res = await fetch('/api/admin/documents/bulk-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`ดำเนินการกับเอกสาร ${selectedRows.size} รายการสำเร็จ`);
                setIsActionOpen(false);
                setSelectedRows(new Set());
                fetchDocuments();
            } else {
                const data = await res.json();
                toast.error(data.error || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            toast.error("การเชื่อมต่อมีปัญหา");
        }
    };

    const StatusBadge = ({ doc }: { doc: any }) => {
        switch (doc.status) {
            case 'PENDING':
                return <Badge variant="outline" className="bg-warning/20 text-warning hover:bg-warning/30 border-warning/50">รอตรวจ</Badge>;
            case 'APPROVED':
                return <Badge variant="outline" className="bg-success/20 text-success hover:bg-success/30 border-success/50">ผ่าน</Badge>;
            case 'REJECTED':
                return <Badge variant="outline" className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/50">ตีกลับ</Badge>;
            default:
                return <Badge>{doc.status}</Badge>;
        }
    };

    const AdvancedStatusBadge = ({ doc }: { doc: any }) => {
        if (doc.sentToCentral) {
            return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">ส่งส่วนกลางแล้ว</Badge>;
        }
        if (doc.originalReceived) {
            return <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700">รับตัวจริง</Badge>;
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">จัดการเอกสารทั้งหมด</h1>
                    <p className="text-muted-foreground mt-1">ตรวจสอบ, แจ้งแก้ไข, อนุมัติ และตั้งสถานะเอกสาร</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchDocuments} className="hover-lift">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        รีเฟรช
                    </Button>
                </div>
            </div>

            <Card className="glass border-border/50 shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                    <div className="flex gap-2 flex-wrap items-center">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px] bg-background">
                                <SelectValue placeholder="สถานะทั้งหมด" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">สถานะทั้งหมด</SelectItem>
                                <SelectItem value="PENDING">เฉพาะรอตรวจสอบ</SelectItem>
                                <SelectItem value="APPROVED">ผ่านการตรวจสอบ</SelectItem>
                                <SelectItem value="REJECTED">ต้องแก้ไข</SelectItem>
                            </SelectContent>
                        </Select>

                        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2 min-w-[250px]">
                            <Input
                                placeholder="ค้นหา ชื่อ, นามสกุล, รหัสประชาชน, เลขท้ายเอกสาร..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-background max-w-sm"
                            />
                            <Button type="submit" variant="secondary">ค้นหา</Button>
                        </form>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedRows.size > 0 && (
                            <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="default" className="bg-primary shadow-md hover-lift">
                                        ดำเนินการ ({selectedRows.size})
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>จัดการเอกสาร {selectedRows.size} รายการ</DialogTitle>
                                        <DialogDescription>
                                            เลือกสถานะที่ต้องการเปลี่ยนสำหรับเอกสารที่เลือก
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="action">การดำเนินการ</Label>
                                            <Select value={actionType} onValueChange={setActionType}>
                                                <SelectTrigger id="action">
                                                    <SelectValue placeholder="เลือกการดำเนินการ..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="APPROVE">ผ่านการตรวจสอบเบื้องต้น</SelectItem>
                                                    <SelectItem value="REJECTED">ตีกลับ/ต้องแก้ไข (ส่งอีเมลแจ้ง)</SelectItem>
                                                    <SelectItem value="MARK_RECEIVED">ทำเครื่องหมาย "รับเอกสารตัวจริงแล้ว"</SelectItem>
                                                    <SelectItem value="MARK_SENT">ทำเครื่องหมาย "นำส่งส่วนกลางแล้ว"</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {actionType === 'REJECTED' && (
                                            <>
                                                <div className="grid gap-2 animate-in fade-in zoom-in duration-300">
                                                    <Label htmlFor="remark" className="text-destructive flex items-center gap-1">
                                                        <MailWarning className="w-4 h-4" />
                                                        เหตุผล (จะถูกส่งไปในอีเมล)
                                                    </Label>
                                                    <Textarea
                                                        id="remark"
                                                        placeholder="เช่น เซ็นชื่อไม่ครบ, วันที่ผิด..."
                                                        value={actionRemark}
                                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setActionRemark(e.target.value)}
                                                    />
                                                </div>
                                                <div className="grid gap-2 animate-in fade-in zoom-in duration-300">
                                                    <Label htmlFor="deadline">ให้แก้ไขภายในวันที่</Label>
                                                    <Input
                                                        type="date"
                                                        id="deadline"
                                                        value={actionDeadline}
                                                        onChange={(e) => setActionDeadline(e.target.value)}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={handleBulkAction}
                                            disabled={!actionType || (actionType === 'REJECTED' && !actionRemark)}
                                        >
                                            บันทึก
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader className="bg-muted/50 border-b border-border/50">
                                <TableRow>
                                    <TableHead className="w-[50px] pl-4">
                                        <Checkbox
                                            checked={documents.length > 0 && selectedRows.size === documents.length}
                                            onCheckedChange={toggleAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>ข้อมูลผู้กู้</TableHead>
                                    <TableHead>ประเภท / เทอม</TableHead>
                                    <TableHead>รหัสเอกสาร</TableHead>
                                    <TableHead>สถานะ</TableHead>
                                    <TableHead>วันที่ส่ง</TableHead>
                                    <TableHead className="text-right pr-4">เครื่องมือ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            กำลังโหลดข้อมูล...
                                        </TableCell>
                                    </TableRow>
                                ) : documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            ไม่พบเอกสาร
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map((doc) => (
                                        <TableRow key={doc.id} className="hover:bg-muted/30">
                                            <TableCell className="pl-4">
                                                <Checkbox
                                                    checked={selectedRows.has(doc.id)}
                                                    onCheckedChange={() => toggleRow(doc.id)}
                                                    aria-label="Select row"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{doc.user.prefix}{doc.user.firstName} {doc.user.lastName}</div>
                                                <div className="text-xs text-muted-foreground">{doc.user.idCard}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-sm">
                                                    {doc.type === 'CONFIRMATION' ? 'แบบยืนยัน' : 'สัญญา'}
                                                </div>
                                                <div className="text-xs text-muted-foreground bg-muted inline-block px-1 rounded mt-1">
                                                    {doc.academicYear.replace('_', '/')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-mono bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                                                    {doc.lastThreeDigits}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 items-start">
                                                    <StatusBadge doc={doc} />
                                                    <AdvancedStatusBadge doc={doc} />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(doc.createdAt), 'dd MMM yy HH:mm', { locale: th })}
                                            </TableCell>
                                            <TableCell className="text-right pr-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="icon" asChild title="เปิดพรีวิวในแท็บใหม่">
                                                        <a href={`https://drive.google.com/file/d/${doc.driveFileId}/view`} target="_blank" rel="noopener noreferrer">
                                                            <Eye className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

