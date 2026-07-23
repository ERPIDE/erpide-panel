/**
 * /api/projects — Proje CRUD.
 *
 * Proje = task'ların yaşadığı GitHub repo'su + sahibi müşteri. Sistemdeki tüm
 * proje dropdown'ları (task oluşturma, task filtreleri, müşteri formları)
 * buradan beslenir; hardcoded repoMap/clientMap yerine tek kaynak.
 *
 * GET   → giriş yapmış her admin: proje listesi (müşteri bilgisiyle).
 * POST  → yalnız elevated (role=admin): yeni proje. GitHub repo'su yoksa
 *         ERPIDE org'unda private repo olarak açmayı dener.
 * DELETE→ yalnız elevated: projeyi DB'den kaldırır (GitHub repo'suna dokunmaz).
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, getElevatedSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const ORG = "ERPIDE";

async function sessionToken() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function GET() {
  const session = await getSession((await sessionToken()) || "");
  if (!session || session.userType !== "admin") {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const projects = await getPrisma().project.findMany({
    include: { customer: { select: { id: true, code: true, name: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const token = await sessionToken();
  const elevated = await getElevatedSession(token);

  // Müşteri yöneticisi (role=yonetici) kendi firmasına proje açabilir —
  // panel "Yeni Proje" butonu buradan geçer; proje merkezi kataloğa düşer.
  let forcedCustomerId: string | null = null;
  if (!elevated) {
    const session = await getSession(token || "");
    if (session?.userType === "customer" && session.userRole === "yonetici" && session.customerCode) {
      const cust = await getPrisma().customer.findUnique({ where: { code: session.customerCode } });
      if (!cust) return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });
      forcedCustomerId = cust.id;
    } else {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => null);
  const name: string = (body?.name || "").trim();
  const customerId: string | null = forcedCustomerId ?? (body?.customerId || null);
  // Repo adı verilmezse proje adından türet: "Logo Entegrasyon" → erpide-logo-entegrasyon
  const repo: string = (body?.repo || "").trim() ||
    "erpide-" + name.toLowerCase()
      .replace(/[çğıöşü]/g, (c: string) => ({ ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" }[c] || c))
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  if (!name) return NextResponse.json({ error: "Proje adı gerekli" }, { status: 400 });
  if (!repo || repo === "erpide-") {
    return NextResponse.json({ error: "Geçerli bir repo adı üretilemedi" }, { status: 400 });
  }

  const prisma = getPrisma();
  const dup = await prisma.project.findFirst({ where: { OR: [{ name }, { repo }] } });
  if (dup) {
    return NextResponse.json({ error: `Bu ad veya repo zaten kayıtlı: ${dup.name}` }, { status: 409 });
  }
  if (customerId) {
    const c = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!c) return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });
  }

  // GitHub repo yoksa aç — task'lar issue olarak orada yaşayacak.
  if (GITHUB_TOKEN) {
    const check = await fetch(`https://api.github.com/repos/${ORG}/${repo}`, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
    });
    if (check.status === 404) {
      const created = await fetch(`https://api.github.com/orgs/${ORG}/repos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: repo,
          private: true,
          has_issues: true,
          description: `ERPIDE proje takibi — ${name}`,
          auto_init: true,
        }),
      });
      if (!created.ok) {
        const err = await created.json().catch(() => ({}));
        return NextResponse.json(
          {
            error:
              `GitHub repo '${ORG}/${repo}' oluşturulamadı (${created.status}): ` +
              `${err.message || "bilinmeyen hata"}. Repo'yu GitHub'da elle açıp tekrar deneyin ` +
              `veya mevcut bir repo adı girin.`,
          },
          { status: 502 },
        );
      }
    } else if (!check.ok) {
      return NextResponse.json(
        { error: `GitHub repo kontrolü başarısız (${check.status}) — token yetkisini kontrol edin` },
        { status: 502 },
      );
    }
  }

  const project = await prisma.project.create({
    data: { id: randomUUID(), name, repo, customerId },
    include: { customer: { select: { id: true, code: true, name: true } } },
  });
  return NextResponse.json({ project });
}

export async function DELETE(req: NextRequest) {
  const session = await getElevatedSession(await sessionToken());
  if (!session) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  await getPrisma().project.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
