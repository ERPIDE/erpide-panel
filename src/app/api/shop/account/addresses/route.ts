import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/auth/session";
import { findUserById, updateUser, type SavedAddress } from "@/lib/auth/user-store";

export const runtime = "nodejs";

const addressSchema = z.object({
  label: z.string().min(1).max(40),
  type: z.enum(["individual", "corporate"]),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().min(1).max(30),
  identityNumber: z.string().max(11).optional(),
  companyName: z.string().max(120).optional(),
  taxNumber: z.string().max(10).optional(),
  taxOffice: z.string().max(60).optional(),
  eInvoiceUser: z.boolean().optional(),
  country: z.string().min(1).max(60).default("Türkiye"),
  city: z.string().min(1).max(60),
  district: z.string().min(1).max(60),
  neighborhood: z.string().max(80).optional(),
  postalCode: z.string().max(10).optional(),
  fullAddress: z.string().min(5).max(500),
  isBillingDefault: z.boolean().optional(),
  isShippingDefault: z.boolean().optional(),
});

function validateByType(input: z.infer<typeof addressSchema>): string | null {
  if (input.type === "individual") {
    if (!input.identityNumber || input.identityNumber.length !== 11) {
      return "Bireysel adres için 11 haneli TC kimlik no zorunlu";
    }
  } else {
    if (!input.companyName) return "Kurumsal adres için şirket ünvanı zorunlu";
    if (!input.taxNumber) return "Kurumsal adres için vergi numarası zorunlu";
    if (!input.taxOffice) return "Kurumsal adres için vergi dairesi zorunlu";
  }
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });
  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });
  return NextResponse.json({ addresses: user.savedAddresses || [] });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Giriş yapın" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 }); }
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const typeErr = validateByType(parsed.data);
  if (typeErr) return NextResponse.json({ error: typeErr }, { status: 400 });

  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ error: "Kullanıcı yok" }, { status: 404 });

  const now = new Date().toISOString();
  const newAddress: SavedAddress = {
    id: randomUUID(),
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  };

  const list = [...(user.savedAddresses || [])];

  // If this is the first address, default to both billing+shipping
  if (list.length === 0) {
    newAddress.isBillingDefault = true;
    newAddress.isShippingDefault = true;
  } else {
    if (newAddress.isBillingDefault) {
      for (const a of list) a.isBillingDefault = false;
    }
    if (newAddress.isShippingDefault) {
      for (const a of list) a.isShippingDefault = false;
    }
  }

  list.push(newAddress);
  await updateUser(user.id, { savedAddresses: list });
  return NextResponse.json({ ok: true, address: newAddress });
}
