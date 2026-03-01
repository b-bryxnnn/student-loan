import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = getClientIP(req);
        const rl = rateLimit(`change-password:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
        if (!rl.success) {
            return NextResponse.json({ error: "คุณพยายามเปลี่ยนรหัสผ่านบ่อยเกินไป กรุณารอ 1 นาที" }, { status: 429 });
        }

        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return NextResponse.json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
        }

        if (newPassword.length > 128) {
            return NextResponse.json({ error: "รหัสผ่านยาวเกินไป (สูงสุด 128 ตัวอักษร)" }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId }
        });

        if (!user) {
            return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" }, { status: 200 });

    } catch (error) {
        console.error("CHANGE_PASSWORD_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
