import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signToken } from "../auth/token.js";
import { createUser, findUserByEmail } from "../store.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(120),
  role: z.enum(["organizer", "player"]),
});

router.post("/register", (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, password, displayName, role } = parsed.data;
  if (findUserByEmail(email)) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = createUser({ email, passwordHash, displayName, role });
  const token = signToken({ sub: user.id, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = findUserByEmail(parsed.data.email);
  if (!user || !bcrypt.compareSync(parsed.data.password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ sub: user.id, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
  });
});

export default router;
