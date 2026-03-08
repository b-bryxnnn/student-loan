import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function GET(request: Request) {
    await clearAuthCookie();
    return NextResponse.redirect(new URL('/login', request.url));
}

export async function POST() {
    await clearAuthCookie();
    return NextResponse.json({ success: true }, { status: 200 });
}
