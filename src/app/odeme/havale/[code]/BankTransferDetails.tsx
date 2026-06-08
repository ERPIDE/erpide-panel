"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Banknote, Copy, Check, AlertTriangle, Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import type { BankTransferRequest } from "@/lib/auth/user-store";

export default function BankTransferDetails({ req }: { req: BankTransferRequest }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const ibanClean = req.ibanUsed.replace(/\s/g, "");
  const expiresAt = new Date(req.expiresAt);
  const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000));

  if (req.status === "APPROVED") {
    return (
      <div className="text-center">
        <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Ödemen Onaylandı ✓</h1>
        <p className="text-gray-400 mb-6">Lisansın aktif edildi. Hesabımdan kullanmaya başlayabilirsin.</p>
        <Link href="/hesabim" className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-semibold">
          Hesabımı Aç →
        </Link>
      </div>
    );
  }

  if (req.status === "REJECTED") {
    return (
      <div className="text-center">
        <XCircle size={48} className="mx-auto text-red-400 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Havale Reddedildi</h1>
        <p className="text-gray-400 mb-2">Sebep: {req.rejectionReason || "Açıklama yok"}</p>
        <p className="text-xs text-gray-500 mb-6">Sorun varsa info@erpide.com'a yazın.</p>
        <Link href="/urunler" className="text-blue-400 hover:underline">Tekrar dene →</Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link href="/sepet/odeme" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
        <ArrowLeft size={14} /> Ödeme adımına dön
      </Link>

      <div className="text-center mb-8">
        <Banknote size={40} className="mx-auto text-blue-400 mb-3" />
        <h1 className="text-3xl font-bold mb-2"><span className="gradient-text">Havale ile Ödeme</span></h1>
        <p className="text-gray-400 text-sm">
          Aşağıdaki tutarı IBAN&apos;a transfer et. <strong className="text-yellow-300">Açıklamaya kodunu yaz</strong>; biz banka hesabına bakıp eşleştirince lisansını aktif ederiz.
        </p>
      </div>

      {/* Süre + Status */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <Clock size={18} className="text-amber-400" />
          <div>
            <p className="text-xs text-amber-300/70 uppercase">Geçerlilik</p>
            <p className="text-sm text-white font-semibold">{daysLeft} gün kaldı</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
          <Clock size={18} className="text-blue-400" />
          <div>
            <p className="text-xs text-blue-300/70 uppercase">Onay Süresi</p>
            <p className="text-sm text-white font-semibold">1-2 iş günü</p>
          </div>
        </div>
      </div>

      {/* Ana ödeme kartı */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/30 mb-6 space-y-4">
        <Row label="Hesap Sahibi" value={req.ibanHolder} onCopy={() => copy(req.ibanHolder, "holder")} copied={copied === "holder"} />
        <Row label="IBAN" value={req.ibanUsed} onCopy={() => copy(ibanClean, "iban")} copied={copied === "iban"} mono />
        <Row
          label="Açıklama (ZORUNLU)"
          value={req.code}
          onCopy={() => copy(req.code, "code")}
          copied={copied === "code"}
          highlight
          mono
        />
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-400">Transfer Edilecek Tutar</span>
            <div className="text-right">
              <p className="text-3xl font-bold text-white font-mono">
                {req.amountTRY.toLocaleString("tr-TR")} <span className="text-lg text-gray-400">TL</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {req.amountUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD · TCMB {req.fxRate.toFixed(4)} ({req.fxRateDate})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sipariş içeriği */}
      <div className="p-4 rounded-xl bg-[#111118] border border-white/5 mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sipariş İçeriği</p>
        <ul className="text-sm text-gray-300 space-y-1">
          {(req.skuNames || []).map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      </div>

      {/* Uyarı kutusu */}
      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
        <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-yellow-100/90 leading-relaxed space-y-1">
          <p><strong className="text-yellow-300">Önemli:</strong></p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Açıklamaya mutlaka <strong className="font-mono text-yellow-200">{req.code}</strong> yaz — bu olmadan eşleştirme yapamayız.</li>
            <li>Tutarı tam olarak <strong>{req.amountTRY.toLocaleString("tr-TR")} TL</strong> gönder. Eksik gönderim onaylanmaz.</li>
            <li>Onay sonrası ürün hesabımda otomatik aktif olur, ayrıca mail atılır.</li>
            <li>7 gün içinde transfer yapılmazsa istek otomatik iptal olur.</li>
          </ul>
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-6">
        Sorun mu var? <a href="mailto:info@erpide.com" className="text-blue-400 hover:underline">info@erpide.com</a>
      </p>
    </motion.div>
  );
}

function Row({ label, value, onCopy, copied, mono, highlight }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-xl ${highlight ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-black/30 border border-white/5"}`}>
      <p className={`text-[10px] uppercase tracking-wider mb-1.5 ${highlight ? "text-yellow-300" : "text-gray-500"}`}>{label}</p>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm flex-1 break-all ${mono ? "font-mono" : ""} ${highlight ? "text-yellow-100 font-bold text-base" : "text-white"}`}>
          {value}
        </p>
        <button
          onClick={onCopy}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition ${
            copied ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-gray-300 hover:bg-white/10"
          }`}
        >
          {copied ? <><Check size={12} /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
        </button>
      </div>
    </div>
  );
}
