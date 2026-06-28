const nodemailer = require('nodemailer');

// ── Credential check ──────────────────────────────────────────────────────────
const EMAIL_USER = (process.env.EMAIL_USER || '').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || '').trim();

const isGmailConfigured =
  EMAIL_USER &&
  EMAIL_PASS &&
  EMAIL_USER !== 'your_gmail@gmail.com' &&
  EMAIL_PASS !== 'your_gmail_app_password';

// Gmail transporter (only built when credentials are real)
const gmailTransporter = isGmailConfigured
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    })
  : null;

/**
 * Send (or log) a password reset OTP.
 *
 * • If Gmail is configured  → sends a real email
 * • Otherwise              → prints OTP to the server terminal (dev mode)
 *
 * @param {string} to    - recipient email
 * @param {string} otp   - 6-digit OTP code
 * @param {string} name  - recipient name
 */
const sendResetOtpEmail = async (to, otp, name) => {
  // ── DEV MODE: just log the OTP to the terminal ───────────────────────
  if (!isGmailConfigured) {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🔐  PASSWORD RESET OTP  (DEV MODE – console only)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  To    : ${to}`);
    console.log(`  Name  : ${name}`);
    console.log(`  OTP   : ${otp}   ← copy this into the app`);
    console.log(`  Expires in 15 minutes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    return; // no network call needed
  }

  // ── PRODUCTION MODE: send real Gmail ─────────────────────────────────
  const mailOptions = {
    from: `"BlogFlow" <${EMAIL_USER}>`,
    to,
    subject: 'Your BlogFlow Password Reset OTP',
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#6366f1 0%,#a855f7 100%);padding:36px 40px 28px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.03em;">✦ BlogFlow</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Password Reset Request</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#0f172a;font-size:16px;margin:0 0 12px;">Hi <strong>${name}</strong>,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 28px;">
            We received a request to reset your password. Use the OTP below to continue. It expires in <strong>15 minutes</strong>.
          </p>
          <div style="background:#ffffff;border:2px dashed #6366f1;border-radius:14px;padding:28px;text-align:center;margin-bottom:28px;">
            <p style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 10px;">Your OTP Code</p>
            <p style="color:#6366f1;font-size:42px;font-weight:800;letter-spacing:0.15em;margin:0;font-family:'Courier New',monospace;">${otp}</p>
          </div>
          <p style="color:#94a3b8;font-size:13px;line-height:1.6;margin:0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        <div style="padding:20px 40px;background:#f1f5f9;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} BlogFlow. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  const info = await gmailTransporter.sendMail(mailOptions);
  console.log(`✅ OTP email sent to: ${to} | MessageID: ${info.messageId}`);
};

module.exports = { sendResetOtpEmail };
