import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// GET: ดึงรายชื่อนักเรียนทั้งหมด + ค้นหา
export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'ALL'; // ALL, ACTIVE, ARCHIVED
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // สร้าง where clause
        const where: any = { role: 'STUDENT' };

        if (status === 'ACTIVE') where.accountStatus = 'ACTIVE';
        else if (status === 'ARCHIVED') where.accountStatus = 'ARCHIVED';

        if (search.trim()) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { studentId: { contains: search, mode: 'insensitive' } },
                { idCard: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [students, total] = await Promise.all([
            db.user.findMany({
                where,
                select: {
                    id: true,
                    prefix: true,
                    firstName: true,
                    lastName: true,
                    studentId: true,
                    gradeLevel: true,
                    idCard: true,
                    email: true,
                    borrowerType: true,
                    accountStatus: true,
                    emailVerified: true,
                    createdAt: true,
                    _count: {
                        select: {
                            documents: true,
                            loanRequests: true,
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db.user.count({ where }),
        ]);

        return NextResponse.json({
            students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        }, { status: 200 });
    } catch (error) {
        console.error("GET_STUDENTS_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: ลบนักเรียน (hard delete)
export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ต้องระบุ ID นักเรียน" }, { status: 400 });
        }

        // ตรวจสอบว่าเป็น student จริง
        const user = await db.user.findUnique({ where: { id } });
        if (!user || user.role !== 'STUDENT') {
            return NextResponse.json({ error: "ไม่พบนักเรียนที่ต้องการลบ" }, { status: 404 });
        }

        // ลบ user (cascade จะลบ documents, loanRequests ด้วย)
        await db.user.delete({ where: { id } });

        // บันทึก Audit Log
        await db.auditLog.create({
            data: {
                adminId: session.userId,
                action: "DELETE_STUDENT",
                entityType: "USER",
                entityId: id,
                details: `ลบนักเรียน: ${user.prefix}${user.firstName} ${user.lastName} (${user.idCard})`,
            }
        });

        revalidatePath('/');
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("DELETE_STUDENT_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: เปลี่ยนสถานะ (archive/restore)
export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, action } = await req.json();

        if (!id || !action) {
            return NextResponse.json({ error: "ต้องระบุ ID และ action" }, { status: 400 });
        }

        const user = await db.user.findUnique({ where: { id } });
        if (!user || user.role !== 'STUDENT') {
            return NextResponse.json({ error: "ไม่พบนักเรียน" }, { status: 404 });
        }

        if (action === 'ARCHIVE') {
            await db.user.update({ where: { id }, data: { accountStatus: 'ARCHIVED' } });
            await db.auditLog.create({
                data: {
                    adminId: session.userId,
                    action: "ARCHIVE_STUDENT",
                    entityType: "USER",
                    entityId: id,
                    details: `จำหน่ายออก: ${user.prefix}${user.firstName} ${user.lastName}`,
                }
            });
        } else if (action === 'RESTORE') {
            await db.user.update({ where: { id }, data: { accountStatus: 'ACTIVE' } });
            await db.auditLog.create({
                data: {
                    adminId: session.userId,
                    action: "RESTORE_STUDENT",
                    entityType: "USER",
                    entityId: id,
                    details: `กู้คืนสถานะ: ${user.prefix}${user.firstName} ${user.lastName}`,
                }
            });
        } else {
            return NextResponse.json({ error: "action ไม่ถูกต้อง (ARCHIVE หรือ RESTORE)" }, { status: 400 });
        }

        revalidatePath('/');
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("UPDATE_STUDENT_STATUS_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
