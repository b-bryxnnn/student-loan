import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, FileCheck, FileSignature, CheckCircle2, GraduationCap, ClipboardList, Banknote, Bell, BookOpen, Calculator, HelpCircle, Heart, Users, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { Metadata } from 'next';

// 1. ตั้งค่า Metadata สำหรับหน้า Homepage เพื่อ SEO และการแชร์บนโซเชียลมีเดีย
export const metadata: Metadata = {
  title: 'ระบบส่งเอกสาร กยศ. ออนไลน์ - โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง (กยศ.รส.ล)',
  description: 'ช่องทางหลักในการส่งเอกสาร กยศ รสล แบบออนไลน์ ตรวจสอบสถานะและจัดการเอกสารเงินกู้ยืมเพื่อการศึกษา โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง รวดเร็วและปลอดภัย',
  keywords: ['กยศ.รส.ล', 'กยศ รสล', 'ส่งเอกสาร กยศ รสล', 'ส่งเอกสารกยศ ออนไลน์', 'กยศ. โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง'],
  alternates: {
    canonical: 'https://กยศ.rslhub.me', // แจ้งบอทให้รู้ว่า URL หลักคืออะไร
  },
  openGraph: {
    title: 'ระบบส่งเอกสาร กยศ. ออนไลน์ (กยศ.รส.ล) - โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง',
    description: 'ระบบจัดการและส่งเอกสาร กยศ ออนไลน์ สำหรับนักเรียนโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง (กยศ รสล) สะดวก รวดเร็ว',
    url: 'https://กยศ.rslhub.me', // ข้อควรระวัง: หากเปลี่ยนโดเมน อย่าลืมมาอัปเดตตรงนี้ด้วย
    siteName: 'กยศ. รส.ล.',
    images: [
      {
        url: 'https://กยศ.rslhub.me/og-image.jpg', // ทริค: ควรออกแบบรูปปกเว็บขนาด 1200x630 ไปวางในโฟลเดอร์ public/og-image.jpg จะสวยที่สุดเมื่อแชร์ลิงก์
        width: 1200,
        height: 630,
        alt: 'ระบบส่งเอกสาร กยศ. รส.ล.',
      },
    ],
    locale: 'th_TH',
    type: 'website',
  },
};

