/**
 * ERPIDE Gündem akışı — ürün lansmanları, özel günler, şirket haberleri.
 *
 * Tek kaynak: bu dosyadaki `NEWS` array'i. Yeni post eklemek için sona
 * yeni bir nesne yapıştır + slug'ın benzersiz olduğunu kontrol et.
 *
 * Tarih formatı: ISO `YYYY-MM-DD`. Liste sayfası tarihe göre yeniden eskiye
 * sıralar. Image path public/ altına relative ('/...' ile başlar).
 *
 * Görsel kullanımı:
 *  - product-launch → gerçek ürün logoları veya FinansERPIDE screenshot'ı
 *  - special-day → null bırak (sayfa gradient + ERPIDE logo render eder)
 *  - milestone → kendi göreseli veya ERPIDE logo fallback
 */

export type NewsType = "product-launch" | "special-day" | "milestone";

export interface NewsPost {
  id: string;
  /** URL slug — yyyy-mm-dd + kebab-case başlık. SEO-friendly. */
  slug: string;
  type: NewsType;
  /** ISO yyyy-mm-dd */
  date: string;
  /** Türkçe başlık */
  title: string;
  /** Kısa özet (~150 karakter), liste kartında görünür */
  excerpt: string;
  /** Detay sayfasında uzun gövde — Markdown-ish düz metin, paragraflar `\n\n` ile ayrılır */
  body: string;
  /** public/ altında relative path. null → özel gün gradient kartı render edilir */
  image: string | null;
  imageAlt: string;
  /** Liste kartına yazılır küçük badge'ler (örn. ["YENİ", "GLOBAL"]) */
  badges?: string[];
  /** Tematik gradient (Tailwind class). Special-day için tema rengi, default brand mavi-mor */
  gradient?: string;
  /** Bu post bir ürünle ilgiliyse, detay sayfasında "Ürüne git" CTA */
  productSlug?: string;
}

