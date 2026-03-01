import Link from 'next/link';
import { ArrowRight, FileCheck, FileSignature, AlertCircle, CheckCircle2, GraduationCap, ClipboardList, Banknote, Bell, BookOpen, Calculator, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';

export default async function Home() {
  // ดึงประกาศล่าสุดที่ยังเปิดอยู่
  const announcements = await db.announcement.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-background/50 relative overflow-hidden flex flex-col">
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-secondary/30 rounded-full blur-[100px] opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4 py-12 md:py-24 relative z-10">

        {/* =================== HERO SECTION =================== */}
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-primary mb-4 text-sm font-medium">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            เปิดรับเอกสารปีการศึกษา 2567
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-secondary-foreground leading-tight">
            ระบบส่งเอกสาร กยศ. <br />
            <span className="text-2xl md:text-3xl font-medium text-foreground mt-2 block">โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            (ลักษณะ 1) ให้กู้ยืมเฉพาะค่าครองชีพเท่านั้น มิได้ให้กู้ยืมในส่วนของค่าธรรมเนียมการศึกษา หรือค่าใช้จ่ายเกี่ยวเนื่องกับการศึกษา
          </p>

          <Alert className="max-w-2xl mx-auto text-left border-warning/50 bg-warning/5 glass">
            <AlertCircle className="h-5 w-5 text-warning" />
            <AlertTitle className="text-warning font-semibold">ข้อตกลงและเงื่อนไขสำคัญก่อนดำเนินการ</AlertTitle>
            <AlertDescription className="mt-2 space-y-2 text-sm text-foreground/80">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-1 shrink-0" />
                <span>ข้าพเจ้าได้ปรึกษาและแจ้งผู้ปกครองก่อนทำรายการเรียบร้อยแล้ว</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-1 shrink-0" />
                <span>รับทราบว่าให้กู้ยืมเฉพาะค่าครองชีพเท่านั้น</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success mt-1 shrink-0" />
                <span>ยินยอมให้ระบบจัดเก็บข้อมูลส่วนบุคคล (PDPA) เพื่อใช้ประกอบการพิจารณาอนุมัติเงินกู้ยืมเพื่อการศึกษา</span>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-base hover-lift shadow-xl shadow-primary/30 group">
                เริ่มต้นลงทะเบียนผู้ใช้ใหม่
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base hover-lift glass">
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>
        </div>

        {/* =================== ประกาศล่าสุด =================== */}
        {announcements.length > 0 && (
          <div className="mt-16 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">ประกาศจากเจ้าหน้าที่</h2>
            </div>
            <div className="space-y-3">
              {announcements.map((a: { id: string; title: string; content: string; createdAt: Date }) => (
                <Card key={a.id} className="glass border-primary/10">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 mt-0.5 shrink-0 text-xs">ประกาศ</Badge>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{a.content}</p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {new Intl.DateTimeFormat('th-TH', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(a.createdAt))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* =================== ขั้นตอนการกู้ยืม =================== */}
        <div className="mt-20 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">ขั้นตอนการกู้ยืมเงิน กยศ.</h2>
            <p className="text-muted-foreground mt-2">ทำตามง่ายๆ เพียง 5 ขั้นตอน</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, icon: GraduationCap, title: "ลงทะเบียน", desc: "สมัครสมาชิกในเว็บไซต์นี้ ยืนยันอีเมลด้วย OTP" },
              { step: 2, icon: ClipboardList, title: "กรอกคำขอเบื้องต้น", desc: "กรอกฟอร์มคำขอกู้ยืม ระบุจุดประสงค์และแนบ ปพ.1" },
              { step: 3, icon: FileCheck, title: "ส่งแบบยืนยัน", desc: "อัปโหลดแบบยืนยันเบิกเงินกู้ยืม (PDF) เข้าระบบ" },
              { step: 4, icon: FileSignature, title: "ส่งสัญญา", desc: "อัปโหลดสัญญากู้ยืมเงิน (PDF) สำหรับผู้กู้รายใหม่" },
              { step: 5, icon: CheckCircle2, title: "นำส่งเอกสารตัวจริง", desc: "นำส่งเอกสารตัวจริงที่เจ้าหน้าที่ กยศ. ของโรงเรียน" },
            ].map(({ step, icon: Icon, title, desc }) => (
              <Card key={step} className="glass border-primary/10 hover-lift text-center relative">
                <CardContent className="pt-6 pb-4 px-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center font-bold text-lg mb-3">
                    {step}
                  </div>
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* =================== เอกสารที่ต้องเตรียม =================== */}
        <div className="mt-20 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">
          <Card className="glass hover-lift border-primary/10">
            <CardHeader>
              <FileCheck className="w-10 h-10 text-primary mb-4" />
              <CardTitle className="text-xl">เอกสารแบบยืนยันเบิกเงินกู้ยืม</CardTitle>
              <CardDescription>สิ่งที่ต้องเตรียมสำหรับอัปโหลดเข้าระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>📄 แบบยืนยันเบิกเงินกู้ยืม 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้กู้</strong> 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้ปกครอง</strong> 1 หน้า</p>
              <div className="bg-primary/5 p-3 rounded-md mt-4 border border-primary/10 text-foreground">
                <strong>📌 เงื่อนไข:</strong> รวมเป็น 1 ไฟล์ PDF จำนวนอย่างน้อย <strong>3 หน้า</strong> ตั้งชื่อไฟล์เป็น <code className="bg-muted px-1 rounded">R + เลขท้ายสามหลัก.pdf</code> เช่น <code className="bg-muted px-1 rounded">R001.pdf</code>
              </div>
            </CardContent>
          </Card>

          <Card className="glass hover-lift border-secondary-foreground/10">
            <CardHeader>
              <FileSignature className="w-10 h-10 text-secondary-foreground mb-4" />
              <CardTitle className="text-xl">เอกสารสัญญากู้ยืมเงิน</CardTitle>
              <CardDescription>สำหรับผู้กู้รายใหม่เท่านั้น</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>📄 สัญญากู้ยืมเงิน 7 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้กู้</strong> 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้ปกครอง</strong> 1 หน้า</p>
              <div className="bg-secondary-foreground/5 p-3 rounded-md mt-4 border border-secondary-foreground/10 text-foreground">
                <strong>📌 เงื่อนไข:</strong> รวมเป็น 1 ไฟล์ PDF จำนวนอย่างน้อย <strong>9 หน้า</strong> ตั้งชื่อไฟล์เป็น <code className="bg-muted px-1 rounded">C + เลขท้ายสามหลัก.pdf</code> เช่น <code className="bg-muted px-1 rounded">C001.pdf</code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =================== ตารางผ่อนชำระคืน =================== */}
        <div className="mt-20 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
          <div className="text-center mb-8">
            <Calculator className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-3xl font-bold tracking-tight">ตารางผ่อนชำระเงินคืน กยศ.</h2>
            <p className="text-muted-foreground mt-2">อัตราดอกเบี้ย 1% ต่อปี ผ่อนได้สูงสุด 15 ปี (เริ่มชำระหลังสำเร็จการศึกษา 2 ปี)</p>
          </div>

          <Card className="glass border-primary/10 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary/10 text-primary">
                      <th className="px-4 py-3 text-left font-semibold">ปีที่</th>
                      <th className="px-4 py-3 text-right font-semibold">ยอดชำระ/ปี (บาท)</th>
                      <th className="px-4 py-3 text-right font-semibold">% ของเงินกู้ยืม</th>
                      <th className="px-4 py-3 text-right font-semibold">ยอดชำระ/เดือน (โดยประมาณ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { year: "1", pct: "1.5%", yearly: "นำเงินกู้ × 1.5%", monthly: "~" },
                      { year: "2", pct: "2.5%", yearly: "นำเงินกู้ × 2.5%", monthly: "~" },
                      { year: "3", pct: "3.0%", yearly: "นำเงินกู้ × 3.0%", monthly: "~" },
                      { year: "4", pct: "3.5%", yearly: "นำเงินกู้ × 3.5%", monthly: "~" },
                      { year: "5", pct: "4.0%", yearly: "นำเงินกู้ × 4.0%", monthly: "~" },
                      { year: "6", pct: "4.5%", yearly: "นำเงินกู้ × 4.5%", monthly: "~" },
                      { year: "7", pct: "5.0%", yearly: "นำเงินกู้ × 5.0%", monthly: "~" },
                      { year: "8–12", pct: "6–8%", yearly: "เพิ่มขึ้นตามปี", monthly: "~" },
                      { year: "13–15", pct: "9–13%", yearly: "เพิ่มขึ้นตามปี", monthly: "~" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{row.year}</td>
                        <td className="px-4 py-3 text-right">{row.yearly}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs">{row.pct}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{row.monthly}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <Card className="glass border-primary/10">
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-primary">1%</p>
                <p className="text-xs text-muted-foreground mt-1">อัตราดอกเบี้ยต่อปี</p>
              </CardContent>
            </Card>
            <Card className="glass border-primary/10">
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-primary">15 ปี</p>
                <p className="text-xs text-muted-foreground mt-1">ระยะเวลาผ่อนชำระ</p>
              </CardContent>
            </Card>
            <Card className="glass border-primary/10">
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-primary">2 ปี</p>
                <p className="text-xs text-muted-foreground mt-1">ปลอดชำระหลังจบ</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">* ข้อมูลอ้างอิงจากกองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) อัตราผ่อนชำระจริงอาจเปลี่ยนแปลงตามประกาศกองทุนฯ</p>
        </div>

        {/* =================== ลิงก์ด่วน =================== */}
        <div className="mt-16 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-600">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/loan-info">
              <Card className="glass border-primary/10 p-6 text-center hover-lift cursor-pointer h-full">
                <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-sm mb-1">ข้อมูล กยศ. ฉบับเต็ม</h3>
                <p className="text-xs text-muted-foreground">คุณสมบัติ วงเงิน จิตอาสา ผ่อนชำระ</p>
              </Card>
            </Link>
            <Link href="/faq">
              <Card className="glass border-primary/10 p-6 text-center hover-lift cursor-pointer h-full">
                <HelpCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-sm mb-1">คำถามที่พบบ่อย</h3>
                <p className="text-xs text-muted-foreground">รวม 10 คำถามเกี่ยวกับการกู้ยืม</p>
              </Card>
            </Link>
            <a href="https://www.studentloan.or.th" target="_blank" rel="noopener noreferrer">
              <Card className="glass border-primary/10 p-6 text-center hover-lift cursor-pointer h-full">
                <GraduationCap className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-bold text-sm mb-1">เว็บไซต์ กยศ. ทางการ</h3>
                <p className="text-xs text-muted-foreground">studentloan.or.th</p>
              </Card>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
