import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import type { JwtPayload, Role } from "../types/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Нэвтрэх шаардлагатай" });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token хүчингүй байна" });
  }
}

const roleHierarchy: Record<Role, number> = { admin: 3, editor: 2, viewer: 1 };

export function authorize(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Нэвтрэх шаардлагатай" });
      return;
    }

    if (roleHierarchy[req.user.role] < roleHierarchy[minRole]) {
      res.status(403).json({ error: "Эрх хүрэлцэхгүй байна" });
      return;
    }

    next();
  };
}
