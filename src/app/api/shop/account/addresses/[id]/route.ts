import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { findUserById, updateUser, type SavedAddress } from "@/lib/auth/user-store";

export const runtime = "nodejs";

const patchSchema = z.object({
  label: z.string().min(1).max(40).optional(),
  type: z.enum(["individual", "corporate"]).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().min(1).max(30).optional(),
  identityNumber: z.string().max(11).optional(),
  companyName: z.string().max(120).optional(),
  taxNumber: z.string().max(10).optional(),
  taxOffice: z.string().max(60).optional(),
  eInvoiceUser: z.boolean().optional(),
  country: z.string().min(1).max(60).optional(),
  city: z.string().min(1).max(60).optional(),
  district: z.string().min(1).max(60).optional(),
  neighborhood: z.string().max(80).optional(),
  postalCode: z.string().max(10).optional(),
  fullAddress: z.string().min(5).max(500).optional(),
  isBillingDefault: z.boolean().optional(),
  isShippingDefault: z.boolean().optional(),
});

async function loadUserOrError(): Promise<{ ok: true; userId: string } | { ok: false; res: NextResponse }> {
  const session = await getSession();
  if (!session.userId) return { ok: false, res: NextResponse.json({ error: "Giriş yapın" }, { status: 401 }) };
  const user = await findUserById(session.userId);
  if (!user) return { ok: false, res: NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 }) };
  return { ok: true, userId: user.id };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await loadUserOrError();
  if (!auth.ok) return auth.res;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const user = await findUserById(auth.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });
  const list = [...(user.savedAddresses || [])];
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 });

  const now = new Date().toISOString();
  const merged: SavedAddress = { ...list[idx], ...parsed.data, id, updatedAt: now } as SavedAddress;

  // Validate type-specific required fields after merge
  if (merged.type === "individual") {
    if (!merged.identityNumber || merged.identityNumber.length !== 11) {
      return NextResponse.json({ error: "Bireysel adres için 11 haneli TC kimlik no zorunlu" }, { status: 400 });
    }
  } else {
    if (!merged.companyName) return NextResponse.json({ error: "Şirket ünvanı zorunlu" }, { status: 400 });
    if (!merged.taxNumber) return NextResponse.json({ error: "Vergi numarası zorunlu" }, { status: 400 });
    if (!merged.taxOffice) return NextResponse.json({ error: "Vergi dairesi zorunlu" }, { status: 400 });
  }

  if (parsed.data.isBillingDefault === true) {
    for (let i = 0; i < list.length; i++) if (i !== idx) list[i].isBillingDefault = false;
  }
  if (parsed.data.isShippingDefault === true) {
    for (let i = 0; i < list.length; i++) if (i !== idx) list[i].isShippingDefault = false;
  }
  list[idx] = merged;
  await updateUser(user.id, { savedAddresses: list });
  return NextResponse.json({ ok: true, address: merged });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await loadUserOrError();
  if (!auth.ok) return auth.res;

  const user = await findUserById(auth.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });
  const list = user.savedAddresses || [];
  const filtered = list.filter((a) => a.id !== id);
  if (filtered.length === list.length) return NextResponse.json({ error: "Adres bulunamadı" }, { status: 404 });

  // If we removed a default, promote the first remaining to default
  const removed = list.find((a) => a.id === id);
  if (filtered.length > 0 && removed) {
    if (removed.isBillingDefault && !filtered.some((a) => a.isBillingDefault)) filtered[0].isBillingDefault = true;
    if (removed.isShippingDefault && !filtered.some((a) => a.isShippingDefault)) filtered[0].isShippingDefault = true;
  }
  await updateUser(user.id, { savedAddresses: filtered });
  return NextResponse.json({ ok: true });
}
