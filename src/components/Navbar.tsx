"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { BookOpen, HelpCircle, User, Menu, X } from 'lucide-react';

export default function Navbar({ userRole }: { userRole?: string }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/10 glass">
            <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
                {/* Logo + Title */}
                <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
                        <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Student_Loan_logo.svg"
                            alt="กยศ."
                            fill
                            className="object-contain"
                            unoptimized
                        />
                    </div>
                    <Link href="/" className="font-bold text-sm sm:text-lg hidden sm:block">
                        กยศ. ร.ส.ล. (ลักษณะ 1)
                    </Link>
                    <Link href="/" className="font-bold text-sm sm:hidden">
                        กยศ. ร.ส.ล.
                    </Link>
                </div>

                {/* Desktop Nav */}
                <div className="hidden sm:flex items-center gap-1 sm:gap-2">
                    <Link href="/loan-info">
                        <Button variant="ghost" size="sm" className="text-xs">
                            <BookOpen className="w-3.5 h-3.5 mr-1" /> ข้อมูล กยศ.
                        </Button>
                    </Link>
                    <Link href="/faq">
                        <Button variant="ghost" size="sm" className="text-xs">
                            <HelpCircle className="w-3.5 h-3.5 mr-1" /> คำถามที่พบบ่อย
                        </Button>
                    </Link>

                    {userRole ? (
                        <>
                            {userRole === 'STUDENT' && (
                                <Link href="/dashboard/profile">
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        <User className="w-3.5 h-3.5 mr-1" /> โปรไฟล์
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

                {/* Mobile Hamburger */}
                <button
                    className="sm:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div className="sm:hidden border-t border-border/50 glass animate-in slide-in-from-top-2 duration-200">
                    <div className="container mx-auto px-4 py-3 space-y-1">
                        <Link href="/loan-info" onClick={() => setMobileOpen(false)}>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-sm">
                                <BookOpen className="w-4 h-4 text-primary" />
                                ข้อมูล กยศ.
                            </div>
                        </Link>
                        <Link href="/faq" onClick={() => setMobileOpen(false)}>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-sm">
                                <HelpCircle className="w-4 h-4 text-primary" />
                                คำถามที่พบบ่อย
                            </div>
                        </Link>

                        <div className="h-px bg-border/50 my-2" />

                        {userRole ? (
                            <>
                                {userRole === 'STUDENT' && (
                                    <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)}>
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-sm">
                                            <User className="w-4 h-4 text-primary" />
                                            โปรไฟล์
                                        </div>
                                    </Link>
                                )}
                                <Link href="/api/auth/logout" onClick={() => setMobileOpen(false)}>
                                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors text-sm text-destructive">
                                        ออกจากระบบ
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <div className="flex gap-2 px-3 pt-1 pb-2">
                                <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                                    <Button variant="outline" size="sm" className="w-full text-sm">เข้าสู่ระบบ</Button>
                                </Link>
                                <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                                    <Button size="sm" className="w-full text-sm shadow-lg shadow-primary/25">ลงทะเบียน</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
