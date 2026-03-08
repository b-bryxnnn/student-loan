import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadFileToDrive } from '@/lib/drive';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const type = formData.get("type") as 'CONFIRMATION' | 'CONTRACT';
        const lastThreeDigits = formData.get("lastThreeDigits") as string;
        const academicYear = formData.get("academicYear") as string;
        const semester = formData.get("semester") as string;
        const file = formData.get("documentFile") as File;

        if (!type || !lastThreeDigits || !academicYear || !semester || !file) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PDF เท่านั้น" }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "ขนาดไฟล์เกิน 10MB" }, { status: 400 });
        }

        // Check if system is open for submission
        const setting = await db.systemSetting.findFirst();
        if (setting) {
            let isOpen = setting.documentSubmissionOpen;
            const now = new Date();

            if (isOpen) {
                if (setting.submissionOpenDate && now < setting.submissionOpenDate) isOpen = false;
                if (setting.submissionCloseDate && now > setting.submissionCloseDate) isOpen = false;
            }

            if (!isOpen) {
                return NextResponse.json({ error: "ระบบปิดรับเอกสารชั่วคราว" }, { status: 403 });
            }
        }

        const fileName = file.name.toUpperCase();

        // 1. Validate File Name
        if (type === 'CONFIRMATION') {
            if (!fileName.startsWith('R') || !fileName.endsWith('.PDF') || fileName.slice(1, -4) !== lastThreeDigits) {
                // Return clear error message to user, but let them know it's a specific requirement
                return NextResponse.json({ error: `ชื่อไฟล์แบบยืนยันต้องเป็น R${lastThreeDigits}.pdf เท่านั้น (ปัจจุบันคือ ${file.name})` }, { status: 400 });
            }
        } else {
            if (!fileName.startsWith('C') || !fileName.endsWith('.PDF') || fileName.slice(1, -4) !== lastThreeDigits) {
                return NextResponse.json({ error: `ชื่อไฟล์สัญญาต้องเป็น C${lastThreeDigits}.pdf เท่านั้น (ปัจจุบันคือ ${file.name})` }, { status: 400 });
            }
        }

        // Convert file to process
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 2. Validate Page Count
        try {
            const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
            const pageCount = pdfDoc.getPageCount();

            if (type === 'CONFIRMATION' && pageCount < 3) {
                return NextResponse.json({ error: `เอกสารแบบยืนยันต้องมีอย่างน้อย 3 หน้า (พบแค่ ${pageCount} หน้า)` }, { status: 400 });
            }
            if (type === 'CONTRACT' && pageCount < 9) {
                return NextResponse.json({ error: `เอกสารสัญญาต้องมีอย่างน้อย 9 หน้า (พบแค่ ${pageCount} หน้า)` }, { status: 400 });
            }
        } catch (e) {
            return NextResponse.json({ error: "ไม่สามารถอ่านไฟล์ PDF ได้ อาจมีการเข้ารหัสหรือไฟล์เสีย" }, { status: 400 });
        }

        const academicTerm = `${academicYear}_${semester}`;

        // 3. Prevent duplicates in the same semester with the same last 3 digits
        const existingDoc = await db.document.findFirst({
            where: {
                academicYear: academicTerm,
                lastThreeDigits: lastThreeDigits,
                type: type,
                userId: {
                    not: session.userId // Allow the same user to re-upload their own if it was rejected, but check conflict with others
                }
            }
        });

        if (existingDoc) {
            return NextResponse.json({ error: "มีเอกสารรหัสท้ายนี้ในระบบภาคเรียนนี้แล้ว เลขท้ายนี้อาจมีคนอื่นใช้ไปแล้ว" }, { status: 400 });
        }

        // Upload to Drive
        const driveFileName = fileName.toLowerCase(); // keep exact case or force lowercase
        const driveFileId = await uploadFileToDrive(buffer, driveFileName, "application/pdf");

        const finalDriveFileId = driveFileId || "mock-drive-id-not-configured";

        // Check if user already has this document type in this semester (update vs create)
        const myExistingDoc = await db.document.findFirst({
            where: {
                userId: session.userId,
                type: type,
                academicYear: academicTerm,
            }
        });

        if (myExistingDoc) {
            // Update existing (e.g. if they are correcting a REJECTED doc)
            await db.document.update({
                where: { id: myExistingDoc.id },
                data: {
                    driveFileId: finalDriveFileId,
                    lastThreeDigits,
                    status: 'PENDING',
                    remark: null,
                    deadline: null,
                }
            });
        } else {
            // Create new
            await db.document.create({
                data: {
                    userId: session.userId,
                    type,
                    driveFileId: finalDriveFileId,
                    lastThreeDigits,
                    academicYear: academicTerm,
                    status: 'PENDING'
                }
            });
        }

        return NextResponse.json({ success: true }, { status: 201 });

    } catch (error) {
        console.error("DOCUMENT_UPLOAD_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
