/**
 * GET /api/sso/finanserpide
 *
 * "FinansERPIDE'ye git" butonunun arkasi. Musteriyi erpide.com oturumuyla
 * finans.erpide.com'a tasir — urun tarafinda ikinci bir sifre YOKTUR.
 *
 * Akis:
 *   1. Panel oturumu yoksa  -> /giris'e yolla, donusunde buraya geri gel
 *   2. Oturum varsa         -> 120 sn'lik imzali token uret
 *   3. finans.erpide.com/api/auth/sso?t=... adresine yonlendir
 *
 * Lisans kontrolu KASITLI olarak burada yapilmaz: urun tarafi zaten her
 * istekte license-service'e soruyor (tek dogru kaynak orasi). Burada ikinci
 * bir kopya kural yazmak, iki yerin zamanla ayrisma riskini dogururdu.
 * Lisansi olmayan musteriyi urun tarafi /lisans sayfasina dusurur.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/auth/user-store";
import { createSsoToken } from "@/lib/sso";

export const runtime = "nodejs";

const PRODUCT_URL = process.env.FINANSERPIDE_URL || "https://finans.erpide.com";

/** Musterinin tarayicisinin gordugu adres — proxy arkasinda req.url ic adresi
 *  tasiyabilir, o durumda uretilen redirect hicbir yere gitmez. */
function publicOrigin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${req.headers.get("x-forwarded-proto") || "https"}://${host}`;
  return new URL(req.url).origin;
}

export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const url = new URL(req.url);

  // Mobil akis: uygulama tarayiciyi acti ve PKCE challenge'ini tasidi.
  // Ikisi de urun tarafina AYNEN gecirilmeli, yoksa urun bunun bir mobil
  // giris oldugunu bilemez ve kullaniciyi web dashboard'una atar.
  const mobil = url.searchParams.get("mobil") === "1";
  const challenge = url.searchParams.get("challenge") || "";

  const session = await getSession();
  if (!session.userId || !session.email) {
    // Giris sonrasi BURAYA geri donmeli — mobil bayragi ve challenge
    // kaybolursa kullanici giris yapar ama uygulamaya donemez.
    const geriYol = mobil
      ? `/api/sso/finanserpide?mobil=1&challenge=${encodeURIComponent(challenge)}`
      : "/api/sso/finanserpide";
    return NextResponse.redirect(`${origin}/giris?next=${encodeURIComponent(geriYol)}`);
  }

  if (!process.env.LICENSE_SERVICE_SECRET) {
    console.error("[sso] LICENSE_SERVICE_SECRET yok — SSO devre disi");
    return NextResponse.redirect(`${origin}/hesabim?sso_error=config`);
  }

  // Ad/soyadi kullanici kaydindan al — urun tarafi ilk kurulumda bunlarla
  // sahip kullaniciyi olusturuyor, musteri tekrar yazmasin.
  const user = await findUserByEmail(session.email).catch(() => undefined);

  const token = createSsoToken({
    email: session.email,
    name: user?.name || session.name || undefined,
    surname: user?.surname || undefined,
    phone: user?.gsmNumber || undefined,
    // Musteri panelde fatura bilgisi girdiyse urun tarafindaki sirket formu
    // hazir gelsin — ayni veriyi ikinci kez yazdirmak birakma sebebi.
    companyName: user?.companyName || undefined,
    taxNumber: user?.taxNumber || undefined,
    address: user?.address || undefined,
    city: user?.city || undefined,
  });

  const hedef = new URL(`${PRODUCT_URL}/api/auth/sso`);
  hedef.searchParams.set("t", token);
  if (mobil) {
    hedef.searchParams.set("mobil", "1");
    hedef.searchParams.set("challenge", challenge);
  }

  return NextResponse.redirect(hedef.toString(), {
    // Token tek kullanimlik ve 120 sn omurlu; ara katmanlar cache'lemesin.
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
