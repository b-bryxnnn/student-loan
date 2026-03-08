import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { format } from "date-fns";
import { th } from "date-fns/locale";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentIds, action, remark, deadline } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: "ไม่มีเอกสารที่เลือก" }, { status: 400 });
    }

    if (documentIds.length > 100) {
      return NextResponse.json({ error: "ดำเนินการได้สูงสุดครั้งละ 100 เอกสาร" }, { status: 400 });
    }

    const documents = await db.document.findMany({
      where: { id: { in: documentIds } },
      include: { user: true }
    });

    // Loop through documents and process depending on action
    for (const doc of documents) {
      let updateData: any = {};

      if (action === 'APPROVE') {
        updateData.status = 'APPROVED';
      } else if (action === 'REJECTED') {
        updateData.status = 'REJECTED';
        updateData.remark = remark;
        if (deadline) updateData.deadline = new Date(deadline);

        // Send email
        const deadlineText = deadline ? format(new Date(deadline), 'dd MMMM yyyy', { locale: th }) : 'โดยเร็วที่สุด';
        const docTypeName = doc.type === 'CONFIRMATION' ? 'แบบยืนยันเบิกเงินกู้ยืม' : 'สัญญากู้ยืมเงิน';

        const emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-w: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                  <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">แจ้งเตือน: เอกสาร กยศ. ต้องแก้ไข</h2>
                  </div>
                  <div style="padding: 20px;">
                    <p>เรียน คุณ${doc.user.firstName} ${doc.user.lastName},</p>
                    <p>เอกสาร <strong>${docTypeName} (ปีการศึกษา ${doc.academicYear.replace('_', '/')}) เลขท้าย ${doc.lastThreeDigits}</strong> ของคุณไม่ผ่านการตรวจสอบเบื้องต้น</p>
                    
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                      <h4 style="margin-top: 0; color: #991b1b;">เหตุผลที่ต้องแก้ไข:</h4>
                      <p style="margin-bottom: 0;">${remark}</p>
                    </div>
                    
                    <p><strong>กำหนดแก้ไขภายใน:</strong> ${deadlineText}</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents/edit/${doc.id}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                        เข้าสู่ระบบเพื่ออัปโหลดเอกสารใหม่
                      </a>
                    </div>
                    
                    <p style="font-size: 13px; color: #666;">หมายเหตุ: กรุณาแก้ไขและส่งกลับภายในเวลาที่กำหนด หากพ้นกำหนดอาจกระทบสิทธิการกู้ยืมของท่าน</p>
                  </div>
                  <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                    งานกองทุนเงินให้กู้ยืมเพื่อการศึกษา โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง
                  </div>
                </div>
                `;

        // Fire and forget email (don't block the loop if one fails)
        sendEmail(doc.user.email, `เอกสาร ${docTypeName} กยศ. ของคุณต้องแก้ไข`, emailHtml, `เอกสาร ${docTypeName} ของคุณไม่ผ่านการตรวจสอบ\n\nเหตุผล: ${remark}\nกำหนดแก้ไขภายใน: ${deadlineText}\n\nกรุณาเข้าสู่ระบบเพื่ออัปโหลดเอกสารใหม่`).catch(console.error);

      } else if (action === 'MARK_RECEIVED') {
        updateData.originalReceived = true;
        updateData.status = 'APPROVED'; // ensure status logic
      } else if (action === 'MARK_SENT') {
        updateData.sentToCentral = true;
        updateData.status = 'APPROVED';
      }

      // Update DB
      await db.document.update({
        where: { id: doc.id },
        data: updateData
      });

      // Log Audit
      await db.auditLog.create({
        data: {
          adminId: session.userId,
          action: action,
          entityType: "DOCUMENT",
          entityId: doc.id,
          details: `Updated via Bulk Action to ${action}`
        }
      });
    }

    return NextResponse.json({ success: true, count: documents.length }, { status: 200 });

  } catch (error) {
    console.error("ADMIN_BULK_ACTION_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
