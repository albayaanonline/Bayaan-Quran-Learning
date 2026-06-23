/**
 * Al Bayaan Email Notification Service
 *
 * Uses nodemailer with SMTP if configured. Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If vars are not set, email sending is silently skipped (no crash).
 */

import { logger } from "./logger";

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: any | null = null;

async function getTransporter(): Promise<any | null> {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  try {
    const nodemailer = await import("nodemailer");
    transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT ?? "587"),
      secure: parseInt(SMTP_PORT ?? "587") === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    logger.info({ host: SMTP_HOST }, "Email transporter initialised");
    return transporter;
  } catch (err) {
    logger.warn({ err }, "Failed to initialise email transporter");
    return null;
  }
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const t = await getTransporter();
  if (!t) return false;

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@bayaan.online";

  try {
    await t.sendMail({ from, to: payload.to, subject: payload.subject, text: payload.text, html: payload.html });
    logger.info({ to: payload.to, subject: payload.subject }, "Email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: payload.to }, "Failed to send email");
    return false;
  }
}

export async function sendNotificationEmail(params: {
  to: string;
  userName: string;
  title: string;
  message: string;
  linkText?: string;
  linkUrl?: string;
}): Promise<boolean> {
  const { to, userName, title, message, linkText, linkUrl } = params;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #f0fdf4; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #064e3b, #065f46); padding: 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 22px; }
  .header p { color: #6ee7b7; margin: 4px 0 0; font-size: 13px; }
  .body { padding: 28px 24px; }
  .body h2 { color: #064e3b; font-size: 18px; margin: 0 0 12px; }
  .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
  .cta { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; }
  .footer { background: #f9fafb; padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>Al Bayaan AI Academy</h1>
      <p>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
    </div>
    <div class="body">
      <p>As-salamu alaykum ${userName},</p>
      <h2>${title}</h2>
      <p>${message}</p>
      ${linkUrl ? `<a href="${linkUrl}" class="cta">${linkText ?? "Open Al Bayaan"}</a>` : ""}
    </div>
    <div class="footer">
      Al Bayaan AI Academy &mdash; Quran Learning Platform<br>
      You received this because you have notifications enabled.
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to, subject: title, text: `${title}\n\n${message}`, html });
}
