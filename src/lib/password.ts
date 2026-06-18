/**
 * Admin/Customer şifre helper'ları.
 *
 * Eskiden Admin ve Customer tablolarında parolalar plaintext duruyordu
 * (initialAdmins seed'inden geliyordu). Migration sırasında DB'deki tüm
 * plaintext kayıtları bcrypt'le hash'liyoruz; ama eski hesabı olan biri
 * giriş yaparken (henüz hash'lenmediyse), legacy fallback olarak düz
 * karşılaştırma da kabul ediyoruz. Hashlenmemiş kayıt başarılı login
 * yaparsa, login route'u kayıt eden tabloya hashlenmişini yazıyor.
 *
 * Shop User tablosu (User model) ZATEN bcrypt — burası onunla karışmasın.
 */
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/** Bcrypt ile hash'lenmiş bir string mi (legacy plaintext'i ayırmak için). */
export function looksHashed(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^\$2[abxy]\$\d{2}\$/.test(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Hash ya da legacy plaintext'i kontrol eder. Geri kabul edilen biçim:
 *  - bcrypt hash: `bcrypt.compare`
 *  - plaintext (legacy): direkt `===` — sadece geçiş döneminde, yeni
 *    plaintext oluşmasına izin VERMİYORUZ (write yolları hep hash'liyor).
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (looksHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
}
