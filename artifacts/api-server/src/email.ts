import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env["GMAIL_USER"];
  const pass = process.env["GMAIL_APP_PASSWORD"];

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, name: string, token: string, baseUrl: string): Promise<boolean> {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("[Email] GMAIL_USER / GMAIL_APP_PASSWORD not set — logging verification link instead:");
    console.warn(`[Email] Verify link for ${to}: ${verifyUrl}`);
    return false;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;max-width:560px;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a1a 0%,#111111 100%);padding:36px 40px 28px;border-bottom:1px solid #1f1f1f;text-align:center;">
            <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
              <span style="color:#ffffff;">AfroMuse</span><span style="color:#f59e0b;"> AI</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Verify your email address</h1>
            <p style="margin:0 0 24px;font-size:15px;color:#888888;line-height:1.6;">
              Hey ${name}, thanks for joining AfroMuse AI! Click the button below to verify your email and start creating.
            </p>
            <div style="text-align:center;margin:32px 0;">
              <a href="${verifyUrl}" style="display:inline-block;background:#f59e0b;color:#000000;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                Verify My Email
              </a>
            </div>
            <p style="margin:24px 0 0;font-size:13px;color:#555555;line-height:1.6;">
              This link expires in <strong style="color:#888888;">24 hours</strong>. If you didn't create an account, you can safely ignore this email.
            </p>
            <div style="margin-top:24px;padding-top:20px;border-top:1px solid #1f1f1f;">
              <p style="margin:0;font-size:12px;color:#444444;">Or copy and paste this URL into your browser:</p>
              <p style="margin:6px 0 0;font-size:11px;color:#555555;word-break:break-all;">${verifyUrl}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #1a1a1a;text-align:center;">
            <p style="margin:0;font-size:12px;color:#333333;">© ${new Date().getFullYear()} AfroMuse AI. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"AfroMuse AI" <${process.env["GMAIL_USER"]}>`,
      to,
      subject: "Verify your AfroMuse AI email address",
      html,
      text: `Hey ${name},\n\nVerify your AfroMuse AI email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send verification email:", err);
    return false;
  }
}
