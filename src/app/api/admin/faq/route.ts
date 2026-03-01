import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: ดึง FAQ ทั้งหมด (สำหรับ admin ดูทั้ง active/inactive)
export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const faqs = await db.faqItem.findMany({
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json({ faqs }, { status: 200 });
    } catch (error) {
        console.error("GET_FAQ_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: สร้าง FAQ ใหม่
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { question, answer } = await req.json();

        if (!question?.trim() || !answer?.trim()) {
            return NextResponse.json({ error: "กรุณากรอกคำถามและคำตอบ" }, { status: 400 });
        }

        // หาลำดับสูงสุด
        const maxOrder = await db.faqItem.findFirst({ orderBy: { sortOrder: 'desc' } });
        const sortOrder = (maxOrder?.sortOrder ?? 0) + 1;

        const faq = await db.faqItem.create({
            data: { question: question.trim(), answer: answer.trim(), sortOrder }
        });

        return NextResponse.json({ success: true, faq }, { status: 201 });
    } catch (error) {
        console.error("CREATE_FAQ_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: แก้ไข FAQ
export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, question, answer, isActive, sortOrder } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (question !== undefined) updateData.question = question.trim();
        if (answer !== undefined) updateData.answer = answer.trim();
        if (isActive !== undefined) updateData.isActive = isActive;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

        const faq = await db.faqItem.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, faq }, { status: 200 });
    } catch (error) {
        console.error("UPDATE_FAQ_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: ลบ FAQ
export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });
        }

        await db.faqItem.delete({ where: { id } });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("DELETE_FAQ_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
