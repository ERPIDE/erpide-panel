import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

async function handle(req: Request) {
  const session = await getSession();
  session.destroy();
  const url = new URL("/", req.url);
  // 303 (See Other): varsayılan 307, POST metodunu koruyup ana sayfaya POST
  // attırıyor ve tarayıcı 405 görüyordu. 303 yönlendirmeyi GET'e çevirir.
  return NextResponse.redirect(url, 303);
}

export const POST = handle;
export const GET = handle;
