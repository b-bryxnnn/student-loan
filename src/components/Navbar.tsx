"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { BookOpen, HelpCircle, User, Menu, X, LogOut } from 'lucide-react';

export default function Navbar({ userRole }: { userRole?: string }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 w-full bg-primary text-primary-foreground shadow-lg">
            <div className="container mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
                {/* Logo + Title */}
                <div className="flex items-center gap-2.5">
                    <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 bg-white/15 rounded-full p-1">
                        <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/c/c8/Student_Loan_logo.svg"
                            alt="กยศ."
                            fill
                            className="object-contain p-0.5"
                            unoptimized
                        />
                    </div>
                    <Link href="/" className="font-bold text-sm sm:text-base hidden sm:block tracking-wide">
                        กยศ. รส.ล. — ลักษณะที่ 1
                    </Link>
                    <Link href="/" className="font-bold text-sm sm:hidden tracking-wide">
                        กยศ. รส.ล.
                    </Link>
                </div>

                {/* Desktop Nav */}
                <div className="hidden sm:flex items-center gap-1">
                    <Link href="/loan-info">
                        <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 text-xs">
                            <BookOpen className="w-3.5 h-3.5 mr-1.5" /> ข้อมูล กยศ.
                        </Button>
                    </Link>
                    <Link href="/faq">
                        <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 text-xs">
                            <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> คำถามที่พบบ่อย
                        </Button>
                    </Link>

                    <div className="h-5 w-px bg-white/20 mx-1" />

                    {userRole ? (
                        <>
                            {userRole === 'STUDENT' && (
                                <Link href="/dashboard/profile">
                                    <Button variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10 text-xs">
                                        <User className="w-3.5 h-3.5 mr-1.5" /> โปรไฟล์
                                    </Button>
                                </Link>
                            )}
                            <Link href="/api/auth/logout">
                                <Button variant="ghost" size="sm" className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 text-xs">
                                    <LogOut className="w-3.5 h-3.5 mr-1.5" /> ออกจากระบบ
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10 text-xs">
                                    เข้าสู่ระบบ
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold text-xs shadow-md">
                                    ลงทะเบียน
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger */}
                <button
                    className="sm:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div className="sm:hidden border-t border-white/10 bg-primary animate-in slide-in-from-top-2 duration-200">
                    <div className="container mx-auto px-4 py-3 space-y-1">
                        <Link href="/loan-info" onClick={() => setMobileOpen(false)}>
                            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm text-primary-foreground/90">
                                <BookOpen className="w-4 h-4" />
                                ข้อมูล กยศ.
                            </div>
                        </Link>
                        <Link href="/faq" onClick={() => setMobileOpen(false)}>
                            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm text-primary-foreground/90">
                                <HelpCircle className="w-4 h-4" />
                                คำถามที่พบบ่อย
                            </div>
                        </Link>

                        <div className="h-px bg-white/10 my-2" />

                        {userRole ? (
                            <>
                                {userRole === 'STUDENT' && (
                                    <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)}>
                                        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm text-primary-foreground/90">
                                            <User className="w-4 h-4" />
                                            โปรไฟล์
                                        </div>
                                    </Link>
                                )}
                                <Link href="/api/auth/logout" onClick={() => setMobileOpen(false)}>
                                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors text-sm text-red-300">
                                        <LogOut className="w-4 h-4" />
                                        ออกจากระบบ
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <div className="flex gap-2 px-3 pt-1 pb-2">
                                <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                                    <Button variant="outline" size="sm" className="w-full text-sm border-white/30 text-primary-foreground hover:bg-white/10">เข้าสู่ระบบ</Button>
                                </Link>
                                <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                                    <Button size="sm" className="w-full text-sm bg-white text-primary hover:bg-white/90 font-semibold">ลงทะเบียน</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
