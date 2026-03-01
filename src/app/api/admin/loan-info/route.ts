import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: ดึงข้อมูลกู้ยืมทั้งหมด (admin)
export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sections = await db.loanInfoSection.findMany({
            orderBy: { sortOrder: 'asc' },
        });

        return NextResponse.json({ sections }, { status: 200 });
    } catch (error) {
        console.error("GET_LOAN_INFO_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: สร้างหัวข้อข้อมูลใหม่
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, content } = await req.json();

        if (!title?.trim() || !content?.trim()) {
            return NextResponse.json({ error: "กรุณากรอกหัวข้อและเนื้อหา" }, { status: 400 });
        }

        const maxOrder = await db.loanInfoSection.findFirst({ orderBy: { sortOrder: 'desc' } });
        const sortOrder = (maxOrder?.sortOrder ?? 0) + 1;

        const section = await db.loanInfoSection.create({
            data: { title: title.trim(), content: content.trim(), sortOrder }
        });

        return NextResponse.json({ success: true, section }, { status: 201 });
    } catch (error) {
        console.error("CREATE_LOAN_INFO_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: แก้ไขหัวข้อ
export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, title, content, isActive, sortOrder } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ต้องระบุ ID" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title.trim();
        if (content !== undefined) updateData.content = content.trim();
        if (isActive !== undefined) updateData.isActive = isActive;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

        const section = await db.loanInfoSection.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, section }, { status: 200 });
    } catch (error) {
        console.error("UPDATE_LOAN_INFO_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: ลบหัวข้อ
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

        await db.loanInfoSection.delete({ where: { id } });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("DELETE_LOAN_INFO_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
