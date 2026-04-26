"use client";
import { motion } from "framer-motion";
import { Settings, Database, Code2, Rocket, Headset, GraduationCap, Shield, Wallet } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";

export default function HizmetlerPage() {
  const { t } = useTranslation();

  const services = [
    { icon: Settings, titleKey: "svc.canias.title", descKey: "svc.canias.desc", features: ["svc.canias.f1", "svc.canias.f2", "svc.canias.f3", "svc.canias.f4"] },
    { icon: Database, titleKey: "svc.1cerp.title", descKey: "svc.1cerp.desc", features: ["svc.1cerp.f1", "svc.1cerp.f2", "svc.1cerp.f3", "svc.1cerp.f4"] },
    { icon: Database, titleKey: "svc.1cacc.title", descKey: "svc.1cacc.desc", features: ["svc.1cacc.f1", "svc.1cacc.f2", "svc.1cacc.f3", "svc.1cacc.f4"] },
    { icon: Database, titleKey: "svc.1cdrive.title", descKey: "svc.1cdrive.desc", features: ["svc.1cdrive.f1", "svc.1cdrive.f2", "svc.1cdrive.f3", "svc.1cdrive.f4"] },
    { icon: Shield, titleKey: "svc.captcha.title", descKey: "svc.captcha.desc", features: ["svc.captcha.f1", "svc.captcha.f2", "svc.captcha.f3", "svc.captcha.f4"], link: "https://captcha.erpide.com" },
    { icon: Wallet, titleKey: "svc.erpocket.title", descKey: "svc.erpocket.desc", features: ["svc.erpocket.f1", "svc.erpocket.f2", "svc.erpocket.f3", "svc.erpocket.f4"], badge: "Coming Soon" },
    { icon: Code2, titleKey: "svc.custom.title", descKey: "svc.custom.desc", features: ["svc.custom.f1", "svc.custom.f2", "svc.custom.f3", "svc.custom.f4"] },
    { icon: Rocket, titleKey: "svc.digital.title", descKey: "svc.digital.desc", features: ["svc.digital.f1", "svc.digital.f2", "svc.digital.f3", "svc.digital.f4"] },
    { icon: Headset, titleKey: "svc.support.title", descKey: "svc.support.desc", features: ["svc.support.f1", "svc.support.f2", "svc.support.f3", "svc.support.f4"] },
    { icon: GraduationCap, titleKey: "svc.training.title", descKey: "svc.training.desc", features: ["svc.training.f1", "svc.training.f2", "svc.training.f3", "svc.training.f4"] },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">{t("services.title")}</span></h1>
            <p className="text-gray-400 max-w-2xl mx-auto">{t("services.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-8 rounded-2xl bg-[#111118] border transition group relative ${
                  s.link ? "border-blue-500/30 hover:border-blue-400/50" : "border-white/5 hover:border-blue-500/30"
                }`}
              >
                {s.badge && (
                  <span className="absolute top-6 right-6 text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    {s.badge}
                  </span>
                )}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-5">
                  <s.icon size={28} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{t(s.titleKey)}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{t(s.descKey)}</p>
                <ul className="space-y-2">
                  {s.features.map((f, j) => (
                    <li key={j} className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {t(f)}
                    </li>
                  ))}
                </ul>
                {s.link && (
                  <Link href={s.link} target="_blank" className="inline-flex items-center gap-2 mt-4 text-sm text-blue-400 hover:text-blue-300 transition">
                    Visit Panel &rarr;
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
