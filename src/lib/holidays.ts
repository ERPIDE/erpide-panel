/**
 * TR + KZ resmi tatil ve özel gün takvimi. Geleceğe dönük.
 *
 * Tek kaynak: bu dosyadaki HOLIDAYS array'i. Cron daily her gün çalışıp
 * isHolidayToday() ile bugünün tatili var mı kontrol eder; varsa:
 *  - Site'de "Bugün özel gün" banner
 *  - (Phase 3) social media auto-post
 *  - (Phase 3) SEO sitemap güncelleme
 *
 * Tarihler MM-DD formatında — her yıl tekrarlanan tatil. Yıl bağımlı tatiller
 * (örn. dini bayramlar) için ek YYYY-MM-DD formatlı alternatif var.
 *
 * Faz 3 hazırlığı: her tatilin postTemplate'i (TR/EN/RU/KK title/excerpt)
 * news.ts'in eski post formatına uyumlu. Cron tetiklendiğinde bir holiday
 * post'u news.ts'e benzer şekilde generated edilebilir.
 */

import type { Locale } from "./translations";

export type Country = "TR" | "KZ" | "BOTH";

export interface Holiday {
  /** Slug — tatil + yıl. Her yıl yeni instance: "yilbasi-2027" gibi */
  slug: string;
  /** "MM-DD" — her yıl tekrarlanan tatiller için (örn. "01-01") */
  recurringDate?: string;
  /** "YYYY-MM-DD" — sabit tarihte tek seferlik (dini bayramlar) */
  fixedDate?: string;
  /** Tatil kapsamı: TR'de mi, KZ'de mi, ikisinde de mi */
  country: Country;
  /** Tema gradient (Tailwind class) — OG image için */
  gradient: string;
  /** Dekoratif emoji — OG image'da büyük gösterilir */
  decoration: string;
  /** Locale → title/excerpt */
  i18n: Record<Locale, { title: string; excerpt: string }>;
}

