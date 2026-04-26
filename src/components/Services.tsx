"use client";
import { motion } from "framer-motion";
import { Settings, Database, Code2, Rocket, Headset, GraduationCap, Globe, Smartphone, Shield, Wallet } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

export default function Services() {
  const { t } = useTranslation();

  const services = [
    { icon: Settings, titleKey: "svc.canias.title", descKey: "svc.canias.desc" },
    { icon: Database, titleKey: "svc.1cerp.title", descKey: "svc.1cerp.desc" },
    { icon: Database, titleKey: "svc.1cacc.title", descKey: "svc.1cacc.desc" },
    { icon: Database, titleKey: "svc.1cdrive.title", descKey: "svc.1cdrive.desc" },
    { icon: Shield, titleKey: "svc.captcha.title", descKey: "svc.captcha.desc", link: "https://captcha.erpide.com", highlight: true },
    { icon: Wallet, titleKey: "svc.erpocket.title", descKey: "svc.erpocket.desc", badge: "Coming Soon" },
    { icon: Code2, titleKey: "svc.custom.title", descKey: "svc.custom.desc" },
    { icon: Rocket, titleKey: "svc.digital.title", descKey: "svc.digital.desc" },
    { icon: Headset, titleKey: "svc.support.title", descKey: "svc.support.desc" },
    { icon: GraduationCap, titleKey: "svc.training.title", descKey: "svc.training.desc" },
  ];

  return (
    <section className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{t("services.title")}</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            {t("services.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => {
            const card = (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className={`p-6 rounded-2xl bg-[#111118] border transition-all duration-300 group relative ${
                  s.highlight
                    ? "border-blue-500/40 hover:border-blue-400/60 hover:glow-blue"
                    : "border-white/5 hover:border-blue-500/30 hover:glow-blue"
                }`}
              >
                {s.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    {s.badge}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-4 group-hover:from-blue-600/40 group-hover:to-purple-600/40 transition">
                  <s.icon size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{t(s.titleKey)}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{t(s.descKey)}</p>
              </motion.div>
            );

            if (s.link) {
              return (
                <Link key={i} href={s.link} target="_blank" rel="noopener noreferrer">
                  {card}
                </Link>
              );
            }
            return card;
          })}
        </div>
      </div>
    </section>
  );
}
