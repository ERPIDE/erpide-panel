"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageCircle, PhoneCall, Sparkles, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
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
      setError(t("contact.error_send"));
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
            <h1 className="text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">{t("contact.title")}</span></h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("contact.subtitle_v2")}
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
              title={t("contact.ch_ai_title")}
              subtitle={t("contact.ch_ai_subtitle")}
              desc={t("contact.ch_ai_desc")}
              cta={t("contact.ch_ai_cta")}
              href={`#ai-chat`}
              onClick={() => { try { window.dispatchEvent(new Event("erpide:open-chat")); } catch { /* noop */ } }}
            />
            <ChannelCard
              icon={PhoneCall}
              accent="blue"
              title={t("contact.ch_call_title")}
              subtitle={t("contact.ch_call_subtitle")}
              desc={t("contact.ch_call_desc")}
              cta={t("contact.ch_call_cta")}
              href={`#ai-call`}
              onClick={() => { try { window.dispatchEvent(new Event("erpide:open-voice")); } catch { /* noop */ } }}
            />
            <ChannelCard
              icon={MessageCircle}
              accent="emerald"
              title={t("contact.ch_wa_title")}
              subtitle={t("contact.ch_wa_subtitle")}
              desc={t("contact.ch_wa_desc")}
              cta={t("contact.ch_wa_cta")}
              href={wa(konuQuery
                ? t("contact.wa_msg_topic").replace("{topic}", konuQuery)
                : t("contact.wa_msg_default"))}
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
                <h2 className="text-xl font-semibold mb-2">{t("contact.form_title")}</h2>
                <p className="text-xs text-gray-500 mb-6">
                  {t("contact.form_subtitle")}
                </p>

                {sent ? (
                  <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <Sparkles size={28} className="mx-auto mb-3 text-emerald-400" />
                    <h3 className="text-emerald-300 font-semibold mb-1">{t("contact.sent_title")}</h3>
                    <p className="text-sm text-emerald-200/80">{t("contact.sent_desc")}</p>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <Input placeholder={t("contact.ph_name")} value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                      <Input placeholder={t("contact.ph_email")} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <Input placeholder={t("contact.ph_company")} value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
                      <select
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        className={INPUT_CLS}
                      >
                        <option value="">{t("contact.subject_pick")}</option>
                        <option value="1c-erp">{t("contact.subject_1cerp")}</option>
                        <option value="1c-drive">{t("contact.subject_1cdrive")}</option>
                        <option value="canias">{t("contact.subject_canias")}</option>
                        <option value="finanserpide">{t("contact.subject_fin")}</option>
                        <option value="captchaerpide">{t("contact.subject_captcha")}</option>
                        <option value="pocketerpide">{t("contact.subject_pocket")}</option>
                        <option value="witma">{t("contact.subject_witma")}</option>
                        <option value="custom">{t("contact.subject_custom")}</option>
                        <option value="other">{t("contact.subject_other")}</option>
                      </select>
                    </div>
                    <textarea
                      placeholder={t("contact.ph_message")}
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
                      <Send size={18} /> {sending ? t("contact.sending") : t("contact.send_btn")}
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
                <h3 className="font-semibold text-white mb-1">{t("contact.email_heading")}</h3>
                <a href="mailto:info@erpide.com" className="text-gray-400 text-sm hover:text-white transition block">info@erpide.com</a>
                <a href="mailto:satis@erpide.com" className="text-gray-400 text-sm hover:text-white transition block mt-1">satis@erpide.com</a>
                <a href="mailto:destek@erpide.com" className="text-gray-400 text-sm hover:text-white transition block mt-1">destek@erpide.com</a>
              </div>

              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <MapPin size={22} className="text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">{t("contact.office_tr_heading")}</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {t("contact.office_tr_body")}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <Globe size={22} className="text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">{t("contact.office_kz_heading")}</h3>
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {t("contact.office_kz_body")}
                </p>
              </div>

              <a
                href={wa(t("contact.wa_corporate_msg"))}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/30 hover:border-emerald-500/60 transition"
              >
                <MessageCircle size={22} className="text-emerald-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{t("contact.wa_panel_title")}</h3>
                <p className="text-xs text-gray-400 mb-2">{t("contact.wa_panel_desc")}</p>
                <span className="text-xs text-emerald-400 font-medium">{t("contact.wa_panel_cta")}</span>
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
