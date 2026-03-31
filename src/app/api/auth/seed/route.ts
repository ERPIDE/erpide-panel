import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { initialAdmins, initialCustomers } from "@/lib/store";

async function blobExists(key: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://${process.env.VERCEL_BLOB_STORE_ID ?? "blob"}.public.blob.vercel-storage.com/${key}`,
      { cache: "no-store" }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export async function POST() {
  try {
    const [adminsExist, customersExist] = await Promise.all([
      blobExists("data/admins.json"),
      blobExists("data/customers.json"),
    ]);

    const seeded: string[] = [];

    if (!adminsExist) {
      await put("data/admins.json", JSON.stringify(initialAdmins, null, 2), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
      });
      seeded.push("admins");
    }

    if (!customersExist) {
      await put(
        "data/customers.json",
        JSON.stringify(initialCustomers, null, 2),
        {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: false,
        }
      );
      seeded.push("customers");
    }

    if (seeded.length === 0) {
      return NextResponse.json({
        message: "Veriler zaten mevcut, seed yapılmadı",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Seed tamamlandı: ${seeded.join(", ")}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Seed sırasında hata oluştu" },
      { status: 500 }
    );
  }
}
