import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        // Rate Limit: 5 attempts per minute per IP
        const ip = getClientIP(req);
        const rl = rateLimit(`reset-password:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
        if (!rl.success) {
            return NextResponse.json({ error: "คุณพยายามเปลี่ยนรหัสผ่านบ่อยเกินไป กรุณารอ 1 นาที" }, { status: 429 });
        }

        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
        }

        if (newPassword.length > 128) {
            return NextResponse.json({ error: "รหัสผ่านยาวเกินไป (สูงสุด 128 ตัวอักษร)" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json({ error: "ไม่พบผู้ใช้นี้ในระบบ" }, { status: 404 });
        }

        // Check expiry first to avoid timing attack
        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            await db.user.update({
                where: { id: user.id },
                data: { otp: null, otpExpiry: null }
            });
            return NextResponse.json({ error: "รหัส OTP หมดอายุแล้ว โปรดขอใหม่" }, { status: 400 });
        }

        if (user.otp !== otp) {
            // Per-user OTP attempt limit: ล้าง OTP หลัง 5 ครั้ง
            const userRl = rateLimit(`reset-otp-attempt:${user.id}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
            if (!userRl.success) {
                await db.user.update({
                    where: { id: user.id },
                    data: { otp: null, otpExpiry: null }
                });
                return NextResponse.json({ error: "กรอก OTP ผิดเกิน 5 ครั้ง OTP ถูกยกเลิก กรุณาขอใหม่" }, { status: 400 });
            }
            return NextResponse.json({ error: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpiry: null
            }
        });

        return NextResponse.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" }, { status: 200 });

    } catch (error) {
        console.error("RESET_PASSWORD_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
