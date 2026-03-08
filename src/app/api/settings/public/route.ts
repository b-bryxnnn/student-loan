import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const setting = await db.systemSetting.findFirst();

        if (!setting) {
            return NextResponse.json({
                academicYear: "2567",
                semester: "1",
                documentSubmissionOpen: false,
            });
        }

        // Check dates if open
        let isOpen = setting.documentSubmissionOpen;
        const now = new Date();

        if (isOpen) {
            if (setting.submissionOpenDate && now < setting.submissionOpenDate) {
                isOpen = false;
            }
            if (setting.submissionCloseDate && now > setting.submissionCloseDate) {
                isOpen = false;
            }
        }

        return NextResponse.json({
            academicYear: setting.academicYear,
            semester: setting.semester,
            documentSubmissionOpen: isOpen,
            submissionOpenDate: setting.submissionOpenDate,
            submissionCloseDate: setting.submissionCloseDate,
        });

    } catch (error) {
        console.error("GET_PUBLIC_SETTINGS_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
