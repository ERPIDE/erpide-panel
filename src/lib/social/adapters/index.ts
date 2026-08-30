/**
 * Adapter kaydı — platform anahtarından yayın/doğrulama fonksiyonlarına.
 *
 * "site" burada yok: Gündem yayını dış API çağırmaz, post'un kendi kaydını
 * yayına almaktan ibarettir (publish.ts içinde ele alınır).
 */
import { facebookAdapter, verifyFacebook } from "./facebook";
import { instagramAdapter, verifyInstagram } from "./instagram";
import { linkedinAdapter, verifyLinkedIn } from "./linkedin";
import type { ExternalPlatform, ResolvedCredentials, SocialAdapter } from "../types";

export const ADAPTERS: Record<ExternalPlatform, SocialAdapter> = {
  facebook: facebookAdapter,
  instagram: instagramAdapter,
  linkedin: linkedinAdapter,
};

type Verifier = (creds: ResolvedCredentials) => Promise<{ id: string; name: string }>;

export const VERIFIERS: Record<ExternalPlatform, Verifier> = {
  facebook: async (c) => verifyFacebook(c),
  instagram: async (c) => {
    const r = await verifyInstagram(c);
    return { id: r.id, name: `@${r.username}` };
  },
  linkedin: async (c) => verifyLinkedIn(c),
};

export { facebookAdapter, instagramAdapter, linkedinAdapter };
