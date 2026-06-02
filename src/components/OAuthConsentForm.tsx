"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export default function OAuthConsentForm({ email, firstName, lastName, avatarUrl }: Props) {
  const router = useRouter();
  const [consents, setConsents] = useState({ terms: false, kvkk: false, marketing: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!consents.terms) { setError("Kullanım Koşulları ve Gizlilik Politikası onayı zorunludur"); return; }
    if (!consents.kvkk) { setError("KVKK Aydınlatma Metni onayı zorunludur"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/shop/auth/oauth/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acceptTerms: consents.terms,
          acceptKvkk: consents.kvkk,
          marketingConsent: consents.marketing,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hesap oluşturulamadı");
        setLoading(false);
        return;
      }
      router.push("/hesabim");
    } catch (e) {
      setError("Bağlantı hatası: " + String(e));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#111118] border border-white/5 space-y-5">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{firstName} {lastName}</p>
          <p className="text-xs text-gray-400 truncate">{email}</p>
        </div>
        <ShieldCheck size={16} className="text-green-400 flex-shrink-0" />
      </div>

      <div className="space-y-2.5">
        <ConsentCheckbox
          checked={consents.terms}
          onChange={(v) => setConsents({ ...consents, terms: v })}
          required
        >
          <Link href="/sozlesmeler/kullanim-kosullari" target="_blank" className="text-blue-400 hover:underline">Kullanım Koşulları</Link> ve{" "}
          <Link href="/sozlesmeler/gizlilik-politikasi" target="_blank" className="text-blue-400 hover:underline">Gizlilik Politikası</Link>'nı okudum, kabul ediyorum.
        </ConsentCheckbox>
        <ConsentCheckbox
          checked={consents.kvkk}
          onChange={(v) => setConsents({ ...consents, kvkk: v })}
          required
        >
          <Link href="/sozlesmeler/kvkk" target="_blank" className="text-blue-400 hover:underline">KVKK Aydınlatma Metni</Link>'ni okudum, kişisel verilerimin işlenmesini kabul ediyorum.
        </ConsentCheckbox>
        <ConsentCheckbox
          checked={consents.marketing}
          onChange={(v) => setConsents({ ...consents, marketing: v })}
        >
          <span className="text-gray-400">(İsteğe bağlı)</span> Ticari elektronik ileti almak istiyorum.
        </ConsentCheckbox>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {loading ? "Hesap oluşturuluyor..." : "Onayla ve Devam Et"}
      </button>

      <p className="text-[11px] text-gray-500 text-center pt-2">
        Google üzerinden gelen e-posta adresin zaten doğrulanmış olduğu için ayrıca doğrulama maili gönderilmez.
      </p>
    </form>
  );
}

function ConsentCheckbox({ checked, onChange, required, children }: { checked: boolean; onChange: (v: boolean) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-black/50 text-blue-500 focus:ring-blue-500 cursor-pointer flex-shrink-0"
      />
      <span className="text-xs text-gray-300 leading-relaxed group-hover:text-white transition">
        {required && <span className="text-red-400 mr-1">*</span>}
        {children}
      </span>
    </label>
  );
}
