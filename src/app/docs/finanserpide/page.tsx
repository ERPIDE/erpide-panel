import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Briefcase, Globe, Zap, MessageSquare, Clock } from "lucide-react";

export const metadata = {
  title: "FinansERPIDE Kılavuzu | ERPIDE",
  description: "FinansERPIDE multi-tenant ERP SaaS — tarayıcıdan ilk kullanım kılavuzu.",
};

export default function FinansDocsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-20 px-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
            <ArrowLeft size={14} /> Dökümantasyon
          </Link>

          <header className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                <Briefcase size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold"><span className="gradient-text">FinansERPIDE Kılavuzu</span></h1>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">BETA</span>
                </div>
                <p className="text-gray-400 text-sm">Multi-tenant AI destekli ERP SaaS — tarayıcı tabanlı, kurulum yok.</p>
              </div>
            </div>
          </header>

          <div className="mb-8 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
            <Clock className="text-amber-400 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-semibold text-amber-200 mb-1">Beta — sınırlı erişim</p>
              <p className="text-xs text-gray-400">
                FinansERPIDE şu an erken beta aşamasında. e-Fatura (eFinans), QNB banka mutabakatı ve AI asistan modülleri kademeli açılıyor.
                Trial veya satın alma sonrası <strong>finans.erpide.com</strong>'da hesabın için bir tenant oluşturulur ve sana erişim mail'i gönderilir.
              </p>
            </div>
          </div>

          <Section icon={Zap} title="Hızlı Başlangıç">
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300 marker:text-blue-400">
              <li>ERPIDE hesabınla <Link href="/giris" className="text-blue-400 hover:underline">giriş yap</Link>, e-postanı doğrula.</li>
              <li><Link href="/urunler/finanserpide" className="text-blue-400 hover:underline">FinansERPIDE</Link> sayfasından plan seç → trial başlat veya satın al.</li>
              <li>Şirket bilgilerini (VKN, ünvan) <Link href="/hesabim/profil" className="text-blue-400 hover:underline">profilinden</Link> tamamla.</li>
              <li>Hesabın için tenant DB hazırlanır (~5-30 dk), aktif olunca <strong>finans.erpide.com</strong> erişim mailini alırsın.</li>
              <li>Tarayıcıdan <a href="https://finans.erpide.com" target="_blank" className="text-blue-400 hover:underline">finans.erpide.com</a>'a girip ERPIDE hesabınla devam et.</li>
            </ol>
          </Section>

          <Section icon={Globe} title="Modüller">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Module name="Cari Takip" desc="Müşteri ve tedarikçi cari hesapları, bakiye ve hareket detayı" available />
              <Module name="Faturalar" desc="e-Fatura/e-Arşiv kesimi, tahsilat/ödeme takibi" status="beta" />
              <Module name="Banka Mutabakatı" desc="QNB API + manuel mutabakat" status="beta" />
              <Module name="Vergi Raporları" desc="KDV, geçici vergi, kurumlar vergisi" status="beta" />
              <Module name="Personel / SGK" desc="Bordro hesabı ve SGK XML üretimi" status="planned" />
              <Module name="AI Asistan" desc='Doğal dille soru sor: "bu ay zarar mı kar mı?"' status="beta" />
            </div>
          </Section>

          <Section icon={MessageSquare} title="AI Asistan ile Kullanım">
            <p className="text-sm text-gray-300 mb-3">FinansERPIDE'nin en güçlü yönü AI sohbeti. Örnek komutlar:</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• <code className="text-blue-400 font-mono">&ldquo;Bu ay net kâr nedir?&rdquo;</code> → Anında P&L raporu</li>
              <li>• <code className="text-blue-400 font-mono">&ldquo;Bu fatura fotoğrafını kaydet&rdquo;</code> + foto → OCR ile fatura okuyup sisteme kaydeder</li>
              <li>• <code className="text-blue-400 font-mono">&ldquo;ABC Şirketi&apos;ne ne kadar borçluyum?&rdquo;</code> → Cari bakiye</li>
              <li>• <code className="text-blue-400 font-mono">&ldquo;Eylül KDV beyannamesi için tutarları hazırla&rdquo;</code> → Beyanname öncesi rapor</li>
            </ul>
          </Section>

          <div className="mt-8 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-center">
            <p className="text-sm text-gray-300 mb-3">
              Tenant kurulumun aktif olmadıysa veya özel modül talep ediyorsan:
            </p>
            <Link href="/iletisim" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition text-sm">
              Bize Yaz
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 p-6 rounded-2xl bg-[#111118] border border-white/5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
        <Icon size={18} className="text-blue-400" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Module({ name, desc, available, status }: { name: string; desc: string; available?: boolean; status?: "beta" | "planned" }) {
  const pill = available
    ? { label: "Aktif", cls: "bg-green-500/15 text-green-400 border-green-500/30" }
    : status === "beta"
      ? { label: "Beta", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" }
      : { label: "Yakında", cls: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
  return (
    <div className="p-3 rounded-lg bg-[#0d0d14] border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-white text-sm">{name}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pill.cls}`}>{pill.label}</span>
      </div>
      <p className="text-xs text-gray-400">{desc}</p>
    </div>
  );
}
