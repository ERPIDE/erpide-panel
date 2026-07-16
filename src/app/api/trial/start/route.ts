import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 3 günlük ücretsiz deneme sistemi 2026-07'de kaldırıldı. Ürünler artık
// yalnızca satın alma ile alınıyor. Bu endpoint eski istemciler / doğrudan
// çağrılar için 410 Gone döndürür; yeni trial oluşturmaz.
export async function POST() {
  return NextResponse.json(
    { error: "Ücretsiz deneme sistemi kaldırıldı. Ürünleri satın alarak kullanabilirsiniz." },
    { status: 410 }
  );
}
