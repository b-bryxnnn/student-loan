import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GraduationCap, Banknote, Heart, Users, Calculator, CheckCircle2, AlertCircle, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { db } from '@/lib/db';

export default async function LoanInfoPage() {
    // ดึงข้อมูลเพิ่มเติมจาก DB (ถ้ามี)
    let extraSections: { title: string; content: string }[] = [];
    try {
        const dbSections = await db.loanInfoSection.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: { title: true, content: true }
        });
        extraSections = dbSections;
    } catch {
        // ยังไม่ได้ migrate ก็ไม่เป็นไร
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 px-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] opacity-50 pointer-events-none" />

            <div className="container mx-auto max-w-4xl relative z-10 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">

                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="hover-lift">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ข้อมูล กยศ. ลักษณะที่ 1</h1>
                        <p className="text-muted-foreground mt-1">กองทุนเงินให้กู้ยืมเพื่อการศึกษา — เฉพาะค่าครองชีพ</p>
                    </div>
                </div>

                {/* กยศ. คืออะไร */}
                <Card className="glass border-primary/10">
                    <CardHeader>
                        <BookOpen className="w-8 h-8 text-primary mb-2" />
                        <CardTitle className="text-xl">กยศ. คืออะไร?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                        <p>
                            <strong className="text-foreground">กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)</strong> เป็นกองทุนที่จัดตั้งขึ้นเพื่อให้โอกาสทางการศึกษาแก่นักเรียน นักศึกษาที่ขาดแคลนทุนทรัพย์
                        </p>
                        <Alert className="border-primary/30 bg-primary/5">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary text-sm">ลักษณะที่ 1 — สำหรับโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</AlertTitle>
                            <AlertDescription className="text-xs">
                                ให้กู้ยืม<strong>เฉพาะค่าครองชีพเท่านั้น</strong> ไม่รวมค่าธรรมเนียมการศึกษา เนื่องจากเป็นสถานศึกษาของรัฐ
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* คุณสมบัติ */}
                <Card className="glass border-primary/10">
                    <CardHeader>
                        <Users className="w-8 h-8 text-primary mb-2" />
                        <CardTitle className="text-xl">คุณสมบัติผู้มีสิทธิ์กู้ยืม</CardTitle>
                        <CardDescription>ต้องมีคุณสมบัติครบทุกข้อ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                "สัญชาติไทย",
                                "เป็นผู้ขาดแคลนทุนทรัพย์ — รายได้ครอบครัวไม่เกิน 360,000 บาท/ปี",
                                "ไม่เคยเป็นผู้สำเร็จการศึกษาระดับปริญญาตรีในสาขาใดมาก่อน",
                                "ไม่เป็นผู้ที่ทำงานประจำระหว่างศึกษา",
                                "ไม่เป็นบุคคลล้มละลาย",
                                "มีอายุไม่เกิน 30 ปีบริบูรณ์ ในวันที่ 1 มกราคม ของปีการศึกษาที่ยื่นกู้",
                                "ศึกษาอยู่ในสถานศึกษาที่เข้าร่วมดำเนินงานกับ กยศ.",
                                "ต้องทำกิจกรรมจิตอาสาไม่น้อยกว่า 36 ชั่วโมง/ปีการศึกษา"
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-success mt-1 shrink-0" />
                                    <span className="text-sm text-muted-foreground">{item}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* วงเงิน */}
                <Card className="glass border-primary/10">
                    <CardHeader>
                        <Banknote className="w-8 h-8 text-primary mb-2" />
                        <CardTitle className="text-xl">วงเงินกู้ยืมค่าครองชีพ</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-primary/10 text-primary">
                                        <th className="px-5 py-3 text-left font-semibold">ระดับการศึกษา</th>
                                        <th className="px-5 py-3 text-right font-semibold">ค่าครองชีพ/ปี (บาท)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {[
                                        { level: "มัธยมศึกษาตอนปลาย (ม.4-6)", amount: "สูงสุด 28,000" },
                                        { level: "ปวช.", amount: "สูงสุด 28,000" },
                                        { level: "ปวส.", amount: "สูงสุด 28,000" },
                                        { level: "ปริญญาตรี", amount: "สูงสุด 30,000" },
                                    ].map((r, i) => (
                                        <tr key={i} className="hover:bg-muted/30">
                                            <td className="px-5 py-3 font-medium">{r.level}</td>
                                            <td className="px-5 py-3 text-right">
                                                <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">{r.amount}</Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* จิตอาสา */}
                <Card className="glass border-primary/10">
                    <CardHeader>
                        <Heart className="w-8 h-8 text-destructive mb-2" />
                        <CardTitle className="text-xl">เงื่อนไขจิตอาสา</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                            <Card className="bg-destructive/5 border-destructive/20">
                                <CardContent className="py-4">
                                    <p className="text-2xl font-bold text-destructive">36</p>
                                    <p className="text-xs text-muted-foreground mt-1">ชั่วโมงขั้นต่ำ/ปี</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="py-4">
                                    <p className="text-2xl font-bold text-primary">ทุกภาคเรียน</p>
                                    <p className="text-xs text-muted-foreground mt-1">ต้องเข้าร่วมทุกเทอม</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-success/5 border-success/20">
                                <CardContent className="py-4">
                                    <p className="text-2xl font-bold text-success">บันทึก</p>
                                    <p className="text-xs text-muted-foreground mt-1">ผ่านแอป กยศ. Connect</p>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                {/* ตารางผ่อนชำระ */}
                <Card className="glass border-primary/10">
                    <CardHeader>
                        <Calculator className="w-8 h-8 text-primary mb-2" />
                        <CardTitle className="text-xl">การชำระเงินคืน กยศ.</CardTitle>
                        <CardDescription>ดอกเบี้ย 1%/ปี | ผ่อน 15 ปี | ปลอดหนี้ 2 ปีหลังจบ</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-primary/10 text-primary">
                                        <th className="px-4 py-3 text-left font-semibold">ปีที่ผ่อน</th>
                                        <th className="px-4 py-3 text-right font-semibold">% ของเงินกู้</th>
                                        <th className="px-4 py-3 text-right font-semibold">ตัวอย่าง (กู้ 84,000 บาท)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {[
                                        { y: "1", p: "1.5%", ex: "1,260" }, { y: "2", p: "2.5%", ex: "2,100" },
                                        { y: "3", p: "3.0%", ex: "2,520" }, { y: "4", p: "3.5%", ex: "2,940" },
                                        { y: "5", p: "4.0%", ex: "3,360" }, { y: "6", p: "4.5%", ex: "3,780" },
                                        { y: "7", p: "5.0%", ex: "4,200" }, { y: "8", p: "6.0%", ex: "5,040" },
                                        { y: "9", p: "7.0%", ex: "5,880" }, { y: "10", p: "8.0%", ex: "6,720" },
                                        { y: "11", p: "9.0%", ex: "7,560" }, { y: "12", p: "10.0%", ex: "8,400" },
                                        { y: "13", p: "11.0%", ex: "9,240" }, { y: "14", p: "12.0%", ex: "10,080" },
                                        { y: "15", p: "13.0%", ex: "10,920" },
                                    ].map((r, i) => (
                                        <tr key={i} className="hover:bg-muted/30">
                                            <td className="px-4 py-2 font-medium">ปีที่ {r.y}</td>
                                            <td className="px-4 py-2 text-right"><Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">{r.p}</Badge></td>
                                            <td className="px-4 py-2 text-right text-muted-foreground">{r.ex} บาท</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-4">* ข้อมูลอ้างอิงจาก กยศ. อาจมีการเปลี่ยนแปลง</p>
                    </CardContent>
                </Card>

                {/* =================== ข้อมูลเพิ่มเติมจากแอดมิน =================== */}
                {extraSections.length > 0 && (
                    <>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold tracking-tight">ข้อมูลเพิ่มเติมจากเจ้าหน้าที่</h2>
                        </div>
                        {extraSections.map((section, i) => (
                            <Card key={i} className="glass border-primary/10">
                                <CardHeader>
                                    <CardTitle className="text-lg">{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </>
                )}

                <div className="text-center pb-8">
                    <Link href="/">
                        <Button variant="outline" className="hover-lift">
                            <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้าแรก
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