export default async function Home() {
  // 2. สร้างตัวแปร JSON-LD Structured Data ชนิด WebApplication เพื่อระบุว่านี่คือเว็บแอปพลิเคชัน ไม่ใช่เว็บบล็อกทั่วไป
  // เพื่อแก้ปัญหา 'No items detected' ใน Rich Results Test จากทาง Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'ระบบรับเอกสาร กยศ. เบื้องต้น โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง',
    alternateName: ['กยศ.รส.ล', 'กยศ รสล', 'ส่งเอกสาร กยศ รสล'], // ใส่คีย์เวิร์ดที่นักเรียนชอบค้นหาเข้าไปตรงนี้
    url: 'https://กยศ.rslhub.me',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'All',
    description: 'ระบบจัดการและส่งเอกสารเงินกู้ยืมเพื่อการศึกษา (กยศ.) รูปแบบออนไลน์ สำหรับนักเรียนโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง เพื่อความสะดวกและปลอดภัย',
    provider: {
      '@type': 'School',
      name: 'โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง',
      alternateName: 'รส.ล.',
      url: 'https://www.rsl.ac.th' // ข้อควรระวัง: เปลี่ยนเป็นเว็บหลักจริงของโรงเรียนได้ถ้าจำเป็น
    }
  };

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
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden flex flex-col">
      {/* 3. นำ JSON-LD มาฝังลงใน Script Tag เพื่อให้หน้าเว็บทำการ render ข้อมูล Schema ให้ Google Bot มองเห็นอย่างสมบูรณ์ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Decorative Shapes */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-primary/4 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-warning/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 relative z-10">

        {/* =================== HERO SECTION =================== */}
        <div className="max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">

          {/* Logos */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-4">
            <div className="relative w-18 h-18 sm:w-22 sm:h-22 md:w-28 md:h-28 flex-shrink-0 rounded-full bg-white shadow-lg p-2 ring-2 ring-warning/30">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Student_Loan_logo.svg"
                alt="โลโก้กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)"
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
            <div className="h-14 sm:h-18 w-px bg-gradient-to-b from-transparent via-warning/40 to-transparent" />
            <div className="relative w-18 h-18 sm:w-22 sm:h-22 md:w-28 md:h-28 flex-shrink-0 rounded-full bg-white shadow-lg p-2 ring-2 ring-warning/30">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png"
                alt="ตราโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง"
                fill
                className="object-contain p-2"
                unoptimized
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-primary">
            ระบบส่งเอกสาร กยศ. เบื้องต้น
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-foreground/80">
            โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง
          </p>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto px-2">
            สำหรับนักเรียนที่ขาดแคลนทุนทรัพย์ (รายได้ครอบครัวไม่เกิน 360,000 บาท/ปี)
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6 px-4 sm:px-0">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto text-sm sm:text-base hover-lift shadow-lg group">
                ลงทะเบียนผู้ใช้ใหม่
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base hover-lift border-primary/40 bg-white">
                เข้าสู่ระบบ
              </Button>
            </Link>
          </div>

          {/* Gold divider */}
          <div className="gold-divider max-w-xs mx-auto mt-6" />
        </div>

        {/* =================== ประกาศ =================== */}
        {announcements.length > 0 && (
          <div className="mt-10 sm:mt-14 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold">ประกาศจากเจ้าหน้าที่</h2>
            </div>
            <div className="space-y-3">
              {announcements.map((a: { id: string; title: string; content: string; createdAt: Date }) => (
                <Card key={a.id} className="border-primary/10 shadow-sm">
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

        {/* =================== ขั้นตอน =================== */}
        <div className="mt-14 sm:mt-16 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">ขั้นตอนการดำเนินการกู้ยืมเงิน กยศ.</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">โปรดดำเนินการตามลำดับต่อไปนี้ให้ครบถ้วน</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { step: 1, icon: ClipboardList, title: "ยื่นคำขอกู้ยืม", desc: "กรอกแบบคำขอกู้ยืมเบื้องต้นผ่านระบบนี้" },
              { step: 2, icon: Download, title: "ดาวน์โหลดแอปพลิเคชัน", desc: "ติดตั้ง กยศ.Connect และดำเนินการตามที่กำหนด" },
              { step: 3, icon: FileSignature, title: "ลงนามสัญญาและแบบยืนยัน", desc: "ลงนามสัญญากู้ยืมและแบบยืนยันเบิกเงิน" },
              { step: 4, icon: FileCheck, title: "จัดทำไฟล์ PDF", desc: "สแกนเอกสารรวมเป็น PDF และอัปโหลดผ่านระบบนี้" },
              { step: 5, icon: CheckCircle2, title: "นำส่งเอกสารตัวจริง", desc: "นำเอกสารฉบับจริงมายื่น ณ สถานศึกษา" },
              { step: 6, icon: ArrowRight, title: "แก้ไข (หากมี)", desc: "หากเอกสารไม่สมบูรณ์ แก้ไขแล้วส่งใหม่" },
            ].map(({ step, icon: Icon, title, desc }) => (
              <Card key={step} className="border-primary/10 shadow-sm text-center hover-lift">
                <CardContent className="pt-4 pb-3 px-2 sm:px-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground mx-auto flex items-center justify-center font-bold text-sm mb-2">
                    {step}
                  </div>
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <h3 className="font-semibold text-xs sm:text-sm">{title}</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* =================== ข้อมูล กยศ. =================== */}
        <div className="mt-14 sm:mt-16 max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-400">

          <div className="flex items-center gap-3 mb-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">ข้อมูล กยศ. ฉบับเต็ม</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          </div>

          {/* กยศ. คืออะไร */}
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/30" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.) คืออะไร?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">กองทุนเงินให้กู้ยืมเพื่อการศึกษา (กยศ.)</strong> เป็นหน่วยงานของรัฐที่จัดตั้งขึ้นตามพระราชบัญญัติกองทุนเงินให้กู้ยืมเพื่อการศึกษา พ.ศ. 2560 มีวัตถุประสงค์เพื่อให้โอกาสทางการศึกษาแก่นักเรียนและนักศึกษาที่ขาดแคลนทุนทรัพย์ หรือศึกษาในสาขาวิชาที่เป็นความต้องการของประเทศ
              </p>
              <p>
                กองทุนแบ่งลักษณะการให้กู้ยืมออกเป็น <strong className="text-foreground">4 ลักษณะ</strong> ดังนี้
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
                  <p className="font-semibold text-primary text-xs mb-1">ลักษณะที่ 1</p>
                  <p className="text-xs text-muted-foreground">เงินกู้ยืมเพื่อการศึกษาสำหรับนักเรียน/นักศึกษาที่ขาดแคลนทุนทรัพย์ (รายได้ครอบครัวไม่เกิน 360,000 บาท/ปี)</p>
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
                  <p className="font-semibold text-xs mb-1">ลักษณะที่ 2</p>
                  <p className="text-xs text-muted-foreground">เงินกู้ยืมเพื่อการศึกษาสำหรับผู้ที่ต้องการเงินกู้ยืมในสาขาวิชาที่เป็นความต้องการหลัก</p>
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
                  <p className="font-semibold text-xs mb-1">ลักษณะที่ 3</p>
                  <p className="text-xs text-muted-foreground">เงินกู้ยืมเพื่อการศึกษาสำหรับผู้ศึกษาในสาขาวิชาที่ขาดแคลน หรือสาขาที่กองทุนมุ่งส่งเสริม</p>
                </div>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-3">
                  <p className="font-semibold text-xs mb-1">ลักษณะที่ 4</p>
                  <p className="text-xs text-muted-foreground">เงินกู้ยืมเพื่อการศึกษาสำหรับผู้ศึกษาในสาขาวิชาที่ขาดแคลนและเป็นผู้ขาดแคลนทุนทรัพย์</p>
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/15 rounded-lg p-3 sm:p-4 mt-2">
                <p className="font-semibold text-primary text-sm mb-1">สำหรับโรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</p>
                <p className="text-xs text-muted-foreground">
                  เนื่องจากเป็นสถานศึกษาของรัฐ ค่าเล่าเรียนจะได้รับการสนับสนุนจากรัฐบาลโดยตรง จึงให้กู้ยืมเฉพาะ<strong>ค่าครองชีพ</strong>เป็นหลัก ภายใต้ลักษณะที่ 1 (ผู้ขาดแคลนทุนทรัพย์)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* แอปพลิเคชัน กยศ. Connect */}
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/40 via-primary/80 to-primary/40" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                แอปพลิเคชัน กยศ. Connect
              </CardTitle>
              <CardDescription className="text-xs">แอปพลิเคชันสำหรับดำเนินการกู้ยืมเงิน กยศ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">กยศ. Connect</strong> เป็นแอปพลิเคชันทางการของกองทุนเงินให้กู้ยืมเพื่อการศึกษา ที่ผู้กู้ยืมทุกคนจำเป็นต้องดาวน์โหลดและใช้งาน เพื่อดำเนินการต่างๆ ได้แก่
              </p>
              <div className="space-y-2">
                {[
                  "ลงทะเบียนและยืนยันตัวตนผู้กู้ยืม",
                  "ยื่นแบบคำขอกู้ยืมเงิน ผ่านระบบ กยศ.",
                  "ลงนามสัญญากู้ยืมเงินแบบดิจิทัล (e-Signature)",
                  "ลงนามแบบยืนยันการเบิกเงินกู้ยืมในแต่ละภาคเรียน",
                  "บันทึกกิจกรรมจิตอาสา",
                  "ตรวจสอบสถานะการกู้ยืมและยอดหนี้คงค้าง",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <a href="https://apps.apple.com/th/app/%E0%B8%81%E0%B8%A2%E0%B8%A8-connect/id1659848498" target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer text-xs">App Store (iOS)</Badge>
                </a>
                <a href="https://play.google.com/store/apps/details?id=th.or.studentloan.studentloan" target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer text-xs">Google Play (Android)</Badge>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* คุณสมบัติ */}
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                คุณสมบัติผู้มีสิทธิ์กู้ยืม
              </CardTitle>
              <CardDescription className="text-xs">ต้องมีคุณสมบัติครบทุกข้อ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  "สัญชาติไทย",
                  "เป็นผู้ขาดแคลนทุนทรัพย์ — รายได้ครอบครัวไม่เกิน 360,000 บาท/ปี",
                  "ไม่เคยเป็นผู้สำเร็จการศึกษาระดับปริญญาตรีในสาขาใดมาก่อน",
                  "ไม่เป็นผู้ที่ทำงานประจำระหว่างศึกษา",
                  "ไม่เป็นบุคคลล้มละลาย",
                  "อายุไม่เกิน 30 ปีบริบูรณ์ ในวันที่ 1 มกราคม ของปีการศึกษาที่ยื่นกู้",
                  "ศึกษาอยู่ในสถานศึกษาที่เข้าร่วมดำเนินงานกับ กยศ.",
                  "ทำกิจกรรมจิตอาสาไม่น้อยกว่า 36 ชั่วโมง/ปีการศึกษา"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span className="text-xs sm:text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* วงเงิน — ข้อมูลถูกต้องจาก กยศ. ปีการศึกษา 2569 */}
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary" />
                กำหนดลักษณะและขอบเขตการให้เงินกู้ยืม — ปีการศึกษา 2569
              </CardTitle>
              <CardDescription className="text-xs">สำหรับสถานศึกษาระดับมัธยมปลาย (ผู้ขาดแคลนทุนทรัพย์)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary/10 text-primary">
                      <th className="px-4 py-3 text-left font-semibold text-xs sm:text-sm">ระดับการศึกษา</th>
                      <th className="px-4 py-3 text-right font-semibold text-xs sm:text-sm">ค่าเล่าเรียน/ปี</th>
                      <th className="px-4 py-3 text-right font-semibold text-xs sm:text-sm">ค่าครองชีพ/ปี</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr className="bg-primary/5">
                      <td className="px-4 py-3 font-medium text-xs sm:text-sm">
                        มัธยมศึกษาตอนปลาย (ม.4-6)
                        <br />
                        <span className="text-[10px] sm:text-xs text-muted-foreground">⭐ รส.ล. อยู่ในระดับนี้</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">14,000 บาท</Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">ร.ร. รัฐ ไม่กู้ส่วนนี้</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className="bg-primary text-primary-foreground text-xs">21,600 บาท</Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">เดือนละ 1,800 บาท</p>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-xs sm:text-sm text-muted-foreground">ปวช.</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className="text-muted-foreground text-xs">21,000 บาท</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className="text-muted-foreground text-xs">21,600 บาท</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-xs sm:text-sm text-muted-foreground">ปวท./ปวส.</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className="text-muted-foreground text-xs">25,000-60,000 บาท</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className="text-muted-foreground text-xs">—</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-xs sm:text-sm text-muted-foreground">อนุปริญญา/ปริญญาตรี</td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className="text-muted-foreground text-xs">50,000-200,000 บาท</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="outline" className="text-muted-foreground text-xs">36,000 บาท</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground text-center py-3 border-t border-border/50">
                * สำหรับผู้กู้ยืมเงินที่มีรายได้ต่อครอบครัวไม่เกิน 360,000 บาท ต่อปี สามารถกู้ยืมค่าครองชีพ และได้อัตราดอกเบี้ยตามที่กองทุนกำหนด
              </p>
            </CardContent>
          </Card>

          {/* จิตอาสา */}
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-destructive/30 via-destructive/60 to-destructive/30" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-destructive" />
                เงื่อนไขจิตอาสา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <Card className="bg-destructive/5 border-destructive/10 shadow-none">
                  <CardContent className="py-3 px-2">
                    <p className="text-xl sm:text-2xl font-bold text-destructive">36</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ชั่วโมงขั้นต่ำ/ปี</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/5 border-primary/10 shadow-none">
                  <CardContent className="py-3 px-2">
                    <p className="text-lg sm:text-2xl font-bold text-primary">ทุกเทอม</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ต้องเข้าร่วม</p>
                  </CardContent>
                </Card>
                <Card className="bg-success/5 border-success/10 shadow-none">
                  <CardContent className="py-3 px-2">
                    <p className="text-lg sm:text-2xl font-bold text-success">บันทึก</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">กยศ. Connect</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* ตารางผ่อนชำระ */}
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20" />
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base sm:text-lg">การชำระเงินคืน กยศ.</CardTitle>
                  <CardDescription className="text-xs">ดอกเบี้ย 1%/ปี | ผ่อน 15 ปี | ปลอดหนี้ 2 ปีหลังจบ</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary/10 text-primary">
                      <th className="px-3 py-2 text-left font-semibold text-xs">ปีที่ผ่อน</th>
                      <th className="px-3 py-2 text-right font-semibold text-xs">% ของเงินกู้</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { y: "1", p: "1.5%" }, { y: "2", p: "2.5%" },
                      { y: "3", p: "3.0%" }, { y: "4", p: "3.5%" },
                      { y: "5", p: "4.0%" }, { y: "6", p: "4.5%" },
                      { y: "7", p: "5.0%" }, { y: "8", p: "6.0%" },
                      { y: "9", p: "7.0%" }, { y: "10", p: "8.0%" },
                      { y: "11", p: "9.0%" }, { y: "12", p: "10.0%" },
                      { y: "13", p: "11.0%" }, { y: "14", p: "12.0%" },
                      { y: "15", p: "13.0%" },
                    ].map((r, i) => (
                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-1.5 font-medium text-xs">ปีที่ {r.y}</td>
                        <td className="px-3 py-1.5 text-right">
                          <Badge variant="outline" className="bg-primary/5 border-primary/15 text-primary text-xs">{r.p}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-3">* ข้อมูลอ้างอิงจาก กยศ. อาจมีการเปลี่ยนแปลง</p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <Card className="border-primary/10 shadow-sm">
              <CardContent className="py-3 px-2">
                <p className="text-xl sm:text-2xl font-bold text-primary">1%</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ดอกเบี้ยต่อปี</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-sm">
              <CardContent className="py-3 px-2">
                <p className="text-xl sm:text-2xl font-bold text-primary">15 ปี</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ระยะเวลาผ่อน</p>
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-sm">
              <CardContent className="py-3 px-2">
                <p className="text-xl sm:text-2xl font-bold text-primary">2 ปี</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">ปลอดชำระหลังจบ</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* =================== เอกสารที่ต้องเตรียม =================== */}
        <div className="mt-14 sm:mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
          <Card className="hover-lift border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-primary/40" />
            <CardHeader>
              <FileCheck className="w-8 h-8 text-primary mb-3" />
              <CardTitle className="text-base sm:text-lg">เอกสารแบบยืนยันเบิกเงินกู้ยืม</CardTitle>
              <CardDescription className="text-xs">ทุกคนต้องส่ง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <p>📄 แบบยืนยันเบิกเงินกู้ยืม 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้กู้</strong> 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้ปกครอง</strong> 1 หน้า</p>
              <div className="bg-primary/5 p-3 rounded-md mt-3 border border-primary/10 text-foreground text-xs">
                <strong>📌</strong> รวม 1 ไฟล์ PDF ≥ <strong>3 หน้า</strong> ชื่อไฟล์: <code className="bg-muted px-1 rounded">R + เลขท้าย 3 หลัก.pdf</code>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift border-primary/10 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-secondary-foreground to-secondary-foreground/40" />
            <CardHeader>
              <FileSignature className="w-8 h-8 text-secondary-foreground mb-3" />
              <CardTitle className="text-base sm:text-lg">เอกสารสัญญากู้ยืมเงิน</CardTitle>
              <CardDescription className="text-xs">เฉพาะผู้กู้รายใหม่</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs sm:text-sm text-muted-foreground">
              <p>📄 สัญญากู้ยืมเงิน 7 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้กู้</strong> 1 หน้า</p>
              <p>🪪 สำเนาบัตรประจำตัวประชาชน<strong>ผู้ปกครอง</strong> 1 หน้า</p>
              <div className="bg-secondary-foreground/5 p-3 rounded-md mt-3 border border-secondary-foreground/10 text-foreground text-xs">
                <strong>📌</strong> รวม 1 ไฟล์ PDF ≥ <strong>9 หน้า</strong> ชื่อไฟล์: <code className="bg-muted px-1 rounded">C + เลขท้าย 3 หลัก.pdf</code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =================== เอกสารดาวน์โหลดจาก กยศ. =================== */}
        <div className="mt-10 sm:mt-14 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-600">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-primary">เอกสารที่เกี่ยวข้องจาก กยศ.</h2>
            <p className="text-xs text-muted-foreground mt-1">ดาวน์โหลดจากเว็บไซต์ทางการของ กยศ.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="https://www.studentloan.or.th/sites/default/files/files/highlight/%E0%B8%81%E0%B8%A2%E0%B8%A8.102.pdf" target="_blank" rel="noopener noreferrer">
              <Card className="border-primary/10 shadow-sm p-4 hover-lift cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">หนังสือรับรองรายได้ผู้กู้ยืม กยศ.102</h3>
                    <p className="text-xs text-muted-foreground">PDF — ดาวน์โหลดจาก studentloan.or.th</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                </div>
              </Card>
            </a>
            <a href="https://www.studentloan.or.th/sites/default/files/files/highlight/%E0%B8%AB%E0%B8%99%E0%B8%B1%E0%B8%87%E0%B8%AA%E0%B8%B7%E0%B8%AD%E0%B9%83%E0%B8%AB%E0%B9%89%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%A2%E0%B8%B4%E0%B8%99%E0%B8%A2%E0%B8%AD%E0%B8%A1%E0%B9%80%E0%B8%9B%E0%B8%B4%E0%B8%94%E0%B9%80%E0%B8%9C%E0%B8%A2%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%20%E0%B8%9D%E0%B8%81%E0%B8%A2_0.pdf" target="_blank" rel="noopener noreferrer">
              <Card className="border-primary/10 shadow-sm p-4 hover-lift cursor-pointer h-full">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">หนังสือให้ความยินยอมเปิดเผยข้อมูล</h3>
                    <p className="text-xs text-muted-foreground">PDF — ดาวน์โหลดจาก studentloan.or.th</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                </div>
              </Card>
            </a>
          </div>
        </div>

        {/* =================== ข้อมูลเพิ่มเติมจากแอดมิน =================== */}
        {extraSections.length > 0 && (
          <div className="mt-10 sm:mt-14 max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-primary text-center">ข้อมูลเพิ่มเติมจากเจ้าหน้าที่</h2>
            {extraSections.map((section, i) => (
              <Card key={i} className="border-primary/10 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm sm:text-base">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{section.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* =================== ลิงก์ด่วน =================== */}
        <div className="mt-10 sm:mt-14 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/loan-info">
              <Card className="border-primary/10 shadow-sm p-4 text-center hover-lift cursor-pointer h-full">
                <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                <h3 className="font-bold text-xs sm:text-sm mb-1">หน้าข้อมูล กยศ.</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">ข้อมูลเพิ่มเติม</p>
              </Card>
            </Link>
            <Link href="/faq">
              <Card className="border-primary/10 shadow-sm p-4 text-center hover-lift cursor-pointer h-full">
                <HelpCircle className="w-6 h-6 text-primary mx-auto mb-2" />
                <h3 className="font-bold text-xs sm:text-sm mb-1">คำถามที่พบบ่อย</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">FAQ เกี่ยวกับการกู้ยืม</p>
              </Card>
            </Link>
            <a href="https://www.studentloan.or.th" target="_blank" rel="noopener noreferrer">
              <Card className="border-primary/10 shadow-sm p-4 text-center hover-lift cursor-pointer h-full">
                <GraduationCap className="w-6 h-6 text-primary mx-auto mb-2" />
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
        <footer className="mt-14 sm:mt-16 border-t border-border/50 pt-6 pb-4 max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="relative w-7 h-7">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Student_Loan_logo.svg"
                alt="กยศ."
                fill
                className="object-contain opacity-50"
                unoptimized
              />
            </div>
            <div className="h-5 w-px bg-border" />
            <div className="relative w-7 h-7">
              <Image
                src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png"
                alt="รส.ล."
                fill
                className="object-contain opacity-50"
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
