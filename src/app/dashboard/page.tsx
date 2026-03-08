import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, FileSignature, AlertCircle, CheckCircle2, Clock, ClipboardList, Download, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default async function DashboardPage() {
    const session = await getSession();
    if (!session) redirect('/login');

    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: {
            documents: true,
            loanRequests: true
        }
    });

    if (!user) redirect('/login');

    const loanRequest = user.loanRequests[0]; // สมมติว่ามีแค่ 1 อันล่าสุด
    const hasLoanRequest = !!loanRequest;
    const isNewBorrower = user.borrowerType === 'NEW';
    const contractDoc = user.documents.find((d: any) => d.type === 'CONTRACT');
    const confirmDoc = user.documents.find((d: any) => d.type === 'CONFIRMATION');

    // คำนวณ step ปัจจุบัน (1-6)
    let currentStep = 1;
    if (isNewBorrower && !hasLoanRequest) {
        currentStep = 1; // รอแบบคำขอกู้ยืม
    } else if (isNewBorrower && hasLoanRequest && !contractDoc) {
        currentStep = 3; // รอส่งสัญญา
    } else if (!confirmDoc) {
        currentStep = 3; // รอส่งแบบยืนยัน
    } else {
        // ส่งเอกสารแล้ว รอตรวจ
        const allDocs = isNewBorrower ? [contractDoc, confirmDoc] : [confirmDoc];
        const hasRejected = allDocs.some(d => d?.status === 'REJECTED');
        const hasPending = allDocs.some(d => d?.status === 'PENDING');
        const hasRejected = allDocs.some(d => d?.status === 'REJECTED');
        const hasPending = allDocs.some(d => d?.status === 'PENDING');
        const allCentral = allDocs.every(d => d?.sentToCentral);
        const allReceived = allDocs.every(d => d?.originalReceived || d?.sentToCentral);

        if (hasRejected) currentStep = 6;
        else if (allCentral || allReceived) currentStep = 5;
        else if (hasPending) currentStep = 4;
        else currentStep = 4;
    }

    // Step 2 is App Connect Upload
    const hasAppProof = !!user.appConnectProof;
    if ((isNewBorrower && loanRequest?.status === 'APPROVED' && !hasAppProof) || (!isNewBorrower && !hasAppProof)) {
        currentStep = 2; // รอโหลแอป
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">ยินดีต้อนรับ, {user.prefix}{user.firstName} {user.lastName}</h1>
                <p className="text-muted-foreground mt-2 mb-6">
                    นี่คือหน้าจัดการระบบกู้ยืมเงิน กยศ. ของคุณ ({isNewBorrower ? "ผู้กู้รายใหม่" : "ผู้กู้รายเก่า"})
                </p>
                <DashboardStepper currentStep={currentStep} />
            </div>

            {/* Loan Request Status for New Borrowers */}
            {isNewBorrower && (
                <div className="mb-6">
                    {!hasLoanRequest ? (
                        <div className="bg-warning/10 border-l-4 border-warning p-6 rounded-lg shadow-sm">
                            <div className="flex items-start gap-4">
                                <AlertCircle className="w-6 h-6 text-warning shrink-0 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-warning-foreground">คุณยังไม่ได้กรอกแบบฟอร์มคำขอกู้ยืมเงินเบื้องต้น</h3>
                                    <p className="text-muted-foreground mt-1 mb-4">
                                        ในฐานะผู้กู้รายใหม่ คุณจำเป็นต้องกรอกประวัติการศึกษาและแนบไฟล์ ปพ.1 เพื่อขออนุมัติเบื้องต้นก่อนส่งแบบยืนยันและสัญญา
                                    </p>
                                    <Link href="/dashboard/loan-request">
                                        <Button className="shadow-lg hover-lift hover:scale-[1.02] transition-transform">
                                            <FileText className="w-4 h-4 mr-2" />
                                            กรอกคำขอกู้ยืมเงิน
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Card className={`border-l-4 ${loanRequest.status === 'APPROVED' ? 'border-l-success bg-success/5' :
                            loanRequest.status === 'REJECTED' ? 'border-l-destructive bg-destructive/5' :
                                'border-l-warning bg-warning/5'
                            }`}>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ClipboardList className="w-5 h-5" />
                                    สถานะการขอกู้ยืมเงินเบื้องต้น (ผู้กู้รายใหม่)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">สถานะ:</span>
                                            {loanRequest.status === 'PENDING' && <span className="text-warning font-semibold">รอการอนุมัติ</span>}
                                            {loanRequest.status === 'APPROVED' && <span className="text-success font-semibold px-2 py-0.5 bg-success/10 rounded-full text-sm">อนุมัติแล้ว</span>}
                                            {loanRequest.status === 'REJECTED' && <span className="text-destructive font-semibold px-2 py-0.5 bg-destructive/10 rounded-full text-sm">ไม่อนุมัติ</span>}
                                        </div>
                                        {loanRequest.status === 'PENDING' && (
                                            <p className="text-sm text-muted-foreground">เจ้าหน้าที่กำลังพิจารณาข้อมูลและผลการเรียนของคุณ</p>
                                        )}
                                        {loanRequest.status === 'APPROVED' && (
                                            <p className="text-sm text-muted-foreground">คุณสามารถดำเนินการส่งเอกสารยืนยันและสัญญาในขั้นตอนต่อไปได้</p>
                                        )}
                                        {loanRequest.status === 'REJECTED' && loanRequest.adminRemark && (
                                            <p className="text-sm text-destructive mt-1 bg-destructive/10 p-2 rounded max-w-lg">
                                                <strong>หมายเหตุ:</strong> {loanRequest.adminRemark}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        ส่งเมื่อ: {format(new Date(loanRequest.createdAt), 'd MMMM yyyy HH:mm', { locale: th })} น.
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* App Connect Download Step (For Approved New Borrowers OR Old Borrowers) */}
            {((isNewBorrower && loanRequest?.status === 'APPROVED') || !isNewBorrower) && (
                <div className="mb-6">
                    {!hasAppProof ? (
                        <div className="bg-blue-50/50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 p-6 rounded-xl shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Download className="w-32 h-32 text-blue-500" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold dark:bg-blue-900 dark:text-blue-300">2</span>
                                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300">ดาวน์โหลดแอปพลิเคชัน &quot;กยศ. Connect&quot;</h3>
                                    </div>
                                    <p className="text-blue-800/80 dark:text-blue-200/70 mb-4 mt-2">
                                        ข้อบังคับก่อนพิมพ์เอกสาร: นักเรียนต้องดาวน์โหลดและลงทะเบียนแอปพลิเคชันของ กยศ. ในสมาร์ทโฟนให้เรียบร้อย และแคปภาพหน้าจอ (Screenshot) ที่แสดงชื่อโปรไฟล์ของนักเรียนในแอปมาอัปโหลดเป็นหลักฐาน เพื่อปลดล็อกเมนูถัดไป
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <a href="https://apps.apple.com/th/app/%E0%B8%81%E0%B8%A2%E0%B8%A8-connect/id1443661642" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="bg-white/80 border-blue-200 hover:bg-white text-blue-700 shadow-sm">
                                                🍎 App Store (iOS)
                                            </Button>
                                        </a>
                                        <a href="https://play.google.com/store/apps/details?id=th.go.studentloan.isl&hl=th" target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" className="bg-white/80 border-blue-200 hover:bg-white text-blue-700 shadow-sm">
                                                🤖 Google Play (Android)
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                                <div className="shrink-0 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-blue-200/50 md:pl-6 pl-0">
                                    <Link href="/dashboard/app-connect">
                                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all h-12 px-6">
                                            <FileText className="w-5 h-5 mr-2" />
                                            อัปโหลดรูปหลักฐานการโหลดแอป
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-lg text-blue-800 dark:text-blue-300">
                                    <CheckCircle2 className="w-5 h-5" />
                                    หลักฐานการติดตั้งแอป กยศ. Connect
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">สถานะ:</span>
                                            <span className="text-blue-700 dark:text-blue-400 font-semibold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded-full text-sm">ตรวจสอบแล้ว</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">คุณได้อัปโหลดหลักฐานเรียบร้อยแล้ว สามารถดำเนินการต่อได้</p>
                                    </div>
                                    <Link href="/dashboard/app-connect">
                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                            ดูรูปหลักฐาน
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Cards */}
                <Card className={`glass hover-lift ${!hasAppProof ? 'opacity-50 select-none grayscale-[50%]' : 'border-primary/10'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheckIcon className={`w-5 h-5 ${hasAppProof ? 'text-primary' : 'text-muted-foreground'}`} />
                            สถานะเอกสารแบบยืนยัน
                        </CardTitle>
                        <CardDescription>การส่งแบบยืนยันเบิกเงินกู้ยืมภาคเรียนปัจจุบัน</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DocumentStatusCard
                            documents={user.documents}
                            type="CONFIRMATION"
                            disabled={(isNewBorrower && !hasLoanRequest) || !hasAppProof}
                        />
                    </CardContent>
                </Card>

                <Card className={`glass hover-lift ${!hasAppProof ? 'opacity-50 select-none grayscale-[50%]' : 'border-secondary-foreground/10'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSignature className={`w-5 h-5 ${hasAppProof ? 'text-secondary-foreground' : 'text-muted-foreground'}`} />
                            สถานะเอกสารสัญญากู้ยืม
                        </CardTitle>
                        <CardDescription>เฉพาะผู้กู้รายใหม่ หรือเปลี่ยนระดับชั้น</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DocumentStatusCard
                            documents={user.documents}
                            type="CONTRACT"
                            disabled={!isNewBorrower || (isNewBorrower && !hasLoanRequest) || !hasAppProof}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function FileCheckIcon(props: React.ComponentProps<'svg'>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="m9 15 2 2 4-4" />
        </svg>
    )
}

function DocumentStatusCard({ documents, type, disabled }: { documents: any[], type: string, disabled: boolean }) {
    const activeDoc = documents.find(d => d.type === type);

    if (disabled) {
        return (
            <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                <AlertCircle className="w-8 h-8 opacity-50 mx-auto mb-2" />
                <p>ยังไม่สามารถดำเนินการได้ในขณะนี้</p>
            </div>
        );
    }

    if (!activeDoc) {
        return (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <p className="font-medium text-foreground">ยังไม่มีการส่งเอกสาร</p>
                    <p className="text-sm text-muted-foreground mt-1">กรุณาส่งเอกสารให้เรียบร้อยเพื่อดำเนินการต่อ</p>
                </div>
                <Link href={`/dashboard/documents/new?type=${type}`}>
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                        ส่งเอกสาร{type === 'CONFIRMATION' ? 'แบบยืนยัน' : 'สัญญา'}
                    </Button>
                </Link>
            </div>
        );
    }

    const StatusBadge = () => {
        switch (activeDoc.status) {
            case 'PENDING':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><Clock className="w-3.5 h-3.5" /> รอการตรวจสอบ</span>;
            case 'APPROVED':
                if (activeDoc.sentToCentral) {
                    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><CheckCircle2 className="w-3.5 h-3.5" /> เอกสารถูกนำส่งส่วนกลางแล้ว</span>;
                }
                if (activeDoc.originalReceived) {
                    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"><CheckCircle2 className="w-3.5 h-3.5" /> ได้รับเอกสารตัวจริงแล้ว</span>;
                }
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle2 className="w-3.5 h-3.5" /> ผ่านการตรวจสอบ (รอตัวจริง)</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><AlertCircle className="w-3.5 h-3.5" /> เอกสารต้องแก้ไข</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">ปีการศึกษา</p>
                    <p className="font-semibold">{activeDoc.academicYear.replace('_', '/')}</p>
                </div>
                <StatusBadge />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ส่งครั้งล่าสุด:</span>
                    <span>{format(new Date(activeDoc.updatedAt), 'dd MMM yyyy HH:mm', { locale: th })}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">รหัสท้ายไฟล์:</span>
                    <span className="font-mono bg-muted px-1.5 rounded">{activeDoc.lastThreeDigits}</span>
                </div>
            </div>

            {activeDoc.status === 'REJECTED' && (
                <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 mt-4 text-sm">
                    <p className="font-semibold text-destructive mb-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> หมายเหตุจากเจ้าหน้าที่:
                    </p>
                    <p className="text-foreground/80">{activeDoc.remark || "โปรดตรวจสอบอีเมล หรือแก้ไขเอกสารให้ถูกต้อง"}</p>

                    {activeDoc.deadline && (
                        <p className="text-xs text-destructive mt-2 font-medium">
                            ครบกำหนดแก้ไข: {format(new Date(activeDoc.deadline), 'dd MMM yyyy', { locale: th })}
                        </p>
                    )}

                    <div className="mt-3">
                        <Link href={`/dashboard/documents/new?type=${activeDoc.type}`}>
                            <Button size="sm" variant="destructive" className="w-full">
                                แก้ไขเอกสารและส่งใหม่
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

function DashboardStepper({ currentStep }: { currentStep: number }) {
    const steps = [
        { id: 1, icon: ClipboardList, title: "ยื่นคำขอกู้ยืม" },
        { id: 2, icon: Download, title: "แอป กยศ.Connect" },
        { id: 3, icon: FileSignature, title: "ลงนามสัญญายืนยัน" },
        { id: 4, icon: FileCheckIcon, title: "อัปโหลด PDF เข้าระบบ" },
        { id: 5, icon: CheckCircle2, title: "นำส่งเอกสารตัวจริง" },
        { id: 6, icon: AlertCircle, title: "แก้ไขเอกสารตีกลับ" },
    ];

    return (
        <div className="bg-white/50 backdrop-blur-md rounded-xl border p-4 shadow-sm mb-6 mt-4 overflow-hidden dark:bg-black/20">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> สถานะการดำเนินการของคุณ</h3>
            <div className="relative">
                {/* Progress bar line (Background) */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-border rounded-full" />
                {/* Progress bar line (Active) */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${(Math.min(currentStep, 5) / 5) * 100}%` }}
                />

                <div className="relative flex justify-between">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isPast = step.id < currentStep && step.id !== 6;
                        const isRejectStep = step.id === 6;

                        // ถ้าระบบไม่ได้อยู่สถานะแก้ไข(6) ให้เทา step 6 ไว้
                        if (isRejectStep && currentStep !== 6) return null;

                        return (
                            <div key={step.id} className={`flex flex-col items-center gap-2 ${isRejectStep ? 'absolute right-0 top-0 bottom-0 bg-white/90 dark:bg-background px-2' : 'relative z-10'} w-16 sm:w-20`}>
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive && !isRejectStep ? 'bg-primary border-primary text-white shadow-md ring-4 ring-primary/20' :
                                    isPast ? 'bg-primary border-primary text-white' :
                                        isActive && isRejectStep ? 'bg-destructive border-destructive text-white shadow-md ring-4 ring-destructive/20' :
                                            'bg-background border-border text-muted-foreground'
                                    }`}>
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <p className={`text-[9px] sm:text-xs text-center font-medium leading-tight ${isActive && !isRejectStep ? 'text-primary font-bold' :
                                    isActive && isRejectStep ? 'text-destructive font-bold' :
                                        isPast ? 'text-foreground' :
                                            'text-muted-foreground'
                                    }`}>
                                    {step.title}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}


