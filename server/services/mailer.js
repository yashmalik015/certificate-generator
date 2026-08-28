import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendCertificateEmail = async (student, certificateItems) => {
  if (!student.email) {
    throw new Error('Student has no email address provided.');
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  let transporter;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass }
    });
  } else {
    // Fallback JSON / ethereal transport for testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const attachments = [];
  certificateItems.forEach((item) => {
    if (item.pdfUrl) {
      const pdfPath = path.resolve(__dirname, '..', item.pdfUrl.replace(/^\//, ''));
      if (fs.existsSync(pdfPath)) {
        attachments.push({
          filename: `${student.fullName.replace(/\s+/g, '_')}_${item.templateId}.pdf`,
          path: pdfPath
        });
      }
    }
  });

  const mailOptions = {
    from: '"IHREO Honors & Awards" <certificates@ihreo.org>',
    to: student.email,
    subject: `Congratulations ${student.fullName}! Your IHREO Certificate of Honor`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 24px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background-color: #1e293b; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0; color: #f59e0b;">IHREO HONORS COUNCIL</h2>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #cbd5e1;">Iconic Human Rights & Educational Organisation</p>
          </div>
          <div style="padding: 24px; color: #334155; line-height: 1.6;">
            <h3 style="color: #0f172a;">Dear ${student.fullName},</h3>
            <p>Congratulations! We are pleased to present your official IHREO Certificate(s) of Distinction.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #64748b;"><strong>Ref No:</strong></td><td style="padding: 8px;">${student.refno}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;"><strong>Certificate No:</strong></td><td style="padding: 8px;">${student.certificateNumber}</td></tr>
              <tr><td style="padding: 8px; color: #64748b;"><strong>Category:</strong></td><td style="padding: 8px;">${student.category}</td></tr>
            </table>
            <p>Your official PDF certificate(s) are attached to this email. You can download and print them directly.</p>
            <p style="margin-top: 24px; font-size: 14px; color: #64748b;">Best regards,<br><strong>IHREO Secretariat</strong></p>
          </div>
        </div>
      </div>
    `,
    attachments
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent:', info.messageId);
  return info;
};
