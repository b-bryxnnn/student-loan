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
const sendViaAppsScript = async (to: string, subject: string, html: string, text: string): Promise<boolean> => {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // ส่ง text ไปด้วยเสมอ — สำคัญมาก ป้องกัน Google block
      body: JSON.stringify({ to, subject, html, text, secret: process.env.APPS_SCRIPT_SECRET || '' }),
      redirect: 'follow',
    });

    const contentType = res.headers.get('content-type') || '';
    console.log(`Apps Script response: status=${res.status}, contentType=${contentType}`);

    if (!res.ok) {
      console.error(`Apps Script HTTP error: ${res.status} ${res.statusText}`);
      const body = await res.text();
      console.error(`Response body: ${body.substring(0, 500)}`);
      return false;
    }

    if (!contentType.includes('application/json')) {
      const body = await res.text();
      if (body.toLowerCase().includes('"success":true') || body.toLowerCase().includes('success')) {
        console.log("Email sent via Apps Script (non-JSON response) to:", to);
        return true;
      }
      console.error("Apps Script returned non-JSON response:", body.substring(0, 500));
      return false;
    }

    const data = await res.json();
    if (data.success) {
      console.log("Email sent via Apps Script to:", to);
      return true;
    } else {
      console.error("Apps Script error:", data.error || JSON.stringify(data));
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

const sendViaNodemailer = async (to: string, subject: string, html: string, text: string): Promise<boolean> => {
  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    const info = await transporter.sendMail({
      from: `"งาน กยศ. รส.ล." <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
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
export const sendEmail = async (to: string, subject: string, html: string, text: string): Promise<boolean> => {
  if (process.env.APPS_SCRIPT_URL) {
    return sendViaAppsScript(to, subject, html, text);
  }
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return sendViaNodemailer(to, subject, html, text);
  }
  console.warn("⚠️ ไม่มีการตั้งค่าอีเมล (ต้องมี APPS_SCRIPT_URL หรือ EMAIL_USER+EMAIL_PASS)");
  return false;
};

// ========== Email Template — เรียบง่าย ไม่โดน spam ==========
// ❌ หลีกเลี่ยง: gradient, box-shadow, border-radius, monospace, font-weight:800
// ✅ ใช้: สีพื้น, ขนาดตัวอักษรปกติ, table layout แบบ basic
const wrapEmailHtml = (title: string, body: string) => `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Tahoma,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid #dddddd;">
        <tr>
          <td style="background-color:#1e3a5f;padding:20px 24px;text-align:center;">
            <h2 style="margin:0;font-size:18px;color:#ffffff;">${title}</h2>
            <p style="margin:6px 0 0;font-size:12px;color:#ccd6e0;">งาน กยศ. โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background-color:#f9f9f9;padding:14px 24px;text-align:center;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:11px;color:#999999;">
              งาน กยศ. โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง<br>
              หากคุณไม่ได้ดำเนินการใดๆ กรุณาเพิกเฉยอีเมลนี้
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const sendOTPEmail = async (to: string, otp: string) => {
  // ✅ subject สั้น ไม่มีอักขระพิเศษ ลด spam score
  const subject = "รหัส OTP ยืนยันอีเมล - ระบบ กยศ.";
  const body = `
      <p style="margin:0 0 14px;color:#333333;font-size:14px;line-height:1.6;">
        สวัสดีครับ/ค่ะ คุณได้ลงทะเบียนเข้าใช้งานระบบส่งเอกสาร กยศ. กรุณานำรหัสด้านล่างไปกรอกเพื่อยืนยันอีเมลของคุณ
      </p>
      <div style="text-align:center;margin:20px 0;">
        <div style="display:inline-block;background-color:#1e3a5f;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:6px;padding:14px 32px;font-family:Tahoma,Arial,sans-serif;">
          ${otp}
        </div>
      </div>
      <p style="margin:0 0 4px;color:#555555;font-size:13px;">รหัสนี้จะหมดอายุภายใน <b>15 นาที</b></p>
      <p style="margin:0;color:#999999;font-size:12px;">หากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
    `;
  // ✅ plain text ต้องมีข้อมูลครบ — สำคัญมาก ป้องกัน Google block
  const text = `รหัส OTP ยืนยันอีเมลของคุณคือ: ${otp}\n\nรหัสนี้จะหมดอายุภายใน 15 นาที\n\nหากคุณไม่ได้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้\n\n---\nงาน กยศ. โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง`;
  return sendEmail(to, subject, wrapEmailHtml("รหัส OTP ยืนยันอีเมล", body), text);
}

export const sendPasswordResetOTP = async (to: string, otp: string) => {
  const subject = "รหัส OTP รีเซ็ตรหัสผ่าน - ระบบ กยศ.";
  const body = `
      <p style="margin:0 0 14px;color:#333333;font-size:14px;line-height:1.6;">
        คุณได้ขอเปลี่ยนรหัสผ่านเพื่อเข้าใช้งานระบบส่งเอกสาร กยศ. กรุณานำรหัสด้านล่างไปกรอกเพื่อตั้งรหัสผ่านใหม่
      </p>
      <div style="text-align:center;margin:20px 0;">
        <div style="display:inline-block;background-color:#b91c1c;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:6px;padding:14px 32px;font-family:Tahoma,Arial,sans-serif;">
          ${otp}
        </div>
      </div>
      <p style="margin:0 0 4px;color:#555555;font-size:13px;">รหัสนี้จะหมดอายุภายใน <b>15 นาที</b></p>
      <p style="margin:0;color:#999999;font-size:12px;">หากคุณไม่ได้ทำรายการนี้ รหัสผ่านเก่าจะยังคงใช้ได้ตามปกติ</p>
    `;
  const text = `รหัส OTP รีเซ็ตรหัสผ่านของคุณคือ: ${otp}\n\nรหัสนี้จะหมดอายุภายใน 15 นาที\n\nหากคุณไม่ได้ทำรายการนี้ รหัสผ่านเก่าจะยังคงใช้ได้ตามปกติ\n\n---\nงาน กยศ. โรงเรียนรัตนโกสินทร์สมโภชลาดกระบัง`;
  return sendEmail(to, subject, wrapEmailHtml("รีเซ็ตรหัสผ่าน", body), text);
}
