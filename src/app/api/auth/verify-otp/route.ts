import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = getClientIP(req);
        const rl = rateLimit(`verify-otp:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
        if (!rl.success) {
            return NextResponse.json({ error: "คุณลองกรอก OTP บ่อยเกินไป กรุณารอ 1 นาที" }, { status: 429 });
        }

        const { userId, otp } = await req.json();

        if (!userId || !otp) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return NextResponse.json({ error: "ไม่พบผู้ใช้งานนี้" }, { status: 404 });
        }

        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            // ล้าง OTP ที่หมดอายุออก
            await db.user.update({
                where: { id: userId },
                data: { otp: null, otpExpiry: null }
            });
            return NextResponse.json({ error: "รหัส OTP หมดอายุแล้ว โปรดขอใหม่" }, { status: 400 });
        }

        if (user.otp !== otp) {
            // Rate limit per-user OTP attempts: ล้าง OTP หลังลอง 5 ครั้ง
            const userRl = rateLimit(`otp-attempt:${userId}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
            if (!userRl.success) {
                // ล้าง OTP เลยเพื่อป้องกัน brute force
                await db.user.update({
                    where: { id: userId },
                    data: { otp: null, otpExpiry: null }
                });
                return NextResponse.json({ error: "คุณกรอก OTP ผิดเกิน 5 ครั้ง OTP ถูกยกเลิก กรุณาขอใหม่" }, { status: 400 });
            }
            return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
        }

        // Mark as verified & clear OTP
        await db.user.update({
            where: { id: userId },
            data: {
                emailVerified: true,
                otp: null,
                otpExpiry: null
            }
        });

        // Set Token for login
        const token = signToken({ userId: user.id, role: user.role });
        await setAuthCookie(token);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
