"use client";
import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

interface Props {
  orderId: string;
  initial: boolean;
  cycleLabel: string; // "ay" | "yıl"
}

export default function AutoRenewToggle({ orderId, initial, cycleLabel }: Props) {
  const [enabled, setEnabled] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setSaving(true);
    setErr(null);
    const prev = enabled;
    setEnabled(next); // optimistic
    try {
      const res = await fetch(`/api/orders/${orderId}/auto-renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
    } catch (e) {
      setEnabled(prev); // revert
      setErr(String(e instanceof Error ? e.message : e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-4 p-3 rounded-lg bg-[#0d0d14] border border-white/5">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(e) => toggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 rounded-full bg-white/10 peer-checked:bg-emerald-500/60 transition" />
          <div className={`absolute top-0.5 ${enabled ? "left-5" : "left-0.5"} w-4 h-4 rounded-full bg-white transition-all`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <RefreshCw size={13} className={enabled ? "text-emerald-400" : "text-gray-500"} />
            <p className="text-sm font-semibold text-white">Otomatik Yenileme</p>
            {saving && <Loader2 size={12} className="animate-spin text-gray-400" />}
          </div>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {enabled
              ? `Tik açıkken her ${cycleLabel} sonu kartından otomatik tahsilat alınır, lisansın kesintisiz devam eder. Yenileme başarısız olursa mail ile bilgilendirilirsin.`
              : `Pasif yaptın — süre sonunda lisans otomatik biter, API çağrıların 403 dönmeye başlar. Yenilemek için manuel "Yeniden Al" butonuna basman gerekecek.`}
          </p>
          {err && <p className="text-xs text-red-400 mt-1">Hata: {err}</p>}
        </div>
      </label>
    </div>
  );
}
