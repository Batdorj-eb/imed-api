import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/connection.js";
import { config } from "../config/index.js";
import { authenticate } from "../middleware/auth.js";
import type { User } from "../types/index.js";

export const authRoutes = Router();

authRoutes.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Имэйл болон нууц үг шаардлагатай" });
    return;
  }

  const users = await query<User[]>("SELECT * FROM users WHERE email = $1", [email]);
  const user = users[0];

  if (!user || !user.is_active) {
    res.status(401).json({ error: "Имэйл эсвэл нууц үг буруу байна" });
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    res.status(401).json({ error: "Имэйл эсвэл нууц үг буруу байна" });
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

authRoutes.get("/me", authenticate, async (req: Request, res: Response) => {
  const users = await query<User[]>("SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1", [req.user!.id]);
  const user = users[0];

  if (!user) {
    res.status(404).json({ error: "Хэрэглэгч олдсонгүй" });
    return;
  }

  res.json({ user });
});
