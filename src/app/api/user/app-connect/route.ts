import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || !session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { appConnectProof } = body;

        if (!appConnectProof) {
            return NextResponse.json({ error: "กรุณาแนบรูปประจำตัวแอป" }, { status: 400 });
        }

        // Update the user's proof in DB
        await db.user.update({
            where: { id: session.userId },
            data: { appConnectProof },
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("APP CONNECT UPLOAD ERROR:", error);
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
    }
}
