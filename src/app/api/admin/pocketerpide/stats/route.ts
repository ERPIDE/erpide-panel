/**
 * GET /api/admin/pocketerpide/stats
 * PocketERPIDE kullanıcı ve senkronizasyon istatistikleri. Sadece admin role.
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerSession, SESSION_COOKIE } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return await getOwnerSession(token);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const prisma = getPrisma();

  const [tokens, syncedData, pushTokens] = await Promise.all([
    prisma.pocketToken.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.pocketData.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.pocketPushToken.findMany({ orderBy: { lastUsedAt: "desc" } }),
  ]);

  // PocketERPIDE satın alma orderları
  const allOrders = await prisma.order.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  const pocketOrders = allOrders.filter((o) => {
    const items = o.items as Array<{ productId?: string }>;
    return items.some((item) => item.productId === "pocketerpide");
  });

  // Kullanıcı bazlı token + sync durumu
  const userIds = [...new Set([
    ...tokens.map((t) => t.userId),
    ...syncedData.map((d) => d.userId),
  ])];

  const userMap: Record<string, { tokens: number; hasSynced: boolean; lastSync: Date | null; pushDevices: number; lastTokenUsed: Date | null }> = {};
  for (const uid of userIds) {
    const userTokens = tokens.filter((t) => t.userId === uid);
    const userSync = syncedData.find((d) => d.userId === uid);
    const userPush = pushTokens.filter((p) => p.userId === uid);
    const lastUsed = userTokens.reduce<Date | null>((max, t) => {
      if (!t.lastUsedAt) return max;
      return !max || t.lastUsedAt > max ? t.lastUsedAt : max;
    }, null);
    userMap[uid] = {
      tokens: userTokens.length,
      hasSynced: !!userSync,
      lastSync: userSync?.updatedAt || null,
      pushDevices: userPush.length,
      lastTokenUsed: lastUsed,
    };
  }

  // Push token platformu dağılımı
  const platformCounts: Record<string, number> = {};
  for (const pt of pushTokens) {
    platformCounts[pt.platform] = (platformCounts[pt.platform] || 0) + 1;
  }

  // userId → hesap bilgisi (ad, e-posta). Pocket token'ları site (shop) User
  // hesabına bağlı; admin panelde "bu kullanıcı kim" sorusunu cevaplar.
  const userRecords = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, surname: true, email: true, createdAt: true },
      })
    : [];
  const paidUserIds = new Set(pocketOrders.map((o) => o.userId));

  const users = userIds
    .map((uid) => {
      const u = userRecords.find((r) => r.id === uid);
      const m = userMap[uid];
      return {
        userId: uid,
        name: u ? `${u.name} ${u.surname}`.trim() : null,
        email: u?.email ?? null,
        registeredAt: u?.createdAt ?? null,
        tokens: m.tokens,
        hasSynced: m.hasSynced,
        lastSync: m.lastSync,
        pushDevices: m.pushDevices,
        lastTokenUsed: m.lastTokenUsed,
        isPaid: paidUserIds.has(uid),
      };
    })
    .sort((a, b) => {
      const ta = a.lastTokenUsed || a.lastSync;
      const tb = b.lastTokenUsed || b.lastSync;
      return (tb ? new Date(tb).getTime() : 0) - (ta ? new Date(ta).getTime() : 0);
    });

  const stats = {
    totalTokens: tokens.length,
    uniqueUsers: userIds.length,
    syncedUsers: syncedData.length,
    pushEnabledDevices: pushTokens.length,
    platformCounts,
    paidSubscribers: pocketOrders.length,
  };

  // Son 20 senkronizasyon aktivitesi
  const recentSyncs = syncedData.slice(0, 20).map((d) => ({
    userId: d.userId,
    updatedAt: d.updatedAt,
  }));

  return NextResponse.json({ stats, users, userMap, recentSyncs, pocketOrders: pocketOrders.slice(0, 50) });
}
