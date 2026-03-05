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
            from: `"ระบบ กยศ. รส.ล." <${process.env.EMAIL_USER}>`,
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

// ========== Email Wrapper (HTML Card Template) ==========
const wrapEmailHtml = (title: string, body: string) => `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:28px 32px;text-align:center;">
            <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:700;">${title}</h1>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">กองทุนเงินให้กู้ยืมเพื่อการศึกษา — รส.ล.</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
              งาน กยศ. โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง<br>
              อีเมลนี้ถูกส่งโดยอัตโนมัติ กรุณาอย่าตอบกลับ
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const sendOTPEmail = async (to: string, otp: string) => {
    const subject = "รหัส OTP ยืนยันอีเมล — ระบบ กยศ. รส.ล.";
    const body = `
      <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;">
        คุณได้สมัครเข้าใช้งานระบบส่งเอกสาร กยศ. เบื้องต้น กรุณานำรหัสด้านล่างไปกรอกเพื่อยืนยันอีเมลของคุณ
      </p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#2563eb);color:#ffffff;font-size:32px;font-weight:800;letter-spacing:8px;padding:16px 40px;border-radius:10px;font-family:monospace;">
          ${otp}
        </div>
      </div>
      <p style="margin:0 0 4px;color:#64748b;font-size:13px;">รหัสนี้จะหมดอายุภายใน <strong>15 นาที</strong></p>
      <p style="margin:0;color:#94a3b8;font-size:12px;">หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
    `;
    return sendEmail(to, subject, wrapEmailHtml("รหัส OTP ยืนยันอีเมล", body));
}

export const sendPasswordResetOTP = async (to: string, otp: string) => {
    const subject = "รหัส OTP รีเซ็ตรหัสผ่าน — ระบบ กยศ. รส.ล.";
    const body = `
      <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;">
        คุณได้ขอเปลี่ยนรหัสผ่านเพื่อเข้าใช้งานระบบส่งเอกสาร กยศ. กรุณานำรหัสด้านล่างไปกรอกเพื่อตั้งรหัสผ่านใหม่
      </p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);color:#ffffff;font-size:32px;font-weight:800;letter-spacing:8px;padding:16px 40px;border-radius:10px;font-family:monospace;">
          ${otp}
        </div>
      </div>
      <p style="margin:0 0 4px;color:#64748b;font-size:13px;">รหัสนี้จะหมดอายุภายใน <strong>15 นาที</strong></p>
      <p style="margin:0;color:#94a3b8;font-size:12px;">หากคุณไม่ได้ทำรายการนี้ รหัสผ่านเก่าจะยังคงใช้ได้ตามปกติ</p>
    `;
    return sendEmail(to, subject, wrapEmailHtml("รีเซ็ตรหัสผ่าน", body));
}
