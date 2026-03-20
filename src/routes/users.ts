import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db/connection.js";
import { authenticate, authorize } from "../middleware/auth.js";
import type { User } from "../types/index.js";

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.use(authorize("admin"));

userRoutes.get("/", async (_req: Request, res: Response) => {
  const users = await query<User[]>(
    "SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC"
  );
  res.json({ users });
});

userRoutes.get("/:id", async (req: Request, res: Response) => {
  const users = await query<User[]>(
    "SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1",
    [req.params.id]
  );

  if (!users[0]) {
    res.status(404).json({ error: "Хэрэглэгч олдсонгүй" });
    return;
  }

  res.json({ user: users[0] });
});

userRoutes.post("/", async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Бүх талбарыг бөглөнө үү" });
    return;
  }

  const existing = await query<User[]>("SELECT id FROM users WHERE email = $1", [email]);
  if (existing[0]) {
    res.status(409).json({ error: "Энэ имэйлтэй хэрэглэгч бүртгэлтэй байна" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id",
    [name, email, hashedPassword, role || "viewer"]
  );

  res.status(201).json({ id: result[0].id, message: "Хэрэглэгч амжилттай үүсгэлээ" });
});

userRoutes.put("/:id", async (req: Request, res: Response) => {
  const { name, email, password, role, is_active } = req.body;

  const users = await query<User[]>("SELECT id FROM users WHERE id = $1", [req.params.id]);
  if (!users[0]) {
    res.status(404).json({ error: "Хэрэглэгч олдсонгүй" });
    return;
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      "UPDATE users SET name = $1, email = $2, password = $3, role = $4, is_active = $5 WHERE id = $6",
      [name, email, hashedPassword, role, is_active ?? true, req.params.id]
    );
  } else {
    await query(
      "UPDATE users SET name = $1, email = $2, role = $3, is_active = $4 WHERE id = $5",
      [name, email, role, is_active ?? true, req.params.id]
    );
  }

  res.json({ message: "Хэрэглэгч амжилттай шинэчлэгдлээ" });
});

userRoutes.delete("/:id", async (req: Request, res: Response) => {
  if (Number(req.params.id) === req.user!.id) {
    res.status(400).json({ error: "Өөрийн бүртгэлийг устгах боломжгүй" });
    return;
  }

  await query("DELETE FROM users WHERE id = $1", [req.params.id]);
  res.json({ message: "Хэрэглэгч устгагдлаа" });
});
