"use client";
import { motion } from "framer-motion";
import { Target, Shield, Lightbulb, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "@/lib/i18n";

export default function HakkimizdaPage() {
  const { t } = useTranslation();

  const values = [
    { icon: Target, titleKey: "about.val1.title", descKey: "about.val1.desc" },
    { icon: Shield, titleKey: "about.val2.title", descKey: "about.val2.desc" },
    { icon: Lightbulb, titleKey: "about.val3.title", descKey: "about.val3.desc" },
    { icon: Users, titleKey: "about.val4.title", descKey: "about.val4.desc" },
  ];

  const team = [
    { nameKey: "about.team1.name", roleKey: "about.team1.role", descKey: "about.team1.desc" },
    { nameKey: "about.team2.name", roleKey: "about.team2.role", descKey: "about.team2.desc" },
    { nameKey: "about.team3.name", roleKey: "about.team3.role", descKey: "about.team3.desc" },
    { nameKey: "about.team4.name", roleKey: "about.team4.role", descKey: "about.team4.desc" },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">{t("about.title")}</span></h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-3xl mx-auto text-center mb-20"
          >
            <p className="text-lg text-gray-300 leading-relaxed">{t("about.story")}</p>
          </motion.div>

          <div className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("about.values.title")}</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {values.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="p-6 rounded-2xl bg-[#111118] border border-white/5 text-center hover:border-blue-500/30 transition"
                >
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-4">
                    <v.icon size={24} className="text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{t(v.titleKey)}</h3>
                  <p className="text-gray-400 text-sm">{t(v.descKey)}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t("about.team.title")}</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {team.map((tm, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="p-6 rounded-2xl bg-[#111118] border border-white/5 text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 text-white font-bold text-lg">
                    {t(tm.nameKey).split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <h3 className="font-semibold text-white">{t(tm.nameKey)}</h3>
                  <p className="text-blue-400 text-sm mb-2">{t(tm.roleKey)}</p>
                  <p className="text-gray-400 text-sm">{t(tm.descKey)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
