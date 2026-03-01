import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const query = searchParams.get("q");

        let whereClause: any = {};

        if (status && status !== 'ALL') {
            whereClause.status = status;
        }

        if (query) {
            whereClause.OR = [
                { lastThreeDigits: { contains: query } },
                {
                    user: {
                        OR: [
                            { firstName: { contains: query } },
                            { lastName: { contains: query } },
                            { idCard: { contains: query } }
                        ]
                    }
                }
            ];
        }

        const documents = await db.document.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        idCard: true,
                        firstName: true,
                        lastName: true,
                        prefix: true,
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: 500
        });

        // Mask idCard: show first 3 and last 3 digits only
        const maskedDocuments = documents.map((doc: typeof documents[number]) => ({
            ...doc,
            user: {
                ...doc.user,
                idCard: doc.user.idCard.length >= 6
                    ? doc.user.idCard.slice(0, 3) + '-xxxx-xxx-' + doc.user.idCard.slice(-3)
                    : doc.user.idCard
            }
        }));

        return NextResponse.json({ documents: maskedDocuments }, { status: 200 });

    } catch (error) {
        console.error("ADMIN_DOCS_GET_ERROR:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
