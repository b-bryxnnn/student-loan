import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '@/lib/email';
import crypto from 'crypto';
import { rateLimit, getClientIP } from '@/lib/rate-limit';
import { validateThaiId } from '@/lib/validateThaiId';

export async function POST(req: Request) {
    try {
        // Rate Limit: 3 registrations per hour per IP
        const ip = getClientIP(req);
        const rl = rateLimit(`register:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 });
        if (!rl.success) {
            return NextResponse.json({ error: "คุณลงทะเบียนบ่อยเกินไป กรุณารอสักครู่" }, { status: 429 });
        }

        // Daily Registration Quota (Max 80 per day to protect email SMTP limits)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await db.user.count({
            where: {
                createdAt: {
                    gte: today
                }
            }
        });

        if (todayCount >= 80) {
            return NextResponse.json({ error: "โควต้าสมัครสมาชิกระบบรายวันเต็มแล้ว (80 คน/วัน) กรุณาลองใหม่ในวันพรุ่งนี้" }, { status: 429 });
        }

        const body = await req.json();
        console.log("REGISTER body received:", JSON.stringify({ ...body, password: '***', idCardImage: body.idCardImage ? '[base64]' : null, faceImage: body.faceImage ? '[base64]' : null }));
        const { prefix, firstName, lastName, studentId, idCard, phone, email, password, borrowerType, idCardImage, faceImage, consentParent, consentLoan, consentPdpa } = body;

        // === Backend Validation ===
        if (!prefix || !firstName || !lastName || !idCard || !email || !phone || !password) {
            const missing = [];
            if (!prefix) missing.push('คำนำหน้า');
            if (!firstName) missing.push('ชื่อ');
            if (!lastName) missing.push('นามสกุล');
            if (!idCard) missing.push('เลขบัตรประชาชน');
            if (!phone) missing.push('เบอร์โทรศัพท์');
            if (!email) missing.push('อีเมล');
            if (!password) missing.push('รหัสผ่าน');
            return NextResponse.json({ error: `กรุณากรอกข้อมูลให้ครบถ้วน: ${missing.join(', ')}` }, { status: 400 });
        }

        // ตรวจสอบ consent ทั้ง 3 ข้อ
        if (!consentParent || !consentLoan || !consentPdpa) {
            return NextResponse.json({ error: "กรุณายินยอมเงื่อนไขทั้ง 3 ข้อก่อนสมัครสมาชิก" }, { status: 400 });
        }

        if (typeof firstName !== 'string' || firstName.trim().length < 1 || firstName.length > 100) {
            return NextResponse.json({ error: "ชื่อไม่ถูกต้อง" }, { status: 400 });
        }

        if (typeof lastName !== 'string' || lastName.trim().length < 1 || lastName.length > 100) {
            return NextResponse.json({ error: "นามสกุลไม่ถูกต้อง" }, { status: 400 });
        }

        // ตรวจสอบรูปแบบเลขบัตร (13 หลัก ตัวเลขเท่านั้น)
        if (!/^\d{13}$/.test(idCard)) {
            return NextResponse.json({ error: "เลขประจำตัวประชาชนต้องเป็นตัวเลข 13 หลัก" }, { status: 400 });
        }

        // ตรวจ checksum — เตือนใน log แต่ไม่ block
        if (!validateThaiId(idCard)) {
            console.warn("WARNING: Thai ID checksum failed for:", idCard, "— allowing registration anyway");
        }

        // ตรวจเบอร์โทร
        if (!/^0\d{8,9}$/.test(phone)) {
            return NextResponse.json({ error: "เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก)" }, { status: 400 });
        }

        if (studentId && (typeof studentId !== 'string' || studentId.trim().length < 1 || studentId.length > 20)) {
            return NextResponse.json({ error: "รหัสนักเรียนไม่ถูกต้อง" }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
        }

        if (password.length > 128) {
            return NextResponse.json({ error: "รหัสผ่านยาวเกินไป (สูงสุด 128 ตัวอักษร)" }, { status: 400 });
        }

        const validBorrowerTypes = ['NEW', 'OLD'];
        if (borrowerType && !validBorrowerTypes.includes(borrowerType)) {
            return NextResponse.json({ error: "ประเภทผู้กู้ไม่ถูกต้อง" }, { status: 400 });
        }

        // 1. Check if idCard or email already exists
        const existingUser = await db.user.findFirst({
            where: {
                OR: [
                    { idCard },
                    { email },
                ]
            }
        });

        if (existingUser) {
            if (existingUser.idCard === idCard) {
                return NextResponse.json({ error: "เลขประจำตัวประชาชนนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
            }
            return NextResponse.json({ error: "อีเมลนี้มีอยู่ในระบบแล้ว" }, { status: 400 });
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Generate 6-digit OTP using cryptographically secure random
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // 4. Create User (Unverified)
        const user = await db.user.create({
            data: {
                prefix: prefix.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                studentId: studentId ? studentId.trim() : null,
                gradeLevel: body.gradeLevel || null,
                idCard,
                phone: phone || null,
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                borrowerType: borrowerType || 'NEW',
                emailVerified: false,
                otp,
                otpExpiry,
                role: 'STUDENT',
                idCardImage: idCardImage || null,
                faceImage: faceImage || null,
                consentParent: !!consentParent,
                consentLoan: !!consentLoan,
                consentPdpa: !!consentPdpa,
            }
        });

        // 5. ส่ง OTP Email
        const emailSent = await sendOTPEmail(email, otp);
        if (!emailSent) {
            // อีเมลส่งไม่สำเร็จ แต่ไม่ลบ user เพราะผู้ใช้สามารถกด "ขอ OTP ใหม่" ได้
            console.warn(`⚠️ ส่ง OTP email ไม่สำเร็จไปยัง ${email} — ผู้ใช้สามารถกดขอ OTP ใหม่ได้`);
            return NextResponse.json({
                success: true,
                userId: user.id,
                emailWarning: "ไม่สามารถส่งอีเมล OTP ได้ในขณะนี้ กรุณากดขอ OTP ใหม่อีกครั้ง"
            }, { status: 201 });
        }

        return NextResponse.json({ success: true, userId: user.id }, { status: 201 });

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: `เกิดข้อผิดพลาดภายในระบบ: ${message}` }, { status: 500 });
    }
}
