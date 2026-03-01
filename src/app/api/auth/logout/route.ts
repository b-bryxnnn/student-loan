import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function GET() {
    await clearAuthCookie();
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
}

export async function POST() {
    await clearAuthCookie();
    return NextResponse.json({ success: true }, { status: 200 });
}
