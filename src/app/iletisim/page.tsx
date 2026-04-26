"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";

export default function IletisimPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">{t("contact.title")}</span></h1>
            <p className="text-gray-400">{t("contact.subtitle")}</p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="p-8 rounded-2xl bg-[#111118] border border-white/5">
                <h2 className="text-xl font-semibold mb-6">{t("contact.form.send")}</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input
                    placeholder={t("contact.form.name")}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                  />
                  <input
                    placeholder={t("contact.form.email")}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <input
                    placeholder={t("contact.form.phone")}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition"
                  />
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition"
                  >
                    <option value="">{t("contact.form.subject")}</option>
                    <option value="erp">{t("contact.form.subject.erp")}</option>
                    <option value="yazilim">{t("contact.form.subject.dev")}</option>
                    <option value="destek">{t("contact.form.subject.support")}</option>
                    <option value="diger">{t("contact.form.subject.other")}</option>
                  </select>
                </div>
                <textarea
                  placeholder={t("contact.form.message")}
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition mb-4 resize-none"
                />
                <button className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition">
                  <Send size={18} /> {t("contact.form.send")}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-4"
            >
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <Mail size={24} className="text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{t("contact.info.email")}</h3>
                <a href="mailto:info@erpide.com" className="text-gray-400 text-sm hover:text-white transition">info@erpide.com</a>
              </div>
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <Phone size={24} className="text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{t("contact.info.phone")}</h3>
                <a href="tel:05546943409" className="text-gray-400 text-sm hover:text-white transition">0554 694 34 09</a>
              </div>
              <div className="p-6 rounded-2xl bg-[#111118] border border-white/5">
                <MapPin size={24} className="text-blue-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{t("contact.info.location")}</h3>
                <p className="text-gray-400 text-sm">{t("contact.info.location.val")}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
