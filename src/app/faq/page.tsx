import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db';

// FAQ เริ่มต้น (fallback ถ้ายังไม่มีข้อมูลใน DB)
const defaultFaqs = [
    { question: "กยศ. คืออะไร และลักษณะที่ 1 หมายถึงอะไร?", answer: "กยศ. คือกองทุนเงินให้กู้ยืมเพื่อการศึกษา ลักษณะที่ 1 คือเงินกู้ยืมสำหรับนักเรียนที่ขาดแคลนทุนทรัพย์ (รายได้ครอบครัวไม่เกิน 360,000 บาท/ปี) สำหรับโรงเรียนเราให้กู้เฉพาะค่าครองชีพเท่านั้น ไม่รวมค่าเล่าเรียน" },
    { question: "ใครสามารถกู้ยืมได้บ้าง?", answer: "นักเรียนที่มีสัญชาติไทย รายได้ครอบครัวรวมกันไม่เกิน 360,000 บาท/ปี อายุไม่เกิน 30 ปี ไม่เคยจบปริญญาตรี และไม่ทำงานประจำระหว่างศึกษา" },
    { question: "กู้ได้เท่าไหร่ต่อปี?", answer: "สำหรับระดับ ม.ปลาย/ปวช. กู้ค่าครองชีพได้สูงสุดประมาณ 28,000 บาท/ปี หรือประมาณ 2,333 บาท/เดือน (วงเงินอาจเปลี่ยนแปลงตามประกาศ กยศ.)" },
    { question: "ต้องเตรียมเอกสารอะไรบ้าง?", answer: "เอกสารหลักที่ต้องส่งผ่านระบบนี้มี 2 อย่าง: (1) แบบยืนยันเบิกเงินกู้ยืม (รวมสำเนาบัตรผู้กู้และผู้ปกครอง อย่างน้อย 3 หน้า) (2) สัญญากู้ยืมเงิน สำหรับผู้กู้รายใหม่ (อย่างน้อย 9 หน้า) ทั้งหมดต้องสแกนเป็นไฟล์ PDF" },
    { question: "จิตอาสาต้องทำกี่ชั่วโมง?", answer: "อย่างน้อย 36 ชั่วโมงต่อปีการศึกษา สามารถบันทึกผ่านแอป กยศ. Connect ได้" },
    { question: "ต้องชำระคืนเมื่อไหร่?", answer: "เริ่มชำระคืนหลังจบการศึกษา 2 ปี (ปลอดหนี้) โดยผ่อนได้สูงสุด 15 ปี อัตราดอกเบี้ย 1% ต่อปี" },
    { question: "ถ้าเอกสารถูกตีกลับ ต้องทำยังไง?", answer: "ระบบจะส่งอีเมลแจ้งเตือนพร้อมเหตุผลที่ต้องแก้ไข คุณสามารถอัปโหลดเอกสารใหม่ได้ในหน้าแดชบอร์ด" },
    { question: "รหัส OTP ไม่เข้าอีเมลทำอย่างไร?", answer: "ลองตรวจสอบโฟลเดอร์ \"สแปม (Spam/Junk)\" ก่อน หากยังไม่ได้รับ กดปุ่ม \"ขอ OTP ใหม่\" หรือติดต่อเจ้าหน้าที่ กยศ." },
    { question: "ลืมรหัสผ่านทำอย่างไร?", answer: "กดปุ่ม \"ลืมรหัสผ่าน\" ที่หน้าเข้าสู่ระบบ กรอกอีเมลที่ลงทะเบียนไว้ ระบบจะส่ง OTP เพื่อตั้งรหัสผ่านใหม่ภายใน 15 นาที" },
];

export default async function FAQPage() {
    // ดึงจาก DB ถ้ามี
    let faqs: { question: string; answer: string }[] = [];
    try {
        const dbFaqs = await db.faqItem.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: { question: true, answer: true }
        });
        faqs = dbFaqs.length > 0 ? dbFaqs : defaultFaqs;
    } catch {
        // ถ้ายังไม่ได้ migrate ใช้ default
        faqs = defaultFaqs;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] py-12 px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[100px] opacity-30 pointer-events-none" />

            <div className="container mx-auto max-w-3xl relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="hover-lift">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                            <HelpCircle className="w-8 h-8 text-primary" />
                            คำถามที่พบบ่อย (FAQ)
                        </h1>
                        <p className="text-muted-foreground mt-1">รวมคำตอบเกี่ยวกับระบบกู้ยืมเงิน กยศ. ลักษณะที่ 1</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, i) => (
                        <Card key={i} className="glass border-border/50 hover-lift">
                            <CardContent className="py-4 px-5">
                                <div className="flex items-start gap-3">
                                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold mt-0.5">
                                        {i + 1}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-sm text-foreground">{faq.question}</h3>
                                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="glass border-primary/10 text-center p-6">
                    <p className="text-sm text-muted-foreground mb-3">ยังมีคำถามเพิ่มเติม?</p>
                    <p className="text-sm font-medium">ติดต่อเจ้าหน้าที่ กยศ. ประจำโรงเรียนรัตนโกสินทร์สมโภชลาดกระบังได้โดยตรง</p>
                </Card>

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
