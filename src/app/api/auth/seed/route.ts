import { NextResponse } from "next/server";
import { getAdmins, saveAdmins, getCustomers, saveCustomers } from "@/lib/auth";
import { initialAdmins, initialCustomers } from "@/lib/store";

// All admin users that should exist
const allAdmins = [
  ...initialAdmins,
  { id: "a2", name: "berkay.yasar", email: "berkayyasar0@gmail.com", password: "berkay2024", role: "developer" as const },
  { id: "a3", name: "mustafa.el", email: "m.el@erpide.com", password: "mustafa2024", role: "developer" as const },
  { id: "a4", name: "dilyar.yussupov", email: "yusupovdilyar@gmail.com", password: "dilyar2024", role: "developer" as const },
];

export async function POST() {
  try {
    // Write all admins (merge with existing, don't duplicate)
    const existing = await getAdmins();
    const merged = [...allAdmins];
    for (const e of existing) {
      if (!merged.find(a => a.email === e.email)) {
        merged.push(e);
      }
    }
    await saveAdmins(merged);

    // Write customers if empty
    const customers = await getCustomers();
    if (customers.length <= 2) {
      await saveCustomers(initialCustomers);
    }

    return NextResponse.json({
      success: true,
      message: `Seed tamamlandi: ${merged.length} admin, ${customers.length} musteri`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Seed hatasi", detail: String(e) },
      { status: 500 }
    );
  }
}