export const NEWS: NewsPost[] = [
  // ============ 2025 ============
  {
    id: "kz-bagimsizlik-2025",
    slug: "kazakistan-bagimsizlik-gunu-2025",
    type: "special-day",
    date: "2025-12-16",
    title: "Kazakistan Bağımsızlık Günü Kutlu Olsun",
    excerpt:
      "Kardeş Kazakistan'ın 34. Bağımsızlık yıl dönümünü kutluyoruz. Astana ofisimizden tüm Kazak halkına bağımsızlık günü kutlamaları.",
    body:
      "Kardeş ülke Kazakistan'ın 34. Bağımsızlık yıl dönümünü gururla kutluyoruz. 16 Aralık 1991'de bağımsızlığını ilan eden Kazakistan, bölgesel ekonomide ve teknolojide önemli bir merkez haline gelmiştir.\n\nERPIDE olarak Astana ofisimizden Kazakistan'da hizmet veriyor, yerel iş ortaklarımız ve müşterilerimizle birlikte bölgenin dijital dönüşümüne katkı sağlıyoruz. Kazak halkının bağımsızlık gününü içtenlikle kutluyor, dostluğumuzun uzun yıllar daha güçlenerek devam etmesini diliyoruz.\n\nҚазақстанның Тәуелсіздік күні құтты болсын!",
    image: null,
    imageAlt: "Kazakistan Bağımsızlık Günü kutlama görseli",
    gradient: "from-sky-600 via-yellow-500 to-sky-700",
    badges: ["KAZAKİSTAN"],
  },
  {
    id: "yilbasi-2026",
    slug: "yeni-yil-2026",
    type: "special-day",
    date: "2025-12-31",
    title: "2026'ya Merhaba — Yeni Yılınız Kutlu Olsun",
    excerpt:
      "Yepyeni bir yıla heyecanla giriyoruz. 2025 yılında bizimle yürüyen tüm müşterilerimize, iş ortaklarımıza ve ekibimize teşekkürler.",
    body:
      "2025 yılını ardımızda bırakırken, geçen yıl tüm müşterilerimizin, iş ortaklarımızın ve ekibimizin bize gösterdiği güvene içtenlikle teşekkür ediyoruz.\n\n2026 yılı ERPIDE için yeni ürün lansmanları, yeni pazarlar ve yeni heyecanların yılı olacak. Önümüzdeki aylarda paylaşacağımız birçok yenilik var — gündemimizi takipte kalın!\n\nHerkese sağlıklı, başarılı ve huzurlu bir 2026 yılı diliyoruz. İyi ki varsınız.",
    image: null,
    imageAlt: "2026 yeni yıl kutlaması ERPIDE",
    gradient: "from-indigo-600 via-purple-600 to-pink-600",
    badges: ["YILBAŞI"],
  },

  // ============ 2026 ============
  {
    id: "captcha-launch",
    slug: "captchaerpide-canlida",
    type: "product-launch",
    date: "2026-01-08",
    title: "CaptchaERPIDE Yayında — 18 Captcha Tipi Tek API'den",
    excerpt:
      "Bot geliştiricilerin dostu CaptchaERPIDE bugün resmi olarak yayında! reCAPTCHA, hCaptcha, Turnstile dahil 18 captcha tipini ortalama 28ms'de çöz.",
    body:
      "2026'nın ilk büyük lansmanı: CaptchaERPIDE artık canlıda. Bot geliştirici, scraper yazan veya QA otomasyonu kuran herkesin başına bela olan captcha'lar — artık tek bir REST API ile çözülüyor.\n\n**Desteklenen captcha tipleri (18+):**\n\n- reCAPTCHA v2 / v3 / Enterprise\n- hCaptcha\n- Cloudflare Turnstile\n- AWS WAF\n- FunCaptcha / Arkose\n- DataDome\n- GeeTest\n- Slider, puzzle, text, icon, math\n\n**Teknik detaylar:**\n\n- Ortalama çözüm süresi: 28ms\n- Doğruluk oranı: %90+\n- BYOK (Bring-Your-Own-Key) desteği — kendi 2Captcha/CapMonster anahtarını kullanabilirsin\n- Gerçek zamanlı dashboard + webhook bildirimleri\n- Multi-tenant lisans yönetimi\n\nBaşlangıç paketi aylık $9.99'dan başlıyor, profesyonel paketler ile öncelikli işleme (15ms) ve dedicated worker pool seçenekleri mevcut.\n\ncaptcha.erpide.com adresinden hemen başlayabilirsin.",
    image: "/screenshots/captchaerpide/02-solved.png",
    imageAlt: "CaptchaERPIDE çözülmüş captcha ekranı",
    gradient: "from-green-600 to-teal-600",
    badges: ["YENİ ÜRÜN", "GLOBAL"],
    productSlug: "captchaerpide",
  },
  {
    id: "finanserpide-beta",
    slug: "finanserpide-beta-acildi",
    type: "product-launch",
    date: "2026-02-20",
    title: "FinansERPIDE Beta Açıldı — AI Destekli ERP SaaS",
    excerpt:
      "15+ Türk bankası + 13 e-fatura entegratörü tek panelde. AI asistan Eylül ile sohbet ederek şirketinizi yönetin. Kapalı beta erişimi başladı.",
    body:
      "Aylar süren geliştirmenin ardından FinansERPIDE bugün resmi olarak Beta'ya geçti.\n\n**FinansERPIDE neyi yapıyor?**\n\nKOBİ ve A.Ş.'lerin tüm finans ve muhasebe süreçlerini AI ile yöneten yeni nesil ERP. Multi-tenant mimari — her şirket için izole veritabanı, AES-256-GCM ile şifrelenmiş credential saklama.\n\n**Integration Hub:**\n\n- **15+ Türk bankası:** QNB Finansbank, Garanti BBVA, İş Bankası, Akbank, Yapı Kredi, DenizBank, TEB, HSBC, ING, Ziraat, VakıfBank, Halkbank, Şekerbank, Kuveyt Türk, Albaraka\n- **13 e-fatura entegratörü:** QNB eSolutions, Mikro, Logo, Veriban, Foriba, Uyumsoft, TÜRKKEP, Türk Telekom, DigitalPlanet ve daha fazlası\n\nBanka hareketleri saatlik cron ile otomatik düşer, gelen faturalar AI ile %90+ confidence ile auto-post edilir. KDV ve geçici vergi tutar hesabı, cari mutabakat, MUHSGK XML üretimi hep dahil.\n\n**AI Asistan Eylül:**\n\nFatura fotoğrafını WhatsApp'tan at, sisteme kaydedilsin. \"Bu ay kar mı zarar mı?\" diye sor, anında raporla cevaplasın. Eylül, Claude tabanlı yeni nesil AI asistanı.\n\nfinans.erpide.com adresinden beta erişimi için başvuru alıyoruz.",
    image: "/screenshots/finanserpide/01-dashboard-demo.png",
    imageAlt: "FinansERPIDE dashboard ekranı",
    gradient: "from-orange-500 to-pink-600",
    badges: ["YENİ ÜRÜN", "BETA", "TR"],
    productSlug: "finanserpide",
  },
  {
    id: "kadinlar-gunu-2026",
    slug: "dunya-kadinlar-gunu-2026",
    type: "special-day",
    date: "2026-03-08",
    title: "8 Mart Dünya Kadınlar Günü Kutlu Olsun",
    excerpt:
      "Yazılım sektöründe ve hayatın her alanında gücümüzü yarınlara taşıyan tüm kadınlara saygı ve sevgilerle. 8 Mart Dünya Kadınlar Günü kutlu olsun.",
    body:
      "Bugün 8 Mart Dünya Kadınlar Günü. Hayatın her alanında, sektörümüzde, ekibimizde, müşterilerimizde — kadınların gücü ve emeği olmasa dünya bu kadar hızlı dönmezdi.\n\nERPIDE ailesi olarak, eşitlik ve adalet için yürüyen tüm kadınlara saygıyla saygı duyuyor, yarınların daha aydınlık olması için verilen mücadelenin arkasındayız.\n\nBaşta ekibimizdeki kadın geliştiricilerimiz, danışmanlarımız ve destek personelimiz olmak üzere — emeği geçen, fikir veren, yol gösteren tüm kadınlara teşekkür ederiz. 8 Mart kutlu olsun!",
    image: null,
    imageAlt: "8 Mart Dünya Kadınlar Günü kutlaması",
    gradient: "from-pink-500 via-rose-500 to-purple-600",
    badges: ["ÖZEL GÜN"],
  },
  {
    id: "1c-distributor",
    slug: "1c-distributorlugu-resmen",
    type: "milestone",
    date: "2026-03-15",
    title: "ERPIDE Resmen 1C Ürün Ailesinin Türkiye Distribütörü",
    excerpt:
      "1Ci ile resmi distribütör anlaşmamızı imzaladık. 1C:ERP ve 1C:Drive ürünlerinin Türkiye'deki lisanslama, kurulum, yerelleştirme ve eğitim hizmetlerini ERPIDE sunuyor.",
    body:
      "Önemli bir kilometre taşı: ERPIDE bugün resmi olarak 1Ci ürün ailesinin Türkiye distribütörü oldu.\n\n**Ne anlama geliyor?**\n\nDünya çapında binlerce işletmenin güvendiği 1C:ERP ve 1C:Drive ürünleri artık Türkiye'de ERPIDE garantisiyle satın alınabiliyor. Lisanslama, kurulum, Türk vergi mevzuatına yerelleştirme, eğitim ve canlı destek paketleri tek elden sunuluyor.\n\n**1C:ERP** — orta ve büyük ölçekli üretim firmaları için yüksek fonksiyonlu ERP. Kesikli + sürekli üretim, MRP, planlama, finans, regulated raporlama hepsi tek platformda.\n\n**1C:Drive** — küçük ve orta ölçekli işletmeler için tam kapsamlı ERP. Çok seviyeli BOM, gerçek zamanlı sipariş takibi, mobil uygulama, hızlı kurulum.\n\nERPIDE ekibimiz 15+ yıllık ERP sektör tecrübesiyle, kurulum sonrası destekten yerelleştirmeye kadar tüm süreçleri yönetiyor. Demo talepleri ve fiyat bilgisi için erpide.com/urunler üzerinden iletişime geçebilirsiniz.",
    image: "/products/1c/logo.webp",
    imageAlt: "1Ci ürün ailesi distribütör anlaşması",
    gradient: "from-indigo-700 to-blue-800",
    badges: ["DAĞITICI", "GLOBAL"],
    productSlug: "1c-erp",
  },
  {
    id: "nauryz-2026",
    slug: "nevruz-nauryz-2026",
    type: "special-day",
    date: "2026-03-22",
    title: "Nevruz Bayramınız Kutlu Olsun — Наурыз мейрамы құтты болсын",
    excerpt:
      "Baharın gelişi, yeniden doğuş ve umut bayramı Nevruz tüm Türk ve Kazak halklarına kutlu olsun.",
    body:
      "Baharın müjdecisi, yeniden doğuş ve umudun bayramı Nevruz — Türk ve Kazak halklarının binlerce yıldır kutladığı en köklü bayramlardan biri.\n\nERPIDE ailesi olarak Türkiye'den Kazakistan'a, bayramı kutlayan tüm dostlarımızın bu özel gününü içtenlikle kutluyor, hayatın her alanında bahar gibi yenilenmeyi ve büyümeyi diliyoruz.\n\n**Nevruz Bayramınız kutlu olsun!**\n\n**Наурыз мейрамы құтты болсын!**\n\n**Новруз мейрамы құтты болсын!**",
    image: null,
    imageAlt: "Nevruz bayramı ateşi ve bahar kutlaması",
    gradient: "from-emerald-600 via-amber-500 to-orange-600",
    badges: ["BAYRAM", "TR + KZ"],
  },
  {
    id: "pocketerpide-beta",
    slug: "pocketerpide-testflight-acildi",
    type: "product-launch",
    date: "2026-04-10",
    title: "PocketERPIDE iOS Beta — TestFlight'a Açıldı",
    excerpt:
      "Bireysel kullanıcılar için tasarlanmış AI destekli cüzdan & bütçe uygulamamız PocketERPIDE iOS Beta'sı TestFlight üzerinden erişime açıldı.",
    body:
      "PocketERPIDE — bireysel kullanıcılar için tasarladığımız AI destekli cüzdan & bütçe uygulamamız — bugün TestFlight üzerinden iOS Beta erişimine açıldı.\n\n**Kimler için?**\n\nERP karmaşıklığı istemeyen, sade ve şık bir kişisel finans uygulaması arayan herkes için: memurlar, mühendisler, doktorlar, freelancerlar — kısacası gelir-gider takip eden ve kontrolü elinde tutmak isteyen herkes.\n\n**Özellikler:**\n\n- Maaşını brüt veya net olarak tanımla, sistem her ay otomatik gelir kaydetsin\n- Fatura geldiğinde AI'a fotoğraf at veya yazılı söyle, kategorize edilip cüzdanına işlensin\n- Aylık özet + kategori bazlı harcama analizi\n- Hedef bütçe takibi\n- Vergi iadesi hesaplama\n- Türk vergi dilimleri (brüt-net) ve TR'ye özel harcama kategorileriyle uyumlu\n\nReact Native (Expo) ile geliştirildi, iOS + Android için tek codebase. Android Beta'sı önümüzdeki haftalarda Google Play'de.\n\nBeta erişimi için pocket.erpide.com üzerinden e-posta bırakabilirsin.",
    image: "/products/pocketerpide/icon.png",
    imageAlt: "PocketERPIDE iOS uygulama ikonu",
    gradient: "from-pink-500 to-rose-600",
    badges: ["YENİ ÜRÜN", "MOBİL", "TR"],
    productSlug: "pocketerpide",
  },
  {
    id: "23-nisan-2026",
    slug: "23-nisan-2026",
    type: "special-day",
    date: "2026-04-23",
    title: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı Kutlu Olsun",
    excerpt:
      "TBMM'nin kuruluşunun 106. yıl dönümü ve dünya çocuklarına armağan edilen 23 Nisan Ulusal Egemenlik ve Çocuk Bayramımız kutlu olsun.",
    body:
      "Bugün 23 Nisan — TBMM'nin kuruluşunun 106. yıl dönümü ve Mustafa Kemal Atatürk'ün dünya çocuklarına armağan ettiği Ulusal Egemenlik ve Çocuk Bayramı.\n\nERPIDE ailesi olarak tüm çocuklarımızın bayramını kutluyor, geleceğimizi inşa eden bu yeni nesle sağlıklı, eğitimli ve mutlu bir hayat diliyoruz.\n\nGeleceği yazacak olanlar onlar. Onlara hak ettikleri en iyi dünyayı bırakmak hepimizin sorumluluğu.\n\n**23 Nisan Ulusal Egemenlik ve Çocuk Bayramımız kutlu olsun!**",
    image: null,
    imageAlt: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı",
    gradient: "from-red-600 via-amber-400 to-red-700",
    badges: ["MİLLİ BAYRAM"],
  },
  {
    id: "canias-distributor",
    slug: "canias-erp-distributorlugu",
    type: "milestone",
    date: "2026-05-08",
    title: "CANIAS ERP Türkiye Distribütör Ağına Katıldık",
    excerpt:
      "Köklü Türk endüstriyel ERP markası CANIAS'ın distribütör ağına resmen katıldık. MRP, üretim, satınalma, depo, finans modüllerinde tam destek.",
    body:
      "ERPIDE büyümeye devam ediyor: bugün CANIAS ERP'in Türkiye distribütör ağına resmen katıldık.\n\n**CANIAS ERP nedir?**\n\nKöklü bir Türk endüstriyel ERP markası. MRP, üretim, satınalma, depo yönetimi, satış, finans, insan kaynakları — kurumsal bir işletmenin ihtiyaç duyduğu tüm modüller tek platformda. Türk vergi mevzuatına ve endüstri standartlarına özel geliştirilmiş.\n\n**ERPIDE ne sunuyor?**\n\n- CANIAS lisanslama ve kurulum\n- Modül seçimi ve özelleştirme\n- Veri taşıma + entegrasyon\n- Kullanıcı eğitimi\n- Aylık bakım ve destek paketleri\n- Türkiye + Kazakistan ofislerimizden bölgesel hizmet\n\nFabrika, üretim tesisi veya orta-büyük ölçekli işletme yöneticisiyseniz, CANIAS ile iş süreçlerinizi standartlaştırıp performansınızı artırabilirsiniz. erpide.com/urunler/canias üzerinden detaylı inceleyebilir, demo talep edebilirsiniz.",
    image: "/products/canias/logo.jpg",
    imageAlt: "CANIAS ERP distribütör anlaşması",
    gradient: "from-slate-600 to-slate-800",
    badges: ["DAĞITICI", "TR"],
    productSlug: "canias",
  },
  {
    id: "19-mayis-2026",
    slug: "19-mayis-2026",
    type: "special-day",
    date: "2026-05-19",
    title: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı",
    excerpt:
      "Cumhuriyetimizin başlangıç meşalesinin yakıldığı 19 Mayıs 1919'un 107. yıl dönümünde, Gazi Mustafa Kemal Atatürk'ü saygıyla anıyoruz.",
    body:
      "19 Mayıs 1919 — Mustafa Kemal Atatürk'ün Samsun'a çıkarak Kurtuluş Savaşı'nın meşalesini yaktığı gün. Bugünü bayram ilan ettiğinde \"bu bayramı bana değil, gençlere armağan ediyorum\" demişti.\n\n107 yıl sonra, ERPIDE ailesi olarak Gazi Mustafa Kemal Atatürk'ü saygı ve minnetle anıyor, tüm gençlerimizin Gençlik ve Spor Bayramını kutluyoruz.\n\nBilim, akıl ve teknoloji yolunda yürüyen tüm gençler — geleceği siz inşa edeceksiniz. Yolunuz açık olsun.\n\n**19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramımız kutlu olsun!**",
    image: null,
    imageAlt: "19 Mayıs Atatürk'ü Anma Gençlik ve Spor Bayramı",
    gradient: "from-red-700 to-red-900",
    badges: ["MİLLİ BAYRAM"],
  },
  {
    id: "witma-launch",
    slug: "witma-canlida-cevirili-mesajlasma",
    type: "product-launch",
    date: "2026-06-16",
    title: "WITMA Canlıda — Sınırsız Mesajlaşma, Sesli Görüşme ve Canlı Çeviri",
    excerpt:
      "Bugün yepyeni ürünümüz WITMA ile tanıştık. Mesajlaşma + sesli/görüntülü görüşme + canlı çeviri tek uygulamada, uçtan uca şifreli.",
    body:
      "ERPIDE ürün ailesine bugün yeni bir üye katıldı: **WITMA — Understand Everything**.\n\n**WITMA nedir?**\n\nMesajlaşma, sesli ve görüntülü görüşme ile canlı çeviriyi tek bir uygulamada birleştiren, uçtan uca şifreli yeni nesil iletişim platformu.\n\n**Öne çıkan özellikler:**\n\n- **Sınırsız mesajlaşma** — metin, dosya, ses, görüntü\n- **Sesli & görüntülü görüşme** — bireysel ve grup\n- **Canlı çeviri** — konuşurken anlık çevrilen alt yazılar, 50+ dil\n- **E2E şifreleme** — Signal protokolü tabanlı, mesajlarınız sadece sizin\n- **Çapraz platform** — iOS + Android + web\n- **Yapay zeka asistanı** — özet alma, hatırlatma, ajandanıza işleme\n\n**Kimler için?**\n\nYurt dışındaki müşterileriyle anlık iletişim kurması gereken işletmeler, çok dilli ekipler, yurtdışındaki ailesiyle konuşan herkes, yurt dışı seyahatinde dil bariyeriyle karşılaşan herkes için tasarlandı.\n\n**Erişim:**\n\nİlk lansman olarak iOS ve Android'de mevcut. WITMA web versiyonu witma-site.vercel.app adresinden incelenebilir (witma.app DNS taşıma sürecinde).\n\nERPIDE olarak WITMA'yı 2026'nın en heyecan verici ürünü olarak görüyoruz. Geri bildirimlerinizi bekliyoruz!",
    image: "/products/witma/icon.png",
    imageAlt: "WITMA uygulama ikonu",
    gradient: "from-blue-600 to-purple-600",
    badges: ["YENİ ÜRÜN", "BUGÜN", "GLOBAL"],
    productSlug: "witma",
  },
];

/** Slug'a göre bul. /gundem/[slug] sayfası kullanır. */
export function getNewsPost(slug: string): NewsPost | undefined {
  return NEWS.find((p) => p.slug === slug);
}

/** Tarihe göre yeni → eski sıralı liste. */
export function getNewsSorted(): NewsPost[] {
  return [...NEWS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Tipine göre filtrele. */
export function getNewsByType(type: NewsType): NewsPost[] {
  return getNewsSorted().filter((p) => p.type === type);
}

/** UI etiketleri. */
export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  "product-launch": "Yeni Ürün",
  "special-day": "Özel Gün",
  milestone: "Şirket Haberi",
};

export const NEWS_TYPE_COLORS: Record<NewsType, string> = {
  "product-launch": "bg-blue-500/20 text-blue-300 border-blue-400/40",
  "special-day": "bg-pink-500/20 text-pink-300 border-pink-400/40",
  milestone: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
};
