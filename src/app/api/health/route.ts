import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
    const info: Record<string, any> = {
        timestamp: new Date().toISOString(),
        env: {
            DATABASE_URL: process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET',
            CI: process.env.CI || 'not set',
            NEXT_PHASE: process.env.NEXT_PHASE || 'not set',
            NODE_ENV: process.env.NODE_ENV || 'not set',
            JWT_SECRET: process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET',
        },
    };

    // Test database connection
    try {
        const userCount = await db.user.count();
        info.database = { status: '✅ Connected', userCount };
    } catch (error) {
        info.database = {
            status: '❌ Failed',
            error: error instanceof Error ? error.message : String(error),
        };
    }

    return NextResponse.json(info);
}
