/**
 * ระบบส่งอีเมล — รองรับ 2 โหมด:
 * 
 * โหมด 1: Google Apps Script (แนะนำ — ไม่ต้องใช้ App Password)
 *   ใช้ตัวแปร: APPS_SCRIPT_URL
 * 
 * โหมด 2: Gmail + Nodemailer (ต้องใช้ App Password)
 *   ใช้ตัวแปร: EMAIL_USER, EMAIL_PASS
 * 
 * ระบบจะตรวจ APPS_SCRIPT_URL ก่อน ถ้ามีจะใช้โหมด 1
 * ถ้าไม่มีจะ fallback ไปใช้โหมด 2
 */

import nodemailer from 'nodemailer';

// ========== โหมด 1: Apps Script ==========
const sendViaAppsScript = async (to: string, subject: string, html: string): Promise<boolean> => {
    const url = process.env.APPS_SCRIPT_URL;
    if (!url) return false;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html, secret: process.env.APPS_SCRIPT_SECRET || '' }),
        });

        const data = await res.json();
        if (data.success) {
            console.log("Email sent via Apps Script to:", to);
            return true;
        } else {
            console.error("Apps Script error:", data.error);
            return false;
        }
    } catch (error) {
        console.error("Apps Script fetch error:", error);
        return false;
    }
};

// ========== โหมด 2: Nodemailer ==========
const getTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

const sendViaNodemailer = async (to: string, subject: string, html: string): Promise<boolean> => {
    const transporter = getTransporter();
    if (!transporter) return false;

    try {
        const info = await transporter.sendMail({
            from: `"ระบบกู้ยืมเงิน RSL" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Email sent via Nodemailer:", info.messageId);
        return true;
    } catch (error) {
        console.error("Nodemailer error:", error);
        return false;
    }
};

// ========== ฟังก์ชันหลัก ==========
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    // ลอง Apps Script ก่อน
    if (process.env.APPS_SCRIPT_URL) {
        return sendViaAppsScript(to, subject, html);
    }

    // Fallback ไป Nodemailer
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return sendViaNodemailer(to, subject, html);
    }

    console.warn("⚠️ ไม่มีการตั้งค่าอีเมล (ต้องมี APPS_SCRIPT_URL หรือ EMAIL_USER+EMAIL_PASS)");
    return false;
};

export const sendOTPEmail = async (to: string, otp: string) => {
    const subject = "รหัส OTP สำหรับยืนยันอีเมลของคุณ - ระบบกู้ยืม กยศ. เบื้องต้น";
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>รหัส OTP ยืนยันอีเมล</h2>
      <p>คุณได้ทำการขอสมัครเข้าใช้งานระบบกู้ยืมเงิน กยศ. เบื้องต้น (ลักษณะ 1)</p>
      <p>รหัส OTP ของคุณคือ: <strong><span style="font-size: 24px; color: #4F46E5;">${otp}</span></strong></p>
      <p>กรุณานำรหัสนี้ไปกรอกในหน้าสมัครสมาชิกภายใน 15 นาที</p>
      <hr />
      <p style="font-size: 12px; color: #999;">หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
    </div>
  `;
    return sendEmail(to, subject, html);
}

export const sendPasswordResetOTP = async (to: string, otp: string) => {
    const subject = "รหัส OTP สำหรับรีเซ็ตรหัสผ่าน - ระบบกู้ยืม กยศ.";
    const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2>รหัส OTP รีเซ็ตรหัสผ่าน</h2>
      <p>คุณได้ทำการขอเปลี่ยนรหัสผ่านเพื่อเข้าใช้งานระบบกู้ยืมเงิน กยศ.</p>
      <p>รหัส OTP ของคุณคือ: <strong><span style="font-size: 24px; color: #DC2626;">${otp}</span></strong></p>
      <p>กรุณานำรหัสนี้ไปกรอกเพื่อตั้งรหัสผ่านใหม่ภายใน 15 นาที</p>
      <hr />
      <p style="font-size: 12px; color: #999;">หากคุณไม่ได้ทำรายการนี้ รหัสผ่านเก่าของคุณจะยังคงใช้งานได้ตามปกติ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
    </div>
  `;
    return sendEmail(to, subject, html);
}
