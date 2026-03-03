import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, FileCheck, FileSignature, CheckCircle2, GraduationCap, ClipboardList, Banknote, Bell, BookOpen, Calculator, HelpCircle, Heart, Users, ExternalLink } from 'lucide-react';
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

  // ดึงข้อมูลเพิ่มเติมจาก DB
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
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-background/50 relative overflow-hidden flex flex-col">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-secondary/30 rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 py-10 sm:py-16 md:py-24 relative z-10">

        {/* =================== HERO SECTION with LOGOS =================== */}
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {/* Logos */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-2">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Student_Loan_logo.svg"
                alt="โลโก้กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)"
                fill
                className="object-contain drop-shadow-lg"
                unoptimized
              />
            </div>
            <div className="h-12 sm:h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png"
                alt="ตราโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง"
                fill
                className="object-contain drop-shadow-lg"
                unoptimized
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-primary text-xs sm:text-sm font-medium">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-primary"></span>
            </span>
            เปิดรับเอกสารปีการศึกษา 2567
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-secondary-foreground">ระบบส่งเอกสาร กยศ.</span>
            <br />
            <span className="text-xl sm:text-2xl md:text-3xl font-medium text-foreground mt-2 block">โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto px-2">
            ลักษณะที่ 1 — ให้กู้ยืมเฉพาะค่าครองชีพเท่านั้น มิได้ให้กู้ยืมในส่วนของค่าธรรมเนียมการศึกษาหรือค่าใช้จ่ายเกี่ยวเนื่องกับการศึกษา
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6 px-4 sm:px-0">
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
          <div className="mt-12 sm:mt-16 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold">ประกาศจากเจ้าหน้าที่</h2>
            </div>
            <div className="space-y-3">
              {announcements.map((a: { id: string; title: string; content: string; createdAt: Date }) => (
                <Card key={a.id} className="glass border-primary/10">
                  <CardContent className="py-3 sm:py-4 px-4 sm:px-5">
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
        <div className="mt-16 sm:mt-20 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">ขั้นตอนการกู้ยืมเงิน กยศ.</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">ทำตามง่ายๆ เพียง 5 ขั้นตอน</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {[
              { step: 1, icon: GraduationCap, title: "ลงทะเบียน", desc: "สมัครในเว็บนี้ ยืนยัน OTP" },
              { step: 2, icon: ClipboardList, title: "กรอกคำขอ", desc: "กรอกฟอร์ม ระบุจุดประสงค์" },
              { step: 3, icon: FileCheck, title: "ส่งแบบยืนยัน", desc: "อัปโหลดแบบยืนยัน (PDF)" },
              { step: 4, icon: FileSignature, title: "ส่งสัญญา", desc: "สัญญากู้ยืม (รายใหม่)" },
              { step: 5, icon: CheckCircle2, title: "นำส่งตัวจริง", desc: "เอกสารตัวจริงที่ รร." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <Card key={step} className="glass border-primary/10 hover-lift text-center relative">
                <CardContent className="pt-5 pb-4 px-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center font-bold text-sm sm:text-lg mb-2 sm:mb-3">
                    {step}
                  </div>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold text-xs sm:text-sm">{title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* =================== กยศ. คืออะไร (Full Info) =================== */}
        <div className="mt-16 sm:mt-20 max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">

          {/* Gradient Divider */}
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">ข้อมูล กยศ. ฉบับเต็ม</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          {/* กยศ. คืออะไร */}
          <Card className="glass border-primary/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-secondary" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                กยศ. คืออะไร?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)</strong> เป็นกองทุนที่จัดตั้งขึ้นเพื่อให้โอกาสทางการศึกษาแก่นักเรียน นักศึกษาที่ขาดแคลนทุนทรัพย์
              </p>
              <Alert className="border-primary/30 bg-primary/5">
                <GraduationCap className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary text-sm">ลักษณะที่ 1 — สำหรับโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</AlertTitle>
                <AlertDescription className="text-xs">
                  ให้กู้ยืม<strong>เฉพาะค่าครองชีพเท่านั้น</strong> ไม่รวมค่าธรรมเนียมการศึกษา เนื่องจากเป็นสถานศึกษาของรัฐ
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* คุณสมบัติ */}
          <Card className="glass border-primary/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                คุณสมบัติผู้มีสิทธิ์กู้ยืม
              </CardTitle>
              <CardDescription>ต้องมีคุณสมบัติครบทุกข้อ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5 sm:space-y-3">
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
                  <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* วงเงิน */}
          <Card className="glass border-primary/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-secondary via-primary to-secondary" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                วงเงินกู้ยืมค่าครองชีพ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary/10 text-primary">
                      <th className="px-4 sm:px-5 py-3 text-left font-semibold text-xs sm:text-sm">ระดับการศึกษา</th>
                      <th className="px-4 sm:px-5 py-3 text-right font-semibold text-xs sm:text-sm">ค่าครองชีพ/ปี (บาท)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { level: "มัธยมศึกษาตอนปลาย (ม.4-6)", amount: "สูงสุด 28,000" },
                      { level: "ปวช.", amount: "สูงสุด 28,000" },
                      { level: "ปวส.", amount: "สูงสุด 28,000" },
                      { level: "ปริญญาตรี", amount: "สูงสุด 30,000" },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 sm:px-5 py-3 font-medium text-xs sm:text-sm">{r.level}</td>
                        <td className="px-4 sm:px-5 py-3 text-right">
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs" variant="outline">{r.amount}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* จิตอาสา */}
          <Card className="glass border-primary/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-destructive/40 via-destructive to-destructive/40" />
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                เงื่อนไขจิตอาสา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="py-3 sm:py-4 px-2">
                    <p className="text-xl sm:text-2xl font-bold text-destructive">36</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ชั่วโมงขั้นต่ำ/ปี</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="py-3 sm:py-4 px-2">
                    <p className="text-lg sm:text-2xl font-bold text-primary">ทุกเทอม</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ต้องเข้าร่วม</p>
                  </CardContent>
                </Card>
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="py-3 sm:py-4 px-2">
                    <p className="text-lg sm:text-2xl font-bold text-success">บันทึก</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">กยศ. Connect</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* ตารางผ่อนชำระ */}
          <Card className="glass border-primary/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <div>
                  <CardTitle className="text-lg sm:text-xl">การชำระเงินคืน กยศ.</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">ดอกเบี้ย 1%/ปี | ผ่อน 15 ปี | ปลอดหนี้ 2 ปีหลังจบ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary/10 text-primary">
                      <th className="px-3 sm:px-4 py-2.5 text-left font-semibold text-xs sm:text-sm">ปีที่ผ่อน</th>
                      <th className="px-3 sm:px-4 py-2.5 text-right font-semibold text-xs sm:text-sm">% ของเงินกู้</th>
                      <th className="px-3 sm:px-4 py-2.5 text-right font-semibold text-xs sm:text-sm hidden sm:table-cell">ตัวอย่าง (กู้ 84,000 บาท)</th>
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
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm">ปีที่ {r.y}</td>
                        <td className="px-3 sm:px-4 py-2 text-right">
                          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] sm:text-xs">{r.p}</Badge>
                        </td>
                        <td className="px-3 sm:px-4 py-2 text-right text-muted-foreground text-xs hidden sm:table-cell">{r.ex} บาท</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-4">* ข้อมูลอ้างอิงจาก กยศ. อาจมีการเปลี่ยนแปลง</p>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <Card className="glass border-primary/10">
              <CardContent className="py-3 sm:py-4 px-2">
                <p className="text-xl sm:text-2xl font-bold text-primary">1%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ดอกเบี้ยต่อปี</p>
              </CardContent>
            </Card>
            <Card className="glass border-primary/10">
              <CardContent className="py-3 sm:py-4 px-2">
                <p className="text-xl sm:text-2xl font-bold text-primary">15 ปี</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ระยะเวลาผ่อน</p>
              </CardContent>
            </Card>
            <Card className="glass border-primary/10">
              <CardContent className="py-3 sm:py-4 px-2">
                <p className="text-xl sm:text-2xl font-bold text-primary">2 ปี</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ปลอดชำระหลังจบ</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* =================== เอกสารที่ต้องเตรียม =================== */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
          <Card className="glass hover-lift border-primary/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-primary/50" />
            <CardHeader>
              <FileCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">เอกสารแบบยืนยันเบิกเงินกู้ยืม</CardTitle>
              <CardDescription className="text-xs sm:text-sm">สิ่งที่ต้องเตรียมสำหรับอัปโหลดเข้าระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
              <p>📄 แบบยืนยันเบิกเงินกู้ยืม 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้กู้</strong> 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้ปกครอง</strong> 1 หน้า</p>
              <div className="bg-primary/5 p-3 rounded-md mt-4 border border-primary/10 text-foreground text-xs">
                <strong>📌 เงื่อนไข:</strong> รวมเป็น 1 ไฟล์ PDF อย่างน้อย <strong>3 หน้า</strong> ตั้งชื่อไฟล์เป็น <code className="bg-muted px-1 rounded">R + เลขท้าย 3 หลัก.pdf</code> เช่น <code className="bg-muted px-1 rounded">R001.pdf</code>
              </div>
            </CardContent>
          </Card>

          <Card className="glass hover-lift border-secondary-foreground/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-secondary-foreground to-secondary-foreground/50" />
            <CardHeader>
              <FileSignature className="w-8 h-8 sm:w-10 sm:h-10 text-secondary-foreground mb-3 sm:mb-4" />
              <CardTitle className="text-lg sm:text-xl">เอกสารสัญญากู้ยืมเงิน</CardTitle>
              <CardDescription className="text-xs sm:text-sm">สำหรับผู้กู้รายใหม่เท่านั้น</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-muted-foreground">
              <p>📄 สัญญากู้ยืมเงิน 7 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้กู้</strong> 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้ปกครอง</strong> 1 หน้า</p>
              <div className="bg-secondary-foreground/5 p-3 rounded-md mt-4 border border-secondary-foreground/10 text-foreground text-xs">
                <strong>📌 เงื่อนไข:</strong> รวมเป็น 1 ไฟล์ PDF อย่างน้อย <strong>9 หน้า</strong> ตั้งชื่อไฟล์เป็น <code className="bg-muted px-1 rounded">C + เลขท้าย 3 หลัก.pdf</code> เช่น <code className="bg-muted px-1 rounded">C001.pdf</code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =================== ข้อมูลเพิ่มเติมจากแอดมิน =================== */}
        {extraSections.length > 0 && (
          <div className="mt-16 sm:mt-20 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">ข้อมูลเพิ่มเติมจากเจ้าหน้าที่</h2>
            </div>
            {extraSections.map((section, i) => (
              <Card key={i} className="glass border-primary/10">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* =================== ลิงก์ด่วน =================== */}
        <div className="mt-12 sm:mt-16 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Link href="/loan-info">
              <Card className="glass border-primary/10 p-4 sm:p-6 text-center hover-lift cursor-pointer h-full">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2 sm:mb-3" />
                <h3 className="font-bold text-xs sm:text-sm mb-1">หน้าข้อมูล กยศ.</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">คุณสมบัติ วงเงิน จิตอาสา ผ่อนชำระ</p>
              </Card>
            </Link>
            <Link href="/faq">
              <Card className="glass border-primary/10 p-4 sm:p-6 text-center hover-lift cursor-pointer h-full">
                <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2 sm:mb-3" />
                <h3 className="font-bold text-xs sm:text-sm mb-1">คำถามที่พบบ่อย</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">รวมคำถามเกี่ยวกับการกู้ยืม</p>
              </Card>
            </Link>
            <a href="https://www.studentloan.or.th" target="_blank" rel="noopener noreferrer">
              <Card className="glass border-primary/10 p-4 sm:p-6 text-center hover-lift cursor-pointer h-full">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2 sm:mb-3" />
                <h3 className="font-bold text-xs sm:text-sm mb-1 flex items-center justify-center gap-1">
                  เว็บไซต์ กยศ. ทางการ
                  <ExternalLink className="w-3 h-3" />
                </h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">studentloan.or.th</p>
              </Card>
            </a>
          </div>
        </div>

        {/* =================== Footer =================== */}
        <footer className="mt-16 sm:mt-20 border-t border-border/50 pt-8 pb-4 max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative w-8 h-8">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Student_Loan_logo.svg"
                alt="กยศ."
                fill
                className="object-contain opacity-60"
                unoptimized
              />
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="relative w-8 h-8">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png"
                alt="ร.ส.ล."
                fill
                className="object-contain opacity-60"
                unoptimized
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            ระบบรับเอกสาร กยศ. เบื้องต้น — โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            พัฒนาโดยงาน กยศ. ฝ่ายบริหารงานวิชาการ
          </p>
        </footer>

      </div>
    </div>
  );
}
