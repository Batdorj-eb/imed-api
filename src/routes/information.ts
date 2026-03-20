import { Router, Request, Response } from "express";
import { query } from "../db/connection.js";
import { authenticate, authorize } from "../middleware/auth.js";

export const informationRoutes = Router();

informationRoutes.get("/", async (_req: Request, res: Response) => {
  const items = await query<any[]>(
    "SELECT * FROM information_items ORDER BY id ASC"
  );
  res.json({ items });
});

informationRoutes.post("/", authenticate, authorize("editor"), async (req: Request, res: Response) => {
  const { image, title_mn, title_en, description_mn, description_en, sort_order } = req.body;

  const result = await query(
    `INSERT INTO information_items (image, title_mn, title_en, description_mn, description_en, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [image || "", title_mn || "", title_en || "", description_mn || "", description_en || "", sort_order ?? 0]
  );

  res.status(201).json({ id: result[0].id, message: "Мэдээлэл нэмэгдлээ" });
});

informationRoutes.put("/:id", authenticate, authorize("editor"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { image, title_mn, title_en, description_mn, description_en, sort_order } = req.body;

  const existing = await query<any[]>("SELECT id FROM information_items WHERE id = $1", [id]);
  if (!existing[0]) {
    res.status(404).json({ error: "Мэдээлэл олдсонгүй" });
    return;
  }

  await query(
    `UPDATE information_items SET image = $1, title_mn = $2, title_en = $3, description_mn = $4, description_en = $5, sort_order = $6 WHERE id = $7`,
    [image || "", title_mn || "", title_en || "", description_mn || "", description_en || "", sort_order ?? 0, id]
  );

  res.json({ message: "Мэдээлэл шинэчлэгдлээ" });
});

informationRoutes.delete("/:id", authenticate, authorize("editor"), async (req: Request, res: Response) => {
  const existing = await query<any[]>("SELECT id FROM information_items WHERE id = $1", [req.params.id]);
  if (!existing[0]) {
    res.status(404).json({ error: "Мэдээлэл олдсонгүй" });
    return;
  }

  await query("DELETE FROM information_items WHERE id = $1", [req.params.id]);
  res.json({ message: "Мэдээлэл устгагдлаа" });
});
