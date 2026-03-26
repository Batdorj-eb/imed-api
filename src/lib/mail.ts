import nodemailer from "nodemailer";
import { config } from "../config/index.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.mail.enabled || !config.mail.user || !config.mail.pass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
  });
  return transporter;
}

export interface InquiryEmailData {
  to: string;
  organizationName: string;
  productName: string;
  brand?: string;
  requirements?: string;
  isService?: boolean;
  isContact?: boolean;
}

export async function sendInquiryConfirmationEmail(data: InquiryEmailData): Promise<boolean> {
  const trans = getTransporter();
  if (!trans) {
    console.log("[Mail] Skipped: MAIL_ENABLED=false or SMTP not configured");
    return false;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.isContact ? "Хүсэлт хүлээн авлаа" : "Үнийн санал хүлээн авлаа"}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f1f5f9;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#0d9488,#14b8a6);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:1.5rem;">iMED Tech</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:0.95rem;">${data.isContact ? "Холбоо барих хүсэлт хүлээн авлаа" : "Үнийн санал хүлээн авлаа"}</p>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
      <p style="margin:0 0 16px;color:#334155;font-size:1rem;">Сайн байна уу, <strong>${escapeHtml(data.organizationName)}</strong>,</p>
      <p style="margin:0 0 16px;color:#64748b;line-height:1.6;">
        ${data.isContact ? "Таны хүсэлт амжилттай хүлээн авлаа." : "Таны үнийн санал хүсэлт амжилттай хүлээн авлаа."} Манай баг удахгүй таны утас эсвэл имэйлээр холбогдох болно.
      </p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#64748b;font-size:0.875rem;">${data.isContact ? "Хүсэлтийн төрөл:" : data.isService ? "Үнийн санал авах үйлчилгээ:" : "Үнийн санал авах бүтээгдэхүүн:"}</p>
        <p style="margin:0;font-weight:600;color:#0f172a;font-size:1rem;">
          ${escapeHtml(data.productName)}${data.brand ? ` (${escapeHtml(data.brand)})` : ""}
        </p>
        ${data.requirements ? `<p style="margin:12px 0 0;color:#64748b;font-size:0.875rem;">${data.isContact ? "Нэмэлт:" : data.isService ? "Дэлгэрэнгүй:" : "Нэмэлт шаардлага:"} ${escapeHtml(data.requirements)}</p>` : ""}
      </div>
      <p style="margin:20px 0 0;color:#94a3b8;font-size:0.875rem;">
        Асуулт байвал бидэнтэй холбогдоно уу.
      </p>
      <p style="margin:16px 0 0;color:#0d9488;font-weight:600;">Баярлалаа,<br>iMED Tech баг</p>
    </div>
    <p style="margin:16px 0 0;text-align:center;color:#94a3b8;font-size:0.75rem;">
      Энэ имэйл автоматаар илгээгдсэн. Хариу бичих шаардлагагүй.
    </p>
  </div>
</body>
</html>
`;

  const textDetail = data.isContact
    ? ""
    : ` ${data.isService ? "Үйлчилгээ" : "Бүтээгдэхүүн"}: ${data.productName}${data.brand ? ` (${data.brand})` : ""}.`;
  const textBody = `Сайн байна уу, ${data.organizationName}, ${
    data.isContact ? "Таны хүсэлт амжилттай хүлээн авлаа." : "Таны үнийн санал хүсэлт амжилттай хүлээн авлаа."
  }${textDetail} Манай баг удахгүй холбогдох болно.`;

  try {
    await trans.sendMail({
      from: `"iMED Tech" <${config.mail.from}>`,
      to: data.to,
      subject: `${data.isContact ? "Хүсэлт хүлээн авлаа" : "Үнийн санал хүлээн авлаа"} | iMED Tech`,
      html,
      text: textBody,
    });
    console.log("[Mail] Inquiry confirmation sent to", data.to);
    return true;
  } catch (err) {
    console.error("[Mail] Failed to send:", err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
