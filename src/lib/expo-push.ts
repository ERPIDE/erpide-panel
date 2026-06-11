/**
 * Expo Push API client — batch send notification yardımcısı.
 *
 * API ref: https://docs.expo.dev/push-notifications/sending-notifications/
 *
 * Tek seferde 100'e kadar notification gönderebiliriz. Cron 1000+ kullanıcıya
 * mesaj atacaksa batch'leyip Promise.all ile paralel atıyoruz.
 *
 * Response: ticket array — her notification için ya status:"ok" + id, ya da
 * status:"error" + details. "DeviceNotRegistered" hatası → token'ı temizlemeli;
 * cron katmanında bu hata yakalanırsa unregisterPushToken çağrılır.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface ExpoPushMessage {
  to: string;            // ExponentPushToken[...]
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;    // Android
  priority?: "default" | "normal" | "high";
  ttl?: number;          // saniye
}

export interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string; expoPushToken?: string };
}

export interface ExpoPushResponse {
  data: ExpoPushTicket[];
  errors?: Array<{ code: string; message: string }>;
}

/**
 * Tek batch (≤100) push gönder. Hata atmaz — başarısız ticket'ları response'ta
 * döner ve çağıran kod karar verir.
 */
export async function sendPushBatch(
  messages: ExpoPushMessage[],
): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  if (messages.length > 100) {
    throw new Error(`Expo push API batch limit 100; ${messages.length} verildi`);
  }

  const res = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    return messages.map(() => ({ status: "error" as const, message: `HTTP ${res.status}` }));
  }

  try {
    const json = (await res.json()) as ExpoPushResponse;
    return json.data ?? [];
  } catch {
    return messages.map(() => ({ status: "error" as const, message: "Invalid JSON from Expo" }));
  }
}

/**
 * Çoklu batch — N>100 olduğunda otomatik chunk'lar.
 */
export async function sendPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  const chunks: ExpoPushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }
  const all = await Promise.all(chunks.map((c) => sendPushBatch(c)));
  return all.flat();
}

/**
 * DeviceNotRegistered → token geçersiz. Çağıran cron bu ticket'ları yakalayıp
 * unregisterPushToken çağırmalı.
 */
export function isTokenInvalidTicket(ticket: ExpoPushTicket): boolean {
  return (
    ticket.status === "error" &&
    (ticket.details?.error === "DeviceNotRegistered" ||
      ticket.details?.error === "InvalidCredentials")
  );
}
