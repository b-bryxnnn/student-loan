import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            select: {
                id: true,
                prefix: true,
                firstName: true,
                lastName: true,
                studentId: true,
                gradeLevel: true,
                idCard: true,
                phone: true,
                email: true,
                borrowerType: true,
                role: true,
                emailVerified: true,
                createdAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("PROFILE_GET_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
