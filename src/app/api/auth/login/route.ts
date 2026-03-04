import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, setAuthCookie } from '@/lib/auth';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        // Rate Limit: 5 login attempts per minute per IP
        const ip = getClientIP(req);
        const rl = rateLimit(`login:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
        if (!rl.success) {
            return NextResponse.json({ error: "คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 1 นาที" }, { status: 429 });
        }

        const { idCard, password } = await req.json();

        if (!idCard || !password) {
            return NextResponse.json({ error: "กรุณากรอกรหัสประจำตัวประชาชนและรหัสผ่าน" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { idCard }
        });

        if (!user) {
            return NextResponse.json({ error: "เลขประจำตัวประชาชนหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "เลขประจำตัวประชาชนหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        if (!user.emailVerified) {
            return NextResponse.json({ error: "บัญชีของคุณยังไม่ได้ยืนยันอีเมล กรุณาติดต่อผู้ดูแลระบบหรือสมัครใหม่" }, { status: 403 });
        }

        if (user.accountStatus === 'ARCHIVED') {
            return NextResponse.json({ error: "บัญชีนี้ถูกจำหน่ายออกหรือสิ้นสุดสถานะการใช้งานแล้ว" }, { status: 403 });
        }

        // Set Token
        const token = signToken({ userId: user.id, role: user.role });
        await setAuthCookie(token);

        return NextResponse.json({ success: true, role: user.role }, { status: 200 });

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: `เกิดข้อผิดพลาดภายในระบบ: ${message}` }, { status: 500 });
    }
}
