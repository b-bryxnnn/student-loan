import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 400 });
        }

        // Find user
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: "ไม่พบผู้ใช้ในระบบ" }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ error: "บัญชีนี้ได้รับการยืนยันแล้ว" }, { status: 400 });
        }

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Update OTP in database
        await db.user.update({
            where: { id: userId },
            data: { otp, otpExpiry },
        });

        // Send OTP email
        const emailSent = await sendOTPEmail(user.email, otp);
        if (!emailSent) {
            return NextResponse.json({ error: "ไม่สามารถส่งอีเมล OTP ได้ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("RESEND OTP ERROR:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
    }
}
