"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageCircle, PhoneCall, Sparkles, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Single WhatsApp Business line used everywhere — keeps the founder's
// personal number off the public site. Update in one place when the real
// company line is provisioned.
const WHATSAPP_NUMBER = "908504474237";
const wa = (msg: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;


export default function IletisimPageWrapper() {
  return (
    <Suspense fallback={null}>
      <IletisimPage />
    </Suspense>
  );
}


function IletisimPage() {
  const params = useSearchParams();
  const konuQuery = params.get("konu") || "";
  const [form, setForm] = useState({
    name: "", email: "", company: "",
    subject: konuQuery, message: "",
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSending(true);
    const r = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    setSending(false);
    if (!r || !r.ok) {
      setError("Mesaj gönderilemedi — WhatsApp üzerinden de ulaşabilirsiniz.");
      return;
    }
    setSent(true);
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">İletişim</span></h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Üç farklı kanaldan ulaşabilirsin: AI Asistan'ımızla anlık sohbet,
              WhatsApp hattımızdan mesaj veya aşağıdaki formdan e-posta gönder.
            </p>
          </motion.div>

          {/* Three primary channels — AI is the first option since it's instant + 7/24. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid md:grid-cols-3 gap-4 mb-12"
          >
            <ChannelCard
              icon={Sparkles}
              accent="purple"
              title="AI Asistan ile Sohbet"
              subtitle="7/24 anlık · Türkçe + English + Қазақша"
              desc="Ürün karşılaştırması, fiyat aralığı, kurulum süreci — AI asistan anında cevaplar. Karmaşık taleplerde ekibe yönlendirir."
              cta="Sohbeti Başlat"
              href={`#ai-chat`}
              onClick={() => { try { window.dispatchEvent(new Event("erpide:open-chat")); } catch { /* noop */ } }}
            />
            <ChannelCard
              icon={PhoneCall}
              accent="blue"
              title="AI Call Center"
              subtitle="Sesli görüşme · TR + RU"
              desc="Bir tuşa basın, AI sesli asistanımız sizi arasın. Ürün demosu, fiyat teklifi, demo randevusu — telefonla halledin."
              cta="Beni Ara"
              href={`#ai-call`}
              onClick={() => { try { window.dispatchEvent(new Event("erpide:open-voice")); } catch { /* noop */ } }}
            />
            <ChannelCard
              icon={MessageCircle}
              accent="emerald"
              title="WhatsApp Hattı"
              subtitle="Satış + Destek · Mesai içi"
              desc="Doğrudan satış ekibimize yaz, ürün/fiyat/demo talebini ilet, dosya paylaş. Mesai içinde 1 saat içinde dönüş."
              cta="Mesaj Gönder"
              href={wa(konuQuery ? `Merhaba, ${konuQuery} hakkında bilgi almak istiyorum.` : "Merhaba, ERPIDE ürünleri hakkında bilgi almak istiyorum.")}
              external
            />
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-10">
            {/* Detailed form for written inquiries / RFPs */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="p-8 rounded-2xl bg-[#111118] border border-white/5">
                <h2 className="text-xl font-semibold mb-2">Detaylı Talep / Teklif</h2>
                <p className="text-xs text-gray-500 mb-6">
                  Kurumsal talepler, çok-kullanıcılı kurulum, özel entegrasyon ihtiyaçlarınız için.
                </p>

                {sent ? (
                  <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <Sparkles size={28} className="mx-auto mb-3 text-emerald-400" />
                    <h3 className="text-emerald-300 font-semibold mb-1">Mesajın alındı</h3>
                    <p className="text-sm text-emerald-200/80">En kısa sürede mesai içinde dönüş yapacağız.</p>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <Input placeholder="Ad Soyad *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                      <Input placeholder="E-posta *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <Input placeholder="Şirket / Ünvan" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className={INPUT_CLS}
                      >
                        <option value="">Konu seç...</option>
                        <option value="1c-erp">1C:ERP — Bilgi / Demo</option>
                        <option value="1c-drive">1C:Drive — Bilgi / Demo</option>
                        <option value="finanserpide">FinansERPIDE — Demo / Fiyat</option>
                        <option value="captchaerpide">CaptchaERPIDE — Teknik soru</option>
                        <option value="custom">Özel Yazılım / Entegrasyon</option>
                        <option value="other">Diğer</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Mesajınız *"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      className={`${INPUT_CLS} mb-4 resize-none`}
                    />
                    {error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                        {error}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
                    >
                      <Send size={18} /> {sending ? "Gönderiliyor..." : "Mesaj Gönder"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Side panel: email + offices (no public phone) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-4"
            >
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <Mail size={22} className="text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">E-posta</h3>
                <a href="mailto:info@erpide.com" className="text-gray-400 text-sm hover:text-white transition block">info@erpide.com</a>
                <a href="mailto:satis@erpide.com" className="text-gray-400 text-sm hover:text-white transition block mt-1">satis@erpide.com</a>
                <a href="mailto:destek@erpide.com" className="text-gray-400 text-sm hover:text-white transition block mt-1">destek@erpide.com</a>
              </div>

              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <MapPin size={22} className="text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Türkiye Ofisi</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  ERPİDE Yazılım San. Tic. A.Ş.<br />
                  Ilıcabaşı Mah. Denizli Blv. No:91<br />
                  Efeler / Aydın<br />
                  Türkiye
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <Globe size={22} className="text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Kazakistan Ofisi</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Astana<br />
                  Қазақстан Республикасы
                </p>
              </div>

              <a
                href={wa("Merhaba, kurumsal teklif almak istiyorum.")}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 hover:border-emerald-500/60 transition"
              >
                <MessageCircle size={22} className="text-emerald-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">WhatsApp Satış Hattı</h3>
                <p className="text-xs text-gray-400 mb-2">Telefon paylaşmıyoruz — tüm görüşmeler şirket WhatsApp hattı üzerinden.</p>
                <span className="text-xs text-emerald-400 font-medium">Mesaj başlat →</span>
              </a>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}


const INPUT_CLS = "w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition";

function Input(props: {
  placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean;
}) {
  return (
    <input
      placeholder={props.placeholder}
      type={props.type || "text"}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
      required={props.required}
      className={INPUT_CLS}
    />
  );
}


function ChannelCard({
  icon: Icon, accent, title, subtitle, desc, cta, href, onClick, external,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: "purple" | "blue" | "emerald";
  title: string; subtitle: string; desc: string; cta: string;
  href: string; onClick?: () => void; external?: boolean;
}) {
  const cls: Record<string, { border: string; text: string; bg: string }> = {
    purple:  { border: "border-purple-500/30 hover:border-purple-500/60",   text: "text-purple-400",  bg: "bg-purple-500/10" },
    blue:    { border: "border-blue-500/30 hover:border-blue-500/60",       text: "text-blue-400",    bg: "bg-blue-500/10" },
    emerald: { border: "border-emerald-500/30 hover:border-emerald-500/60", text: "text-emerald-400", bg: "bg-emerald-500/10" },
  };
  const c = cls[accent];

  const inner = (
    <>
      <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
        <Icon size={22} className={c.text} />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className={`text-xs ${c.text} mb-3`}>{subtitle}</p>
      <p className="text-sm text-gray-400 leading-relaxed mb-4">{desc}</p>
      <span className={`text-sm ${c.text} font-medium`}>{cta} →</span>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`block p-6 rounded-2xl bg-[#111118] border transition ${c.border}`}>
        {inner}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left block p-6 rounded-2xl bg-[#111118] border transition w-full ${c.border}`}
    >
      {inner}
    </button>
  );
}
