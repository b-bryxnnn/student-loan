import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export interface TokenPayload {
    userId: string;
    role: 'STUDENT' | 'ADMIN';
}

export const signToken = (payload: TokenPayload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};

export const setAuthCookie = async (token: string) => {
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
};

export const clearAuthCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.delete('token');
};

export const getSession = async (): Promise<TokenPayload | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) return null;

    return verifyToken(token);
};
