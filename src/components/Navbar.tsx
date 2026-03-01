import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, BookOpen, HelpCircle, User } from 'lucide-react';

export default function Navbar({ userRole }: { userRole?: string }) {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 glass">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <ShieldAlert className="w-6 h-6 text-primary" />
                    </div>
                    <Link href="/" className="font-bold text-lg hidden sm:block">
                        กยศ. ร.ส.ล. (ลักษณะ 1)
                    </Link>
                    <Link href="/" className="font-bold text-lg sm:hidden">
                        กยศ. ร.ส.ล.
                    </Link>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Public links */}
                    <Link href="/loan-info">
                        <Button variant="ghost" size="sm" className="hidden sm:flex text-xs">
                            <BookOpen className="w-3.5 h-3.5 mr-1" /> ข้อมูล กยศ.
                        </Button>
                    </Link>
                    <Link href="/faq">
                        <Button variant="ghost" size="sm" className="hidden sm:flex text-xs">
                            <HelpCircle className="w-3.5 h-3.5 mr-1" /> คำถามที่พบบ่อย
                        </Button>
                    </Link>

                    {userRole ? (
                        <>
                            {userRole === 'STUDENT' && (
                                <Link href="/dashboard/profile">
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        <User className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">โปรไฟล์</span>
                                    </Button>
                                </Link>
                            )}
                            <Link href="/api/auth/logout">
                                <Button variant="ghost" size="sm" className="hover-lift text-xs">ออกจากระบบ</Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="hover-lift text-xs sm:text-sm">เข้าสู่ระบบ</Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm" className="hover-lift shadow-lg shadow-primary/25 text-xs sm:text-sm">ลงทะเบียน</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
