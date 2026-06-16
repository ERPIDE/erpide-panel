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
 *  - special-day → `/api/og/holiday/{slug}` (Vercel ImageResponse — branded)
 *  - milestone → kendi göreseli veya ERPIDE logo fallback
 *
 * i18n: TR default, EN/RU/KK opsiyonel override. Helper `getNewsText` ile
 * locale'e göre içerik döner. Eksik locale → TR'ye düşer.
 */

import type { Locale } from "./translations";

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
  /** Solid CSS arka plan (örn. "#0b1020"). Set edilirse gradient'i geçersiz kılar.
   *  Transparent ürün ikonlarının üstüne busy gradient yerine sade kontrast vermek için. */
  imageBackground?: string;
  /** Bu post bir ürünle ilgiliyse, detay sayfasında "Ürüne git" CTA */
  productSlug?: string;
  /** Dinamik OG image üretimi için: post'u temsil eden büyük emoji veya glyph
   *  (örn. "🇰🇿", "🌷", "🎆"). Sadece image=/api/og/holiday/[slug] route'u
   *  okur. Detay sayfası kullanmaz. */
  decoration?: string;
  /** OG image'da gösterilecek ikinci dil başlığı (örn. Kazakistan post'unda
   *  Kazak dilinde duplicate selamlamak için). Opsiyonel. */
  decorationSubtitle?: string;
  /** Locale-bazlı çeviri override'ları. Eksikse TR'ye düşer.
   *  `title`/`excerpt`/`body` her dilde set edilebilir, set edilmemiş alan
   *  TR'den gelir. */
  i18n?: Partial<Record<Locale, { title?: string; excerpt?: string; body?: string }>>;
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
    image: "/api/og/holiday/kazakistan-bagimsizlik-gunu-2025",
    imageAlt: "Kazakistan Bağımsızlık Günü kutlama görseli",
    gradient: "from-sky-600 via-yellow-500 to-sky-700",
    badges: ["KAZAKİSTAN"],
    decoration: "🇰🇿",
    decorationSubtitle: "Тәуелсіздік күні",
    i18n: {
      en: {
        title: "Happy Independence Day, Kazakhstan",
        excerpt: "We celebrate the 34th anniversary of Kazakhstan's independence. From our Astana office to the entire Kazakh nation — best wishes on this historic day.",
        body: "Today we proudly celebrate the 34th anniversary of Kazakhstan's independence. Declared on December 16, 1991, Kazakhstan has grown into a major regional hub for economy and technology.\n\nFrom our Astana office, ERPIDE serves customers across Kazakhstan, partnering with local businesses to drive digital transformation in the region. We sincerely congratulate the Kazakh people on their independence day and wish our friendship many more strong years ahead.\n\nҚазақстанның Тәуелсіздік күні құтты болсын!",
      },
      ru: {
        title: "С Днём Независимости, Казахстан",
        excerpt: "Поздравляем с 34-й годовщиной независимости Казахстана. От нашего офиса в Астане — наилучшие пожелания всему казахскому народу.",
        body: "Сегодня мы с гордостью отмечаем 34-ю годовщину независимости Казахстана. Объявленный 16 декабря 1991 года, Казахстан стал важным региональным центром экономики и технологий.\n\nКомпания ERPIDE через офис в Астане обслуживает клиентов в Казахстане, сотрудничает с местными партнёрами и способствует цифровой трансформации региона. Искренне поздравляем казахский народ с Днём Независимости и желаем нашей дружбе долгих и крепких лет.\n\nҚазақстанның Тәуелсіздік күні құтты болсын!",
      },
      kk: {
        title: "Қазақстанның Тәуелсіздік күні құтты болсын",
        excerpt: "Қазақстанның Тәуелсіздігінің 34 жылдығымен құттықтаймыз. Астанадағы офисімізден бүкіл қазақ халқына шын жүректен тілектер.",
        body: "Бүгін біз Қазақстан Республикасының Тәуелсіздігінің 34 жылдығын мақтанышпен атап өтеміз. 1991 жылы 16 желтоқсанда тәуелсіздігін жариялаған Қазақстан экономика мен технологияда маңызды аймақтық орталыққа айналды.\n\nERPIDE компаниясы Астанадағы офис арқылы қазақстандық клиенттерге қызмет көрсетіп, жергілікті серіктестермен бірлесе отырып, аймақтың цифрлық трансформациясына үлес қосып келеді. Қазақ халқын Тәуелсіздік күнімен шын жүректен құттықтап, достығымыздың ұзақ жылдар бойы күшейе беруін тілейміз.\n\nҚазақстанның Тәуелсіздік күні құтты болсын!",
      },
    },
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
    image: "/api/og/holiday/yeni-yil-2026",
    imageAlt: "2026 yeni yıl kutlaması ERPIDE",
    gradient: "from-indigo-600 via-purple-600 to-pink-600",
    badges: ["YILBAŞI"],
    decoration: "🎆",
    decorationSubtitle: "Yeni Yılınız Kutlu Olsun",
    i18n: {
      en: {
        title: "Hello 2026 — Happy New Year",
        excerpt: "We're stepping into a brand new year with great excitement. Thank you to all our customers, partners and team who walked with us through 2025.",
        body: "As we leave 2025 behind, we sincerely thank all our customers, partners and team members for the trust they placed in us during the past year.\n\n2026 will be a year of new product launches, new markets and new milestones for ERPIDE. Many exciting updates are on the way — stay tuned to our news feed!\n\nWe wish everyone a healthy, successful and peaceful 2026. Glad to have you with us.",
      },
      ru: {
        title: "Привет, 2026 — С Новым Годом",
        excerpt: "Мы с радостью встречаем новый год. Спасибо всем нашим клиентам, партнёрам и команде, которые были с нами в 2025 году.",
        body: "Оставляя 2025 год позади, мы искренне благодарим всех наших клиентов, партнёров и сотрудников за доверие, оказанное нам в течение прошедшего года.\n\n2026 год станет для ERPIDE годом новых запусков продуктов, новых рынков и новых достижений. Впереди много интересного — следите за нашими новостями!\n\nЖелаем всем здорового, успешного и мирного 2026 года. Спасибо, что вы с нами.",
      },
      kk: {
        title: "Сәлем, 2026 — Жаңа жылыңыз құтты болсын",
        excerpt: "Жаңа жылды үлкен қуанышпен қарсы аламыз. 2025 жылы бізбен бірге жүрген барлық клиенттер мен серіктестерге, командамызға алғыс айтамыз.",
        body: "2025 жылды артта қалдырар кезде, өткен жыл бойы бізге сенім артқан клиенттер мен серіктестерімізге, командамызға шын жүректен алғыс білдіреміз.\n\n2026 жыл ERPIDE үшін жаңа өнімдер, жаңа нарықтар мен жаңа жетістіктер жылы болады. Жақын күндерде сізбен бөлісетін көптеген жаңалықтарымыз бар — гүндем парақшамызды қадағалап тұрыңыз!\n\nБарлығыңызға денсаулық, табыс пен бейбіт 2026 жылы тілейміз. Бізбен бірге болғаныңыз үшін рахмет.",
      },
    },
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
    i18n: {
      en: {
        title: "CaptchaERPIDE Live — 18 Captcha Types Through One API",
        excerpt: "Bot developers' best friend, CaptchaERPIDE is officially live today. Solve reCAPTCHA, hCaptcha, Turnstile and 18+ captcha types at an average of 28ms.",
        body: "The first major launch of 2026: CaptchaERPIDE is now live. The captcha headache faced by every bot developer, scraper or QA automation engineer — now solved through a single REST API.\n\n**Supported captcha types (18+):**\n\n- reCAPTCHA v2 / v3 / Enterprise\n- hCaptcha\n- Cloudflare Turnstile\n- AWS WAF\n- FunCaptcha / Arkose\n- DataDome\n- GeeTest\n- Slider, puzzle, text, icon, math\n\n**Technical details:**\n\n- Average solve time: 28ms\n- Accuracy: 90%+\n- BYOK (Bring-Your-Own-Key) support — use your own 2Captcha/CapMonster key\n- Real-time dashboard + webhook notifications\n- Multi-tenant license management\n\nStarter plan from $9.99/month, professional plans add priority processing (15ms) and dedicated worker pool options.\n\nGet started immediately at captcha.erpide.com.",
      },
      ru: {
        title: "CaptchaERPIDE в эфире — 18 типов капчи через один API",
        excerpt: "Лучший друг разработчиков ботов, CaptchaERPIDE официально запущен. Решайте reCAPTCHA, hCaptcha, Turnstile и 18+ типов капчи в среднем за 28мс.",
        body: "Первый крупный запуск 2026 года: CaptchaERPIDE теперь в эфире. Головная боль разработчиков ботов, скраперов и QA-инженеров — теперь решается через единый REST API.\n\n**Поддерживаемые типы капчи (18+):**\n\n- reCAPTCHA v2 / v3 / Enterprise\n- hCaptcha\n- Cloudflare Turnstile\n- AWS WAF\n- FunCaptcha / Arkose\n- DataDome\n- GeeTest\n- Слайдер, пазл, текст, иконка, математика\n\n**Технические характеристики:**\n\n- Среднее время решения: 28мс\n- Точность: 90%+\n- Поддержка BYOK — используйте свой ключ 2Captcha/CapMonster\n- Дашборд в реальном времени + webhook-уведомления\n- Управление лицензиями для нескольких клиентов\n\nСтартовый тариф от $9.99 в месяц, профессиональные тарифы — приоритетная обработка (15мс) и выделенный пул воркеров.\n\nНачните прямо сейчас на captcha.erpide.com.",
      },
      kk: {
        title: "CaptchaERPIDE іске қосылды — 18 капча түрі бір API арқылы",
        excerpt: "Бот әзірлеушілердің досы CaptchaERPIDE бүгін ресми түрде іске қосылды. reCAPTCHA, hCaptcha, Turnstile және 18+ капча түрін орташа 28 мс ішінде шешіңіз.",
        body: "2026 жылдың алғашқы үлкен жобасы: CaptchaERPIDE енді іске қосылды. Бот әзірлеушілер, скрапер жазатындар немесе QA автоматтандыруын құратындар бетпе-бет келетін капча мәселесі — енді жалғыз REST API арқылы шешіледі.\n\n**Қолдау көрсетілетін капча түрлері (18+):**\n\n- reCAPTCHA v2 / v3 / Enterprise\n- hCaptcha\n- Cloudflare Turnstile\n- AWS WAF\n- FunCaptcha / Arkose\n- DataDome\n- GeeTest\n- Слайдер, пазл, мәтін, белгіше, математика\n\n**Техникалық деректер:**\n\n- Орташа шешу уақыты: 28 мс\n- Дәлдік: 90%+\n- BYOK қолдауы — өз 2Captcha/CapMonster кілтіңізді пайдаланыңыз\n- Нақты уақыттағы дашборд + webhook хабарламалары\n- Көп-арендатор лицензия басқару\n\nБастапқы тариф айына $9.99-дан басталады, кәсіби тарифтер басымдықпен өңдеу (15 мс) мен арнайы worker пулын ұсынады.\n\ncaptcha.erpide.com сайтынан бірден бастаңыз.",
      },
    },
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
    i18n: {
      en: {
        title: "FinansERPIDE Beta Opens — AI-Powered ERP SaaS",
        excerpt: "15+ Turkish banks + 13 e-invoice integrators in one panel. Manage your company by chatting with our AI assistant Eylül. Closed beta access starts now.",
        body: "After months of development, FinansERPIDE officially moves into Beta today.\n\n**What does FinansERPIDE do?**\n\nA next-generation ERP that manages all finance and accounting processes of SMEs and Turkish A.Ş.'s with AI. Multi-tenant architecture — isolated database per company, AES-256-GCM encrypted credential storage.\n\n**Integration Hub:**\n\n- **15+ Turkish banks:** QNB Finansbank, Garanti BBVA, İş Bankası, Akbank, Yapı Kredi, DenizBank, TEB, HSBC, ING, Ziraat, VakıfBank, Halkbank, Şekerbank, Kuveyt Türk, Albaraka\n- **13 e-invoice integrators:** QNB eSolutions, Mikro, Logo, Veriban, Foriba, Uyumsoft, TÜRKKEP, Türk Telekom, DigitalPlanet and more\n\nBank transactions sync hourly via cron, incoming invoices auto-post with 90%+ AI confidence. VAT and provisional tax calculations, current account reconciliation, MUHSGK XML generation — all included.\n\n**AI Assistant Eylül:**\n\nSnap an invoice photo from WhatsApp, it lands in the system. Ask \"profit or loss this month?\" and get an instant report. Eylül is a next-gen AI assistant built on Claude.\n\nApply for beta access at finans.erpide.com.",
      },
      ru: {
        title: "FinansERPIDE Бета открыта — ERP SaaS с поддержкой AI",
        excerpt: "15+ турецких банков и 13 операторов э-фактуры в одной панели. Управляйте компанией в диалоге с AI-ассистентом Эйлюль. Закрытая бета стартовала.",
        body: "После месяцев разработки FinansERPIDE сегодня официально выходит в Бету.\n\n**Что делает FinansERPIDE?**\n\nERP нового поколения, который управляет всеми финансовыми и бухгалтерскими процессами турецких МСБ и А.Ш. с помощью AI. Архитектура multi-tenant — изолированная база на каждую компанию, AES-256-GCM шифрование credentials.\n\n**Integration Hub:**\n\n- **15+ турецких банков:** QNB Finansbank, Garanti BBVA, İş Bankası, Akbank, Yapı Kredi, DenizBank, TEB, HSBC, ING, Ziraat, VakıfBank, Halkbank, Şekerbank, Kuveyt Türk, Albaraka\n- **13 операторов э-фактуры:** QNB eSolutions, Mikro, Logo, Veriban, Foriba, Uyumsoft, TÜRKKEP, Türk Telekom, DigitalPlanet и другие\n\nБанковские операции синхронизируются ежечасно через cron, входящие счета автоматически проводятся с уверенностью AI 90%+. Расчёт НДС и авансовых налогов, сверка по контрагентам, генерация MUHSGK XML — всё включено.\n\n**AI-ассистент Эйлюль:**\n\nОтправь фото счёта в WhatsApp — оно попадёт в систему. Спроси \"прибыль или убыток в этом месяце?\" и получи мгновенный отчёт. Эйлюль — AI-ассистент нового поколения на базе Claude.\n\nЗаявка на бета-доступ на finans.erpide.com.",
      },
      kk: {
        title: "FinansERPIDE Бета ашылды — AI қолдауымен ERP SaaS",
        excerpt: "15+ түрік банкі мен 13 е-фактура операторы бір панельде. AI көмекшісі Эйлюлмен сөйлесе отырып компанияңызды басқарыңыз. Жабық бета басталды.",
        body: "Айлар бойғы әзірлеуден кейін FinansERPIDE бүгін ресми түрде Бетаға өтті.\n\n**FinansERPIDE не істейді?**\n\nТүрік ШОБ және А.Ш. компанияларының барлық қаржы және бухгалтерлік процестерін AI арқылы басқаратын жаңа буын ERP. Multi-tenant архитектурасы — әр компанияға бөлек дерекқор, AES-256-GCM шифрланған credential сақтау.\n\n**Integration Hub:**\n\n- **15+ түрік банкі:** QNB Finansbank, Garanti BBVA, İş Bankası, Akbank, Yapı Kredi, DenizBank, TEB, HSBC, ING, Ziraat, VakıfBank, Halkbank, Şekerbank, Kuveyt Türk, Albaraka\n- **13 е-фактура операторы:** QNB eSolutions, Mikro, Logo, Veriban, Foriba, Uyumsoft, TÜRKKEP, Türk Telekom, DigitalPlanet т.б.\n\nБанк операциялары cron арқылы сағат сайын синхрондалады, кіріс фактуралар AI-мен 90%+ сенімділікпен автоматты түрде жазылады. ҚҚС пен уақытша салық есептеулері, контрагентпен салыстыру, MUHSGK XML генерациясы — бәрі қамтылған.\n\n**AI көмекшісі Эйлюль:**\n\nWhatsApp-тан фактура суретін жіберіңіз — жүйеге түседі. \"Бұл айда пайда ма зиян ба?\" деп сұраңыз, бірден есеп аласыз. Эйлюль — Claude негізінде жасалған жаңа буын AI көмекшісі.\n\nБета қол жеткізу үшін finans.erpide.com сайтына өтіңіз.",
      },
    },
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
    image: "/api/og/holiday/dunya-kadinlar-gunu-2026",
    imageAlt: "8 Mart Dünya Kadınlar Günü kutlaması",
    gradient: "from-pink-500 via-rose-500 to-purple-600",
    badges: ["ÖZEL GÜN"],
    decoration: "💐",
    decorationSubtitle: "Kadınlar Günü",
    i18n: {
      en: {
        title: "Happy International Women's Day, March 8",
        excerpt: "With respect and love for all the women who carry our strength into tomorrow — in the software industry and in every walk of life. Happy International Women's Day.",
        body: "Today is March 8, International Women's Day. In every aspect of life, in our industry, on our team, among our customers — if it weren't for the strength and labour of women, the world wouldn't turn this fast.\n\nAs the ERPIDE family, we deeply respect every woman walking for equality and justice, and we stand behind the struggle for a brighter tomorrow.\n\nA special thank-you to the women on our team — our developers, consultants and support staff — and to every woman who contributes, advises and shows us the way. Happy March 8!",
      },
      ru: {
        title: "С Международным женским днём, 8 марта",
        excerpt: "С уважением и любовью ко всем женщинам, несущим нашу силу в завтрашний день — в IT-индустрии и в любой сфере жизни. С 8 марта!",
        body: "Сегодня 8 марта — Международный женский день. Во всех сферах жизни, в нашей индустрии, в нашей команде, среди наших клиентов — без силы и труда женщин мир бы не вращался так быстро.\n\nКоманда ERPIDE с глубоким уважением относится ко всем женщинам, борющимся за равенство и справедливость, и поддерживает их в борьбе за лучшее завтра.\n\nОсобая благодарность женщинам нашей команды — разработчицам, консультантам и сотрудницам поддержки — а также каждой женщине, которая вносит вклад, делится идеями и указывает путь. С 8 марта!",
      },
      kk: {
        title: "Халықаралық әйелдер күні құтты болсын, 8 наурыз",
        excerpt: "Бағдарламалық қамтамасыз ету саласында және өмірдің барлық саласында күшімізді ертеңге апарушы барлық әйелдерге құрмет пен сүйіспеншілікпен. 8 наурыз құтты болсын.",
        body: "Бүгін 8 наурыз — Халықаралық әйелдер күні. Өмірдің барлық саласында, біздің салада, командамызда, клиенттерімізде — әйелдердің күші мен еңбегі болмаса, әлем мұндай қарқынмен айналмас еді.\n\nERPIDE отбасы ретінде, теңдік пен әділдік үшін күрескен барлық әйелдерге терең құрмет білдіреміз және ертеңгі күнді жарқын ету үшін жасалған күрестің артындамыз.\n\nКомандамыздағы әйел әзірлеушілерімізге, кеңесшілеріміз бен қолдау қызметкерлерімізге — еңбегі сіңген, идея берген және жол көрсеткен барлық әйелдерге алғыс. 8 наурыз құтты болсын!",
      },
    },
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
    i18n: {
      en: {
        title: "ERPIDE Officially Becomes 1C Product Family's Türkiye Distributor",
        excerpt: "We signed the official distributor agreement with 1Ci. Licensing, deployment, localization, training and support for 1C:ERP and 1C:Drive in Türkiye now comes from ERPIDE.",
        body: "An important milestone today: ERPIDE has officially become the Türkiye distributor of the 1Ci product family.\n\n**What does this mean?**\n\nThe 1C:ERP and 1C:Drive products trusted by thousands of businesses worldwide can now be purchased in Türkiye with the ERPIDE assurance. Licensing, deployment, localization to Turkish tax law, training and live support packages are all delivered from a single source.\n\n**1C:ERP** — High-function ERP for medium-to-large manufacturers. Discrete + process manufacturing, MRP, planning, finance and regulated reporting all on one platform.\n\n**1C:Drive** — Full-scope ERP for SMBs. Multi-level BOM, real-time order tracking, mobile app and rapid deployment.\n\nWith 15+ years of ERP industry expertise, our team manages everything from deployment to post-go-live support. For demo requests and pricing, reach us via erpide.com/urunler.",
      },
      ru: {
        title: "ERPIDE официально стал дистрибьютором семейства 1C в Турции",
        excerpt: "Мы подписали официальное дистрибьюторское соглашение с 1Ci. Лицензирование, внедрение, локализация, обучение и поддержка 1C:ERP и 1C:Drive в Турции теперь от ERPIDE.",
        body: "Важная веха: сегодня ERPIDE официально стал дистрибьютором семейства продуктов 1Ci в Турции.\n\n**Что это значит?**\n\nПродукты 1C:ERP и 1C:Drive, которым доверяют тысячи бизнесов по всему миру, теперь можно приобретать в Турции с гарантией ERPIDE. Лицензирование, внедрение, локализация под турецкое налоговое законодательство, обучение и пакеты поддержки — всё из одного источника.\n\n**1C:ERP** — высокофункциональный ERP для средних и крупных производителей. Дискретное и непрерывное производство, MRP, планирование, финансы и регламентированная отчётность на одной платформе.\n\n**1C:Drive** — полный ERP для МСБ. Многоуровневые BOM, отслеживание заказов в реальном времени, мобильное приложение и быстрое внедрение.\n\nС 15-летним опытом в ERP-отрасли наша команда управляет всеми процессами — от внедрения до поддержки после запуска. Для демо и расчётов: erpide.com/urunler.",
      },
      kk: {
        title: "ERPIDE 1C өнімдер отбасының Түркиядағы ресми дистрибьюторы",
        excerpt: "1Ci-мен ресми дистрибьюторлық келісімге қол қойдық. 1C:ERP пен 1C:Drive өнімдерінің Түркиядағы лицензиясы, ендіруі, локализациясы, оқытуы мен қолдауы енді ERPIDE-ден.",
        body: "Маңызды кезең: бүгін ERPIDE ресми түрде 1Ci өнімдер отбасының Түркиядағы дистрибьюторы болды.\n\n**Бұл нені білдіреді?**\n\nӘлемнің мыңдаған кәсіпорындары сенетін 1C:ERP пен 1C:Drive өнімдерін енді Түркияда ERPIDE кепілдігімен сатып алуға болады. Лицензиялау, ендіру, түрік салық заңнамасына локализация, оқыту және тікелей қолдау пакеттері бір көзден ұсынылады.\n\n**1C:ERP** — орта және ірі өндіріс кәсіпорындарына арналған жоғары функционалды ERP. Дискретті + үздіксіз өндіріс, MRP, жоспарлау, қаржы және реттелетін есептілік біртұтас платформада.\n\n**1C:Drive** — ШОБ үшін толық ERP. Көп деңгейлі BOM, тапсырыстарды нақты уақытта бақылау, мобильді қосымша және жылдам ендіру.\n\n15+ жылдық ERP саладағы тәжірибемізбен командамыз ендіруден кейінгі қолдауға дейінгі барлық процестерді басқарады. Демо мен бағалар үшін: erpide.com/urunler.",
      },
    },
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
    image: "/api/og/holiday/nevruz-nauryz-2026",
    imageAlt: "Nevruz bayramı ateşi ve bahar kutlaması",
    gradient: "from-emerald-600 via-amber-500 to-orange-600",
    badges: ["BAYRAM", "TR + KZ"],
    decoration: "🌷",
    decorationSubtitle: "Nevruz / Наурыз",
    i18n: {
      en: {
        title: "Happy Nowruz — Наурыз мейрамы құтты болсын",
        excerpt: "The arrival of spring, the festival of rebirth and hope — Nowruz greetings to all Turkic and Kazakh peoples.",
        body: "Nowruz — the herald of spring, the feast of rebirth and hope — is one of the oldest celebrations of the Turkic and Kazakh peoples, marked for thousands of years.\n\nAs the ERPIDE family, from Türkiye to Kazakhstan, we sincerely congratulate all our friends celebrating this special day, and wish renewal and growth like the spring itself in every part of life.\n\n**Happy Nowruz!**\n\n**Наурыз мейрамы құтты болсын!**\n\n**Новруз мейрамы құтты болсын!**",
      },
      ru: {
        title: "С праздником Наурыз — Наурыз мейрамы құтты болсын",
        excerpt: "Приход весны, праздник возрождения и надежды — поздравляем тюркские и казахский народы с Наурызом.",
        body: "Наурыз — провозвестник весны, праздник возрождения и надежды — один из самых древних праздников тюркских и казахского народов, отмечаемый тысячи лет.\n\nКоманда ERPIDE от Турции до Казахстана искренне поздравляет всех друзей, отмечающих этот особенный день, и желает обновления и роста, словно весной, во всех сферах жизни.\n\n**С Наурызом!**\n\n**Наурыз мейрамы құтты болсын!**\n\n**Новруз мейрамы құтты болсын!**",
      },
      kk: {
        title: "Наурыз мейрамы құтты болсын — Қош келдің, көктем",
        excerpt: "Көктемнің келуі, жаңару мен үміттің мерекесі Наурыз барлық түркі және қазақ халықтарына құтты болсын.",
        body: "Наурыз — көктемнің хабаршысы, жаңару мен үміттің мерекесі — түркі мен қазақ халықтарының мыңдаған жылдар бойы атап өтіп келе жатқан ең көне мейрамдарының бірі.\n\nERPIDE отбасы ретінде Түркиядан Қазақстанға дейін мерекелейтін барлық достарымыздың осы ерекше күнімен шын жүректен құттықтаймыз және өмірдің әр саласында көктемдей жаңару мен өсу тілейміз.\n\n**Наурыз мейрамы құтты болсын!**\n\n**Новруз мейрамы құтты болсын!**\n\n**Happy Nowruz!**",
      },
    },
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
    imageBackground: "#1a0b14",
    gradient: "from-pink-500 to-rose-600",
    badges: ["YENİ ÜRÜN", "MOBİL", "TR"],
    productSlug: "pocketerpide",
    i18n: {
      en: {
        title: "PocketERPIDE iOS Beta — Now on TestFlight",
        excerpt: "Our AI-powered personal wallet & budget app PocketERPIDE is now available in iOS Beta via TestFlight.",
        body: "PocketERPIDE — our AI-powered personal wallet & budget app for individuals — is now in iOS Beta on TestFlight.\n\n**Who is it for?**\n\nAnyone who wants a clean personal finance app without ERP complexity: employees, engineers, doctors, freelancers — anyone who tracks income and expenses and wants to stay in control.\n\n**Features:**\n\n- Define your salary in gross or net, the system records monthly income automatically\n- When a bill comes, snap a photo or tell the AI in plain text — it gets categorized and recorded\n- Monthly summary + category-based spending analysis\n- Goal-based budget tracking\n- Tax refund calculation\n- Compatible with Turkish brackets (gross/net) and Turkey-specific expense categories\n\nBuilt with React Native (Expo), a single codebase for iOS + Android. Android Beta on Google Play in the coming weeks.\n\nLeave your e-mail at pocket.erpide.com for beta access.",
      },
      ru: {
        title: "PocketERPIDE iOS Бета — теперь в TestFlight",
        excerpt: "Наш AI-кошелёк и приложение для бюджета PocketERPIDE теперь доступен в iOS Бета через TestFlight.",
        body: "PocketERPIDE — AI-кошелёк и бюджетное приложение для частных лиц — теперь в iOS Бета через TestFlight.\n\n**Для кого?**\n\nДля всех, кто хочет простое приложение для личных финансов без сложности ERP: сотрудники, инженеры, врачи, фрилансеры — все, кто следит за доходами и расходами и хочет держать всё под контролем.\n\n**Возможности:**\n\n- Введите зарплату как брутто или нетто, система ежемесячно записывает доход автоматически\n- Когда приходит счёт, сфотографируйте или скажите AI — он распознает и сохранит\n- Месячный отчёт + анализ расходов по категориям\n- Целевое бюджетирование\n- Расчёт налогового возврата\n- Совместимо с турецкими ставками (брутто/нетто) и категориями расходов\n\nПостроено на React Native (Expo) — единая кодовая база для iOS + Android. Android Бета в Google Play в ближайшие недели.\n\nОставьте e-mail на pocket.erpide.com для бета-доступа.",
      },
      kk: {
        title: "PocketERPIDE iOS Бета — TestFlight-та ашылды",
        excerpt: "Жеке пайдаланушыларға арналған AI әмияны мен бюджет қосымшамыз PocketERPIDE TestFlight арқылы iOS Бета режимде қол жетімді.",
        body: "PocketERPIDE — жеке пайдаланушыларға арналған AI әмиян және бюджет қосымшамыз — бүгін TestFlight арқылы iOS Бета режимде қол жетімді болды.\n\n**Кімдерге арналған?**\n\nERP күрделілігін қаламайтын, қарапайым жеке қаржы қосымшасын іздейтіндер: қызметкерлер, инженерлер, дәрігерлер, фрилансерлер — кірісі мен шығысын бақылап, бәрін қолда ұстағысы келетіндердің барлығы.\n\n**Мүмкіндіктері:**\n\n- Жалақыңды брутто немесе нетто түрінде енгіз, жүйе ай сайын кірісті автоматты тіркейді\n- Шот келгенде, AI-ға сурет жіберіңіз немесе жазып айтыңыз — ол санатын анықтап сақтайды\n- Айлық қорытынды + санат бойынша шығыс талдауы\n- Мақсатты бюджет бақылауы\n- Салық қайтарымын есептеу\n- Түрік салық деңгейлерімен (брутто/нетто) және TR-арнайы шығын санаттарымен үйлесімді\n\nReact Native (Expo) негізінде iOS + Android үшін бірыңғай codebase. Android Бета жақын аптада Google Play-де.\n\nБета қол жеткізу үшін pocket.erpide.com сайтына e-mail қалдырыңыз.",
      },
    },
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
    image: "/api/og/holiday/23-nisan-2026",
    imageAlt: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı",
    gradient: "from-red-600 via-amber-400 to-red-700",
    badges: ["MİLLİ BAYRAM"],
    decoration: "🎈",
    decorationSubtitle: "Çocuk Bayramı",
    i18n: {
      en: {
        title: "April 23 National Sovereignty & Children's Day",
        excerpt: "On the 106th anniversary of the founding of the Grand National Assembly of Türkiye, and the day gifted to the world's children — Happy National Sovereignty & Children's Day.",
        body: "Today is April 23 — the 106th anniversary of the founding of the Grand National Assembly of Türkiye, and the day Mustafa Kemal Atatürk gifted to the children of the world as the National Sovereignty & Children's Day.\n\nAs the ERPIDE family, we celebrate every child's holiday and wish all children — who will build our future — a healthy, educated and happy life.\n\nThe ones who will write the future are them. Leaving them the best world they deserve is the responsibility of all of us.\n\n**Happy April 23 National Sovereignty & Children's Day!**",
      },
      ru: {
        title: "23 апреля — День национального суверенитета и детей",
        excerpt: "В 106-ю годовщину Великого национального собрания Турции и день, подаренный детям всего мира — поздравляем с Днём суверенитета и детей.",
        body: "Сегодня 23 апреля — 106-я годовщина основания Великого национального собрания Турции и день, подаренный Мустафой Кемалем Ататюрком детям всего мира как День национального суверенитета и детей.\n\nКоманда ERPIDE поздравляет всех детей и желает молодому поколению, которое построит наше будущее, здоровья, образования и счастья.\n\nИменно они напишут будущее. Оставить им лучший мир, которого они достойны — ответственность всех нас.\n\n**С Днём национального суверенитета и детей, 23 апреля!**",
      },
      kk: {
        title: "23 сәуір Ұлттық егемендік және балалар мейрамы",
        excerpt: "Түркия Ұлы Ұлттық Жиналысының 106 жылдығында және әлем балаларына сыйға тартылған 23 сәуір Ұлттық егемендік және балалар мейрамы құтты болсын.",
        body: "Бүгін 23 сәуір — Түркия Ұлы Ұлттық Жиналысының құрылуының 106 жылдығы және Мұстафа Кемал Ататүрктің әлем балаларына сыйға тартқан Ұлттық егемендік және балалар мейрамы.\n\nERPIDE отбасы ретінде барлық балалардың мерекесін құттықтап, болашағымызды құрайтын осы жас ұрпаққа денсаулық, білім және бақыт тілейміз.\n\nБолашақты жазатын — олар. Оларға лайықты ең жақсы әлемді қалдыру — бәріміздің жауапкершілігіміз.\n\n**23 сәуір Ұлттық егемендік және балалар мейрамы құтты болсын!**",
      },
    },
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
    i18n: {
      en: {
        title: "Joined the CANIAS ERP Türkiye Distributor Network",
        excerpt: "We've officially joined the distributor network of the long-established Turkish industrial ERP brand CANIAS. Full support across MRP, manufacturing, purchasing, warehouse and finance modules.",
        body: "ERPIDE keeps growing: today we've officially joined the CANIAS ERP Türkiye distributor network.\n\n**What is CANIAS ERP?**\n\nA well-established Turkish industrial ERP brand. MRP, manufacturing, purchasing, warehouse management, sales, finance, HR — all modules a corporate organization needs on one platform. Built for Turkish tax law and industry standards.\n\n**What ERPIDE delivers:**\n\n- CANIAS licensing and deployment\n- Module selection and customization\n- Data migration + integrations\n- User training\n- Monthly maintenance and support packages\n- Regional service from our Türkiye + Kazakhstan offices\n\nIf you manage a factory, production facility or mid-to-large business, CANIAS can standardize your processes and boost performance. Explore details and request a demo at erpide.com/urunler/canias.",
      },
      ru: {
        title: "Присоединились к сети дистрибьюторов CANIAS ERP в Турции",
        excerpt: "Мы официально вошли в сеть дистрибьюторов давно зарекомендованного турецкого промышленного ERP-бренда CANIAS. Полная поддержка модулей MRP, производства, закупок, склада и финансов.",
        body: "ERPIDE продолжает расти: сегодня мы официально присоединились к сети дистрибьюторов CANIAS ERP в Турции.\n\n**Что такое CANIAS ERP?**\n\nДавно зарекомендованный турецкий промышленный ERP-бренд. MRP, производство, закупки, складской учёт, продажи, финансы, кадры — все модули корпоративной компании на одной платформе. Соответствует турецкому налоговому законодательству и отраслевым стандартам.\n\n**Что предлагает ERPIDE:**\n\n- Лицензирование и внедрение CANIAS\n- Выбор и кастомизация модулей\n- Миграция данных + интеграции\n- Обучение пользователей\n- Ежемесячные пакеты обслуживания и поддержки\n- Региональный сервис из офисов в Турции и Казахстане\n\nЕсли вы управляете фабрикой, производственным предприятием или средним/крупным бизнесом, CANIAS поможет стандартизировать процессы и повысить производительность. Подробнее и запрос демо: erpide.com/urunler/canias.",
      },
      kk: {
        title: "CANIAS ERP Түркиядағы дистрибьютор желісіне қосылдық",
        excerpt: "Көп жылдық тарихы бар түрік өнеркәсіптік ERP брендтерінің бірі CANIAS-тың дистрибьютор желісіне ресми қосылдық. MRP, өндіріс, сатып алу, қойма және қаржы модульдерінде толық қолдау.",
        body: "ERPIDE өсуін жалғастыруда: бүгін біз CANIAS ERP Түркиядағы дистрибьютор желісіне ресми қосылдық.\n\n**CANIAS ERP дегеніміз не?**\n\nКөп жылдық тарихы бар түрік өнеркәсіптік ERP бренді. MRP, өндіріс, сатып алу, қойма басқару, сату, қаржы, кадр — корпоративтік ұйымға қажетті барлық модульдер бір платформада. Түрік салық заңнамасы мен сала стандарттарына сай жасалған.\n\n**ERPIDE не ұсынады:**\n\n- CANIAS лицензиясы мен ендіруі\n- Модульдерді таңдау мен ыңғайластыру\n- Деректерді көшіру + интеграциялар\n- Пайдаланушыларды оқыту\n- Айлық қызмет көрсету мен қолдау пакеттері\n- Түркия + Қазақстан офистерімізден аймақтық қызмет\n\nЗауыт, өндіріс орны немесе орта-ірі бизнес басқарсаңыз, CANIAS процестеріңізді стандарттап өнімділікті арттырады. Толығырақ және демо: erpide.com/urunler/canias.",
      },
    },
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
    image: "/api/og/holiday/19-mayis-2026",
    imageAlt: "19 Mayıs Atatürk'ü Anma Gençlik ve Spor Bayramı",
    gradient: "from-red-700 to-red-900",
    badges: ["MİLLİ BAYRAM"],
    decoration: "⚓",
    decorationSubtitle: "Gençlik ve Spor Bayramı",
    i18n: {
      en: {
        title: "May 19 Commemoration of Atatürk, Youth & Sports Day",
        excerpt: "On the 107th anniversary of May 19, 1919 — the day the torch of the Turkish War of Independence was lit — we remember Gazi Mustafa Kemal Atatürk with respect.",
        body: "May 19, 1919 — the day Mustafa Kemal Atatürk landed in Samsun and lit the torch of the Turkish War of Independence. When he later proclaimed this day a holiday, he said: \"I am gifting this day not to me, but to the youth.\"\n\n107 years later, the ERPIDE family commemorates Gazi Mustafa Kemal Atatürk with respect and gratitude, and celebrates the Youth & Sports Day of all our young people.\n\nTo every young person walking the path of science, reason and technology — you will build the future. May your road be open.\n\n**Happy May 19 Commemoration of Atatürk, Youth & Sports Day!**",
      },
      ru: {
        title: "19 мая — День памяти Ататюрка, молодёжи и спорта",
        excerpt: "В 107-ю годовщину 19 мая 1919 года — дня, когда был зажжён факел Войны за независимость — мы с уважением вспоминаем Гази Мустафу Кемаля Ататюрка.",
        body: "19 мая 1919 года — день, когда Мустафа Кемаль Ататюрк высадился в Самсуне и зажёг факел Войны за независимость Турции. Объявляя этот день праздником, он сказал: \"Я дарю этот праздник не себе, а молодёжи.\"\n\n107 лет спустя команда ERPIDE с уважением и благодарностью вспоминает Гази Мустафу Кемаля Ататюрка и поздравляет всех молодых людей с Днём молодёжи и спорта.\n\nКаждому молодому человеку, идущему по пути науки, разума и технологий — вы построите будущее. Пусть ваша дорога будет открыта.\n\n**С Днём памяти Ататюрка, молодёжи и спорта, 19 мая!**",
      },
      kk: {
        title: "19 мамыр Ататүркті еске алу, жастар мен спорт мерекесі",
        excerpt: "Тәуелсіздік соғысының алауы тұтанған 19 мамыр 1919 күннің 107 жылдығында Ғази Мұстафа Кемал Ататүркті құрметпен еске аламыз.",
        body: "1919 жылғы 19 мамыр — Мұстафа Кемал Ататүрк Самсунға келіп Түркия Тәуелсіздік соғысының алауын тұтатқан күн. Осы күнді мейрам деп жариялаған кезде ол: \"Бұл мейрамды маған емес, жастарға сыйға тартамын\" деген.\n\n107 жылдан кейін ERPIDE отбасы ретінде Ғази Мұстафа Кемал Ататүркті құрметпен еске аламыз және барлық жастарымыздың Жастар мен спорт мерекесін құттықтаймыз.\n\nҒылым, ақыл мен технология жолымен жүрген әрбір жасқа — болашақты сіздер құрасыздар. Жолдарыңыз ашық болсын.\n\n**19 мамыр Ататүркті еске алу, жастар мен спорт мерекесі құтты болсын!**",
      },
    },
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
    imageBackground: "#0a0f1f",
    gradient: "from-purple-600 via-pink-500 to-cyan-400",
    badges: ["YENİ ÜRÜN", "BUGÜN", "GLOBAL"],
    productSlug: "witma",
    i18n: {
      en: {
        title: "WITMA Live — Unlimited Messaging, Voice and Live Translation",
        excerpt: "Today we introduce our brand-new product WITMA — messaging + voice/video calls + live translation in one app, end-to-end encrypted.",
        body: "A new member joins the ERPIDE product family today: **WITMA — Understand Everything**.\n\n**What is WITMA?**\n\nA next-generation, end-to-end encrypted communication platform that combines messaging, voice & video calls and live translation in a single app.\n\n**Key features:**\n\n- **Unlimited messaging** — text, files, voice, image\n- **Voice & video calls** — 1-on-1 and group\n- **Live translation** — real-time subtitles while you speak, 50+ languages\n- **E2E encryption** — Signal-protocol based; your messages stay yours\n- **Cross-platform** — iOS + Android + web\n- **AI assistant** — summaries, reminders, calendar entries\n\n**Who is it for?**\n\nBusinesses talking to overseas customers in real time, multilingual teams, anyone with family abroad, travellers facing the language barrier — WITMA is built for all of them.\n\n**Availability:**\n\nLaunch on iOS and Android. WITMA web version is browsable at witma-site.vercel.app (witma.app DNS migration in progress).\n\nERPIDE sees WITMA as 2026's most exciting product. Your feedback is invaluable!",
      },
      ru: {
        title: "WITMA в эфире — Безлимитный обмен сообщениями, звонки и живой перевод",
        excerpt: "Сегодня представляем наш новый продукт WITMA — обмен сообщениями + аудио/видеозвонки + живой перевод в одном приложении, с E2E-шифрованием.",
        body: "Сегодня к семье продуктов ERPIDE присоединяется новый участник: **WITMA — Understand Everything**.\n\n**Что такое WITMA?**\n\nНовое поколение зашифрованной от точки до точки коммуникационной платформы, объединяющей обмен сообщениями, аудио и видеосвязь и живой перевод в одном приложении.\n\n**Ключевые возможности:**\n\n- **Безлимитный обмен сообщениями** — текст, файлы, голос, изображения\n- **Аудио и видеозвонки** — 1-на-1 и групповые\n- **Живой перевод** — субтитры в реальном времени при разговоре, 50+ языков\n- **E2E-шифрование** — на основе Signal-протокола; ваши сообщения остаются вашими\n- **Кроссплатформенность** — iOS + Android + веб\n- **AI-ассистент** — резюме, напоминания, заметки в календаре\n\n**Кому подходит?**\n\nКомпаниям, общающимся с зарубежными клиентами в реальном времени, многоязычным командам, всем, у кого есть семья за рубежом, путешественникам с языковым барьером — WITMA создан для всех них.\n\n**Доступ:**\n\nЗапуск на iOS и Android. Веб-версия WITMA доступна на witma-site.vercel.app (миграция DNS witma.app в процессе).\n\nERPIDE считает WITMA самым ожидаемым продуктом 2026 года. Ваша обратная связь бесценна!",
      },
      kk: {
        title: "WITMA іске қосылды — Шектеусіз хабар алмасу, дауыстық қоңырау және тікелей аударма",
        excerpt: "Бүгін жаңа өнімімізді — WITMA — таныстырамыз: хабар алмасу + аудио/бейне қоңыраулар + тікелей аударма бір қосымшада, шеттен шетке шифрланған.",
        body: "Бүгін ERPIDE өнімдер отбасына жаңа мүше қосылды: **WITMA — Understand Everything**.\n\n**WITMA дегеніміз не?**\n\nХабар алмасу, дауыс пен бейне қоңырауларды және тікелей аударманы бір қосымшада біріктіретін, шеттен шетке шифрланған жаңа буын коммуникация платформасы.\n\n**Негізгі мүмкіндіктер:**\n\n- **Шектеусіз хабар алмасу** — мәтін, файлдар, дауыс, сурет\n- **Аудио және бейне қоңыраулар** — 1-ге-1 және топтық\n- **Тікелей аударма** — сөйлеген кезде нақты уақыттағы субтитрлер, 50+ тіл\n- **E2E шифрлеу** — Signal протоколы негізінде; хабарларыңыз тек сізге\n- **Кросс-платформа** — iOS + Android + веб\n- **AI көмекшісі** — қорытынды, еске салғыштар, күнтізбе жазбалары\n\n**Кімдерге арналған?**\n\nШетелдегі клиенттерімен нақты уақытта сөйлесетін бизнестер, көп тілді командалар, шетелде отбасы бар адамдар, тілдік кедергімен бетпе-бет келетін саяхатшылар — WITMA солардың бәріне арналған.\n\n**Қол жетімділік:**\n\niOS және Android-те іске қосылды. WITMA веб нұсқасы witma-site.vercel.app сайтында қол жетімді (witma.app DNS көшіру процесінде).\n\nERPIDE 2026 жылдың ең қызықты өнімі ретінде WITMA-ны көреді. Кері байланысыңыз баға жетпес!",
      },
    },
  },
];

