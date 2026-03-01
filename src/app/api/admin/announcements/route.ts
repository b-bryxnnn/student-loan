import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

// GET: ดึงรายการประกาศทั้งหมด
export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const announcements = await db.announcement.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return NextResponse.json({ announcements }, { status: 200 });
    } catch (error) {
        console.error("GET_ANNOUNCEMENTS_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: สร้างประกาศใหม่ + ส่งอีเมลแจ้งเตือนนักเรียนทุกคน
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { title, content, sendNotification } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ error: "กรุณากรอกหัวข้อและเนื้อหาของประกาศ" }, { status: 400 });
        }

        if (title.length > 200) {
            return NextResponse.json({ error: "หัวข้อยาวเกินไป (สูงสุด 200 ตัวอักษร)" }, { status: 400 });
        }

        // สร้างประกาศในฐานข้อมูล
        const announcement = await db.announcement.create({
            data: { title, content }
        });

        // บันทึก Audit Log
        await db.auditLog.create({
            data: {
                adminId: session.userId,
                action: "CREATE_ANNOUNCEMENT",
                entityType: "ANNOUNCEMENT",
                entityId: announcement.id,
                details: `สร้างประกาศ: ${title}`,
            }
        });

        let emailSentCount = 0;

        // ส่งอีเมลแจ้งเตือนนักเรียนทุกคน (fire-and-forget)
        if (sendNotification) {
            const students = await db.user.findMany({
                where: { role: 'STUDENT', emailVerified: true },
                select: { email: true, firstName: true, lastName: true, prefix: true }
            });

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            // ส่งอีเมลแบบ batch (ไม่ block response)
            for (const student of students) {
                const emailHtml = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                  <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px 30px;">
                    <h2 style="margin: 0; font-size: 20px;">📢 ประกาศใหม่จากระบบ กยศ.</h2>
                    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</p>
                  </div>
                  <div style="padding: 24px 30px;">
                    <p style="margin: 0 0 6px; color: #64748b; font-size: 13px;">เรียน คุณ${student.prefix}${student.firstName} ${student.lastName},</p>
                    
                    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 16px 0; border-radius: 0 8px 8px 0;">
                      <h3 style="margin: 0 0 8px; color: #1e293b; font-size: 16px;">${title}</h3>
                      <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.7; white-space: pre-line;">${content}</p>
                    </div>

                    <div style="text-align: center; margin: 24px 0;">
                      <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(59,130,246,0.3);">
                        เข้าสู่ระบบ กยศ.
                      </a>
                    </div>

                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">หากคุณมีข้อสงสัย กรุณาติดต่อเจ้าหน้าที่ กยศ. ประจำโรงเรียน</p>
                  </div>
                  <div style="background: #f1f5f9; padding: 14px 30px; text-align: center; font-size: 11px; color: #94a3b8;">
                    งานกองทุนเงินให้กู้ยืมเพื่อการศึกษา โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง
                  </div>
                </div>
                `;

                sendEmail(
                    student.email,
                    `📢 ประกาศ กยศ.: ${title}`,
                    emailHtml
                ).then(() => { emailSentCount++; }).catch(console.error);
            }
        }

        return NextResponse.json({
            success: true,
            announcementId: announcement.id,
            message: sendNotification ? "สร้างประกาศและกำลังส่งอีเมลแจ้งเตือน" : "สร้างประกาศสำเร็จ"
        }, { status: 201 });

    } catch (error) {
        console.error("CREATE_ANNOUNCEMENT_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: ลบ/ซ่อนประกาศ
export async function DELETE(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ไม่มี ID ที่ต้องการลบ" }, { status: 400 });
        }

        await db.announcement.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("DELETE_ANNOUNCEMENT_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
