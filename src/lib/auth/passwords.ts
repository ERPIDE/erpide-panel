import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return "Şifre en az 8 karakter olmalı";
  if (password.length > 128) return "Şifre çok uzun";
  if (!/[A-Za-z]/.test(password)) return "Şifre en az 1 harf içermeli";
  if (!/[0-9]/.test(password)) return "Şifre en az 1 rakam içermeli";
  return null;
}
