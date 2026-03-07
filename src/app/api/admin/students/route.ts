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
                    phone: true,
                    email: true,
                    borrowerType: true,
                    accountStatus: true,
                    emailVerified: true,
                    createdAt: true,
                    idCardImage: true,
                    faceImage: true,
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

// PATCH: แก้ไขข้อมูลนักเรียน
export async function PATCH(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, prefix, firstName, lastName, email, phone, gradeLevel, borrowerType } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "ต้องระบุ ID นักเรียน" }, { status: 400 });
        }

        const user = await db.user.findUnique({ where: { id } });
        if (!user || user.role !== 'STUDENT') {
            return NextResponse.json({ error: "ไม่พบนักเรียน" }, { status: 404 });
        }

        // สร้าง update data เฉพาะ field ที่ส่งมา
        const updateData: Record<string, any> = {};
        const changes: string[] = [];

        if (prefix !== undefined && prefix !== user.prefix) {
            updateData.prefix = prefix;
            changes.push(`คำนำหน้า: ${user.prefix} → ${prefix}`);
        }
        if (firstName !== undefined && firstName !== user.firstName) {
            updateData.firstName = firstName.trim();
            changes.push(`ชื่อ: ${user.firstName} → ${firstName}`);
        }
        if (lastName !== undefined && lastName !== user.lastName) {
            updateData.lastName = lastName.trim();
            changes.push(`นามสกุล: ${user.lastName} → ${lastName}`);
        }
        if (email !== undefined && email !== user.email) {
            const existing = await db.user.findFirst({ where: { email, id: { not: id } } });
            if (existing) return NextResponse.json({ error: "อีเมลนี้มีผู้ใช้อื่นแล้ว" }, { status: 400 });
            updateData.email = email.trim().toLowerCase();
            changes.push(`อีเมล: ${user.email} → ${email}`);
        }
        if (phone !== undefined && phone !== user.phone) {
            updateData.phone = phone || null;
            changes.push(`เบอร์โทร: ${user.phone || '-'} → ${phone || '-'}`);
        }
        if (gradeLevel !== undefined && gradeLevel !== user.gradeLevel) {
            updateData.gradeLevel = gradeLevel;
            changes.push(`ระดับชั้น: ${user.gradeLevel || '-'} → ${gradeLevel}`);
        }
        if (borrowerType !== undefined && borrowerType !== user.borrowerType) {
            updateData.borrowerType = borrowerType;
            changes.push(`ประเภทผู้กู้: ${user.borrowerType} → ${borrowerType}`);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "ไม่มีข้อมูลที่เปลี่ยนแปลง" }, { status: 400 });
        }

        await db.user.update({ where: { id }, data: updateData });

        await db.auditLog.create({
            data: {
                adminId: session.userId,
                action: "EDIT_STUDENT",
                entityType: "USER",
                entityId: id,
                details: `แก้ไขข้อมูล ${user.prefix}${user.firstName} ${user.lastName}: ${changes.join(', ')}`,
            }
        });

        revalidatePath('/');
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("EDIT_STUDENT_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