/** Slug'a göre bul. /gundem/[slug] sayfası kullanır. */
export function getNewsPost(slug: string): NewsPost | undefined {
  return NEWS.find((p) => p.slug === slug);
}

/** Locale'e göre post text alanı döner. Eksik locale → TR default. */
export function getNewsText(post: NewsPost, locale: Locale, field: "title" | "excerpt" | "body"): string {
  const t = post.i18n?.[locale]?.[field];
  if (t) return t;
  return post[field];
}

/** Tarihe göre yeni → eski sıralı liste. */
export function getNewsSorted(): NewsPost[] {
  return [...NEWS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Tipine göre filtrele. */
export function getNewsByType(type: NewsType): NewsPost[] {
  return getNewsSorted().filter((p) => p.type === type);
}

/** UI etiketleri — locale-aware. */
const NEWS_TYPE_LABELS_I18N: Record<NewsType, Record<Locale, string>> = {
  "product-launch": {
    tr: "Yeni Ürün",
    en: "New Product",
    ru: "Новый продукт",
    kk: "Жаңа өнім",
  },
  "special-day": {
    tr: "Özel Gün",
    en: "Special Day",
    ru: "Особый день",
    kk: "Ерекше күн",
  },
  milestone: {
    tr: "Şirket Haberi",
    en: "Company News",
    ru: "Новости компании",
    kk: "Компания жаңалықтары",
  },
};

export function getNewsTypeLabel(type: NewsType, locale: Locale): string {
  return NEWS_TYPE_LABELS_I18N[type][locale] || NEWS_TYPE_LABELS_I18N[type].tr;
}

/** Backward-compat: default TR etiket dict. Yeni kod getNewsTypeLabel kullanmalı. */
export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  "product-launch": NEWS_TYPE_LABELS_I18N["product-launch"].tr,
  "special-day": NEWS_TYPE_LABELS_I18N["special-day"].tr,
  milestone: NEWS_TYPE_LABELS_I18N.milestone.tr,
};

export const NEWS_TYPE_COLORS: Record<NewsType, string> = {
  "product-launch": "bg-blue-500/20 text-blue-300 border-blue-400/40",
  "special-day": "bg-pink-500/20 text-pink-300 border-pink-400/40",
  milestone: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
};
