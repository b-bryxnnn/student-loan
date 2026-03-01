// Simple in-memory rate limiter (no external deps needed)
// For production at scale, consider Redis-based solutions like @upstash/ratelimit

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
        if (now > value.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

interface RateLimitOptions {
    maxRequests: number;    // จำนวนครั้งสูงสุด
    windowMs: number;       // ช่วงเวลา (มิลลิวินาที)
}

export function rateLimit(key: string, options: RateLimitOptions): { success: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
        // สร้าง Record ใหม่
        rateLimitStore.set(key, { count: 1, resetTime: now + options.windowMs });
        return { success: true, remaining: options.maxRequests - 1 };
    }

    if (record.count >= options.maxRequests) {
        return { success: false, remaining: 0 };
    }

    record.count++;
    return { success: true, remaining: options.maxRequests - record.count };
}

// Helper: ดึง IP จาก Request headers
export function getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.headers.get('x-real-ip') || 'unknown';
}
