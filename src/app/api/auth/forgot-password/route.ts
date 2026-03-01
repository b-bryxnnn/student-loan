import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPasswordResetOTP } from '@/lib/email';
import crypto from 'crypto';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        // Rate Limit: 3 password reset requests per hour per IP
        const ip = getClientIP(req);
        const rl = rateLimit(`forgot-password:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 });
        if (!rl.success) {
            return NextResponse.json({ error: "คุณขอรีเซ็ตรหัสผ่านบ่อยเกินไป กรุณารอ 1 ชั่วโมง" }, { status: 429 });
        }

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "โปรดระบุอีเมล" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Return 200 even if wrong to prevent email enumeration attacks
            return NextResponse.json({ success: true, message: "หากอีเมลนี้อยู่ในระบบ OTP จะถูกส่งไป" }, { status: 200 });
        }

        // Additional rate limit per email
        const emailRl = rateLimit(`forgot-password-email:${email}`, { maxRequests: 2, windowMs: 15 * 60 * 1000 });
        if (!emailRl.success) {
            return NextResponse.json({ success: true, message: "หากอีเมลนี้อยู่ในระบบ OTP จะถูกส่งไป" }, { status: 200 });
        }

        // Generate 6 digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await db.user.update({
            where: { id: user.id },
            data: {
                otp,
                otpExpiry
            }
        });

        const emailSent = await sendPasswordResetOTP(email, otp);

        if (!emailSent) {
            return NextResponse.json({ error: "ไม่สามารถส่งอีเมลได้ในขณะนี้ โปรดตรวจสอบการตั้งค่าเซิร์ฟเวอร์" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "OTP ถูกส่งไปยังอีเมลของคุณแล้ว" }, { status: 200 });

    } catch (error) {
        console.error("FORGOT_PASSWORD_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
