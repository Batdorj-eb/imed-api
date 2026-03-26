import { Router, Request, Response } from "express";
import { query } from "../db/connection.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { sendInquiryConfirmationEmail } from "../lib/mail.js";

export const inquiryRoutes = Router();

// Public: submit inquiry from website (no auth)
inquiryRoutes.post("/", async (req: Request, res: Response) => {
  const { organizationName, phone, email, productName, productId, brand, requirements, inquiryType } = req.body;
  const type: "product" | "service" | "contact" =
    inquiryType === "service" ? "service" : inquiryType === "contact" ? "contact" : "product";

  if (type === "contact") {
    if (!organizationName || !phone) {
      res.status(400).json({ error: "Нэр, утасны дугаар заавал шаардлагатай" });
      return;
    }
  } else if (!organizationName || !phone || !productName) {
    res.status(400).json({ error: "Байгуулгын нэр, утас, бүтээгдэхүүн/үйлчилгээний нэр заавал шаардлагатай" });
    return;
  }

  const resolvedProductName =
    type === "contact" ? (productName || "Вэбсайт — Холбоо барих / Contact").trim() : productName || "";

  await query(
    `INSERT INTO product_inquiries (organization_name, phone, email, product_name, product_id, brand, requirements, inquiry_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      organizationName || "",
      phone || "",
      email || "",
      resolvedProductName,
      productId ? Number(productId) : null,
      brand || "",
      requirements || "",
      type,
    ]
  );

  // Send confirmation email if user provided email
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendInquiryConfirmationEmail({
      to: email,
      organizationName: organizationName || "",
      productName: resolvedProductName,
      brand: type === "product" ? brand || undefined : undefined,
      requirements: requirements || undefined,
      isService: type === "service",
      isContact: type === "contact",
    }).catch(() => {});
  }

  const okMessage =
    type === "contact" ? "Таны хүсэлт амжилттай илгээгдлээ" : "Үнийн санал амжилттай илгээгдлээ";
  res.status(201).json({ message: okMessage });
});

// Admin only: get unread inquiries count (for sidebar badge)
inquiryRoutes.get("/count", authenticate, authorize("viewer"), async (_req: Request, res: Response) => {
  const result = await query<{ count: string }[]>(
    "SELECT COUNT(*)::text as count FROM product_inquiries WHERE is_read = FALSE"
  );
  const count = parseInt(result[0]?.count || "0", 10);
  res.json({ count });
});

// Admin only: list all inquiries (marks all as read when viewed)
inquiryRoutes.get("/", authenticate, authorize("viewer"), async (_req: Request, res: Response) => {
  const inquiries = await query<any[]>(
    "SELECT * FROM product_inquiries ORDER BY is_read ASC, created_at DESC"
  );
  await query("UPDATE product_inquiries SET is_read = TRUE WHERE is_read = FALSE");
  res.json({ inquiries });
});