export const HOLIDAYS: Holiday[] = [
  // TR — resmi tatil ve milli günler
  {
    slug: "yilbasi",
    recurringDate: "01-01",
    country: "BOTH",
    gradient: "from-indigo-600 via-purple-600 to-pink-600",
    decoration: "🎆",
    i18n: {
      tr: { title: "Yeni Yılınız Kutlu Olsun", excerpt: "ERPIDE ailesi olarak tüm dostlarımıza, müşterilerimize ve ekibimize sağlıklı, başarılı ve mutlu bir yıl diliyoruz." },
      en: { title: "Happy New Year", excerpt: "From the ERPIDE family, we wish all our friends, customers and team a healthy, successful and joyful new year." },
      ru: { title: "С Новым годом", excerpt: "Команда ERPIDE желает всем друзьям, клиентам и команде здорового, успешного и счастливого нового года." },
      kk: { title: "Жаңа жылыңыз құтты болсын", excerpt: "ERPIDE отбасы атынан барлық достарымызға, клиенттерімізге және командамызға денсаулық, табыс пен бақыт тілейміз." },
    },
  },
  {
    slug: "ortodoks-noel",
    recurringDate: "01-07",
    country: "KZ",
    gradient: "from-blue-700 via-amber-400 to-blue-800",
    decoration: "🕯️",
    i18n: {
      tr: { title: "Ortodoks Noeli Kutlu Olsun", excerpt: "Kazakistan'da Ortodoks Noeli kutlayan tüm dostlarımıza huzur ve mutluluk dolu bir gün diliyoruz." },
      en: { title: "Happy Orthodox Christmas", excerpt: "Wishing all our friends in Kazakhstan who celebrate Orthodox Christmas a day filled with peace and joy." },
      ru: { title: "С Рождеством Христовым", excerpt: "Поздравляем всех наших друзей в Казахстане с Рождеством — желаем мира и радости в этот день." },
      kk: { title: "Православ Рождествосы құтты болсын", excerpt: "Қазақстанда Православ Рождествосын тойлайтын барлық достарымызға тыныштық пен қуанышты күн тілейміз." },
    },
  },
  {
    slug: "kadinlar-gunu",
    recurringDate: "03-08",
    country: "BOTH",
    gradient: "from-pink-500 via-rose-500 to-purple-600",
    decoration: "💐",
    i18n: {
      tr: { title: "8 Mart Dünya Kadınlar Günü Kutlu Olsun", excerpt: "Yazılım sektöründe ve hayatın her alanında gücümüzü yarınlara taşıyan tüm kadınlara saygı ve sevgilerle." },
      en: { title: "Happy International Women's Day", excerpt: "With respect and love for all the women who carry our strength into tomorrow." },
      ru: { title: "С Международным женским днём", excerpt: "С уважением и любовью ко всем женщинам." },
      kk: { title: "Халықаралық әйелдер күні құтты болсын", excerpt: "Барлық әйелдерге құрмет пен сүйіспеншілікпен." },
    },
  },
  {
    slug: "canakkale-zaferi",
    recurringDate: "03-18",
    country: "TR",
    gradient: "from-red-700 via-amber-500 to-red-900",
    decoration: "🌹",
    i18n: {
      tr: { title: "Çanakkale Zaferi'nin Yıl Dönümü", excerpt: "18 Mart Çanakkale Zaferi ve Şehitleri Anma Günü'nde tüm şehitlerimizi saygıyla anıyoruz." },
      en: { title: "Anniversary of the Çanakkale Victory", excerpt: "On Çanakkale Victory and Martyrs' Day, we remember our fallen with respect." },
      ru: { title: "Годовщина Чанаккалинской победы", excerpt: "В день победы и памяти павших при Чанаккале с уважением вспоминаем наших героев." },
      kk: { title: "Шанаккале жеңісінің мерейтойы", excerpt: "Шанаккале жеңісі мен шейіттерді еске алу күнінде барлық шейіттерімізді құрметпен еске аламыз." },
    },
  },
  {
    slug: "nauryz",
    recurringDate: "03-22",
    country: "BOTH",
    gradient: "from-emerald-600 via-amber-500 to-orange-600",
    decoration: "🌷",
    i18n: {
      tr: { title: "Nevruz Bayramınız Kutlu Olsun", excerpt: "Baharın gelişi, yeniden doğuş ve umut bayramı Nevruz tüm Türk ve Kazak halklarına kutlu olsun." },
      en: { title: "Happy Nowruz", excerpt: "The arrival of spring — Nowruz greetings to Turkic and Kazakh peoples." },
      ru: { title: "С праздником Наурыз", excerpt: "Приход весны — поздравляем тюркские и казахский народы с Наурызом." },
      kk: { title: "Наурыз мейрамы құтты болсын", excerpt: "Көктемнің келуі — барлық түркі мен қазақ халқына Наурыз құтты болсын." },
    },
  },
  {
    slug: "23-nisan",
    recurringDate: "04-23",
    country: "TR",
    gradient: "from-red-600 via-amber-400 to-red-700",
    decoration: "🎈",
    i18n: {
      tr: { title: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı", excerpt: "TBMM'nin kuruluş yıl dönümü ve dünya çocuklarına armağan edilen bayramımız kutlu olsun." },
      en: { title: "National Sovereignty & Children's Day", excerpt: "Happy National Sovereignty and Children's Day." },
      ru: { title: "День национального суверенитета и детей", excerpt: "С Днём национального суверенитета и детей!" },
      kk: { title: "Ұлттық егемендік және балалар мейрамы", excerpt: "23 сәуір Ұлттық егемендік және балалар мейрамы құтты болсын!" },
    },
  },
  {
    slug: "1-mayis",
    recurringDate: "05-01",
    country: "BOTH",
    gradient: "from-red-600 to-orange-600",
    decoration: "🛠️",
    i18n: {
      tr: { title: "1 Mayıs Emek ve Dayanışma Günü", excerpt: "Emeğiyle hayatı kuran herkesin gününü kutluyoruz." },
      en: { title: "Labour & Solidarity Day", excerpt: "Happy Labour Day to everyone who builds life with their work." },
      ru: { title: "День труда и солидарности", excerpt: "С Днём труда — всех, кто строит жизнь своим трудом!" },
      kk: { title: "Еңбек және ынтымақ күні", excerpt: "Еңбегімен өмірді құрған әр адамды құттықтаймыз!" },
    },
  },
  {
    slug: "kz-anavatan-mudafileri",
    recurringDate: "05-07",
    country: "KZ",
    gradient: "from-sky-700 via-yellow-500 to-sky-800",
    decoration: "🎖️",
    i18n: {
      tr: { title: "Anavatan Müdafileri Günü", excerpt: "Kazakistan'ın Anavatan Müdafileri Günü'nde tüm savunucularına saygı." },
      en: { title: "Defenders of the Fatherland Day", excerpt: "Respect to all defenders of Kazakhstan on this special day." },
      ru: { title: "День защитника Отечества", excerpt: "С Днём защитника Отечества — низкий поклон защитникам Казахстана." },
      kk: { title: "Отан қорғаушылар күні", excerpt: "Қазақстанның Отан қорғаушылар күнінде барлық қорғаушыларға құрмет!" },
    },
  },
  {
    slug: "kz-zafer-gunu",
    recurringDate: "05-09",
    country: "KZ",
    gradient: "from-emerald-700 via-amber-500 to-emerald-900",
    decoration: "🕊️",
    i18n: {
      tr: { title: "Zafer Günü", excerpt: "Kazakistan'ın Zafer Günü'nde tüm kahramanları minnetle anıyoruz." },
      en: { title: "Victory Day", excerpt: "On Kazakhstan's Victory Day, we remember all heroes with gratitude." },
      ru: { title: "День Победы", excerpt: "В День Победы вспоминаем всех героев с глубокой благодарностью." },
      kk: { title: "Жеңіс күні", excerpt: "Қазақстанның Жеңіс күнінде барлық батырларды құрметпен еске аламыз." },
    },
  },
  {
    slug: "19-mayis",
    recurringDate: "05-19",
    country: "TR",
    gradient: "from-red-700 to-red-900",
    decoration: "⚓",
    i18n: {
      tr: { title: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı", excerpt: "Cumhuriyetimizin başlangıç meşalesinin yakıldığı günde, Gazi Mustafa Kemal Atatürk'ü saygıyla anıyoruz." },
      en: { title: "Commemoration of Atatürk, Youth & Sports Day", excerpt: "We remember Atatürk on the anniversary of May 19, 1919." },
      ru: { title: "День памяти Ататюрка, молодёжи и спорта", excerpt: "С уважением вспоминаем Ататюрка в годовщину 19 мая 1919 года." },
      kk: { title: "Ататүркті еске алу, жастар мен спорт мейрамы", excerpt: "1919 жылдың 19 мамырында Ататүркті құрметпен еске аламыз." },
    },
  },
  {
    slug: "kz-astana-gunu",
    recurringDate: "07-06",
    country: "KZ",
    gradient: "from-sky-600 via-yellow-400 to-sky-700",
    decoration: "🏛️",
    i18n: {
      tr: { title: "Astana Günü Kutlu Olsun", excerpt: "Astana ofisimizden Kazakistan'ın başkenti Astana'nın gününü kutluyoruz." },
      en: { title: "Happy Astana Day", excerpt: "From our Astana office, we celebrate the capital city's day." },
      ru: { title: "С Днём Астаны", excerpt: "Из нашего астанинского офиса поздравляем с Днём столицы Казахстана." },
      kk: { title: "Астана күні құтты болсын", excerpt: "Астанадағы офисімізден астананың күнін құттықтаймыз." },
    },
  },
  {
    slug: "zafer-bayrami",
    recurringDate: "08-30",
    country: "TR",
    gradient: "from-red-700 to-red-900",
    decoration: "🇹🇷",
    i18n: {
      tr: { title: "30 Ağustos Zafer Bayramı Kutlu Olsun", excerpt: "Türkiye Cumhuriyeti'nin temellerinin atıldığı Büyük Zafer Bayramımız kutlu olsun." },
      en: { title: "Happy Victory Day", excerpt: "Happy August 30 Victory Day." },
      ru: { title: "С Днём победы Турции", excerpt: "С Днём победы 30 августа!" },
      kk: { title: "30 тамыз Жеңіс мейрамы құтты болсын", excerpt: "Түркия Республикасының іргетасы қаланған Жеңіс мейрамы құтты болсын!" },
    },
  },
  {
    slug: "kz-anayasa-gunu",
    recurringDate: "08-30",
    country: "KZ",
    gradient: "from-sky-700 via-yellow-500 to-sky-800",
    decoration: "📜",
    i18n: {
      tr: { title: "Anayasa Günü Kutlu Olsun", excerpt: "Kazakistan Anayasası'nın kabul edildiği günü kutluyoruz." },
      en: { title: "Happy Constitution Day", excerpt: "Celebrating the day Kazakhstan's Constitution was adopted." },
      ru: { title: "С Днём Конституции", excerpt: "Поздравляем с Днём Конституции Казахстана." },
      kk: { title: "Конституция күні құтты болсын", excerpt: "Қазақстан Конституциясы қабылданған күнді құттықтаймыз." },
    },
  },
  {
    slug: "cumhuriyet-bayrami",
    recurringDate: "10-29",
    country: "TR",
    gradient: "from-red-600 to-red-900",
    decoration: "🇹🇷",
    i18n: {
      tr: { title: "29 Ekim Cumhuriyet Bayramı Kutlu Olsun", excerpt: "Cumhuriyetimizin ilanının yıl dönümünde Gazi Mustafa Kemal Atatürk'ü ve tüm kurucu atalarımızı saygıyla anıyoruz." },
      en: { title: "Happy Republic Day", excerpt: "On the anniversary of the proclamation of the Republic, we remember Atatürk with respect." },
      ru: { title: "С Днём Республики", excerpt: "В годовщину провозглашения Республики с уважением вспоминаем Ататюрка." },
      kk: { title: "Республика мейрамы құтты болсын", excerpt: "Республика жариялаған күннің мерейтойында Ататүркті құрметпен еске аламыз." },
    },
  },
  {
    slug: "ataturku-anma",
    recurringDate: "11-10",
    country: "TR",
    gradient: "from-gray-700 to-gray-900",
    decoration: "🕊️",
    i18n: {
      tr: { title: "10 Kasım Atatürk'ü Anma Günü", excerpt: "Gazi Mustafa Kemal Atatürk'ü saygı, sevgi ve özlemle anıyoruz." },
      en: { title: "Atatürk Memorial Day", excerpt: "We remember Gazi Mustafa Kemal Atatürk with respect, love and longing." },
      ru: { title: "День памяти Ататюрка", excerpt: "С уважением, любовью и тоской вспоминаем Гази Мустафу Кемаля Ататюрка." },
      kk: { title: "Ататүркті еске алу күні", excerpt: "Ғази Мұстафа Кемал Ататүркті құрметпен еске аламыз." },
    },
  },
  {
    slug: "kz-cumhurbaskani",
    recurringDate: "12-01",
    country: "KZ",
    gradient: "from-sky-700 via-yellow-400 to-sky-800",
    decoration: "🌟",
    i18n: {
      tr: { title: "Birinci Cumhurbaşkanı Günü", excerpt: "Kazakistan'ın Birinci Cumhurbaşkanı Günü'nü kutluyoruz." },
      en: { title: "First President Day", excerpt: "Celebrating Kazakhstan's First President Day." },
      ru: { title: "День Первого Президента", excerpt: "Поздравляем с Днём Первого Президента Казахстана." },
      kk: { title: "Тұңғыш Президент күні", excerpt: "Қазақстанның Тұңғыш Президент күнін құттықтаймыз." },
    },
  },
  {
    slug: "kz-bagimsizlik-gunu",
    recurringDate: "12-16",
    country: "KZ",
    gradient: "from-sky-600 via-yellow-500 to-sky-700",
    decoration: "🇰🇿",
    i18n: {
      tr: { title: "Kazakistan Bağımsızlık Günü Kutlu Olsun", excerpt: "Kardeş Kazakistan'ın Bağımsızlık Günü'nü içtenlikle kutluyoruz." },
      en: { title: "Happy Independence Day, Kazakhstan", excerpt: "Sincere congratulations on Kazakhstan's Independence Day." },
      ru: { title: "С Днём независимости, Казахстан", excerpt: "Искренне поздравляем с Днём независимости Казахстана." },
      kk: { title: "Тәуелсіздік күні құтты болсын", excerpt: "Қазақстанның Тәуелсіздік күнін шын жүректен құттықтаймыз." },
    },
  },
];

/** ISO YYYY-MM-DD verilirse, o gündeki tatil(ler) döner. Recurring veya fixed match'i kontrol eder. */
export function getHolidaysForDate(isoDate: string): Holiday[] {
  const [, m, d] = isoDate.split("-");
  const mmdd = `${m}-${d}`;
  return HOLIDAYS.filter((h) => h.recurringDate === mmdd || h.fixedDate === isoDate);
}

/** Bugünün tatil(ler)i. UTC kullanılır — Vercel cron UTC'de çalışır, server-side rendering de UTC'dir. */
export function getTodayHolidays(): Holiday[] {
  const now = new Date();
  const iso = now.toISOString().split("T")[0];
  return getHolidaysForDate(iso);
}

/** İlerideki N gün içindeki tatilleri döner. */
export function getUpcomingHolidays(days = 7): Array<{ holiday: Holiday; date: string }> {
  const result: Array<{ holiday: Holiday; date: string }> = [];
  const now = new Date();
  for (let i = 0; i <= days; i++) {
    const check = new Date(now);
    check.setDate(now.getDate() + i);
    const iso = check.toISOString().split("T")[0];
    for (const h of getHolidaysForDate(iso)) {
      result.push({ holiday: h, date: iso });
    }
  }
  return result;
}
