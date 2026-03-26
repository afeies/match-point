import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-change-in-production";

export interface JwtPayload {
  sub: string;
  role: "organizer" | "player";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token");
  }
  const sub = (decoded as { sub?: string }).sub;
  const role = (decoded as { role?: string }).role;
  if (typeof sub !== "string" || (role !== "organizer" && role !== "player")) {
    throw new Error("Invalid token payload");
  }
  return { sub, role };
}
