import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let setting = await db.systemSetting.findFirst();

        // If no setting exists, create default
        if (!setting) {
            setting = await db.systemSetting.create({
                data: {
                    academicYear: "2567",
                    semester: "1",
                    documentSubmissionOpen: false,
                }
            });
        }

        return NextResponse.json(setting);

    } catch (error) {
        console.error("GET_SETTINGS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();

        const setting = await db.systemSetting.findFirst();

        if (!setting) {
            return NextResponse.json({ error: "Settings not found" }, { status: 404 });
        }

        const updated = await db.systemSetting.update({
            where: { id: setting.id },
            data: {
                academicYear: data.academicYear,
                semester: data.semester,
                documentSubmissionOpen: data.documentSubmissionOpen,
                submissionOpenDate: data.submissionOpenDate ? new Date(data.submissionOpenDate) : null,
                submissionCloseDate: data.submissionCloseDate ? new Date(data.submissionCloseDate) : null,
            }
        });

        // Audit Log
        await db.auditLog.create({
            data: {
                adminId: session.userId,
                action: "UPDATE_SYSTEM_SETTINGS",
                details: `Updated settings to Term ${data.semester}/${data.academicYear}, Submission: ${data.documentSubmissionOpen}`,
                entityType: "SETTING",
                entityId: setting.id
            }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error("UPDATE_SETTINGS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
