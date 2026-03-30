// Shared task store — will be replaced with real DB later

export type Priority = "critical" | "high" | "medium" | "low";
export type Status = "todo" | "in_progress" | "review" | "done";
export type Label = "bug" | "feature" | "improvement" | "docs" | "urgent";

export interface Comment {
  id: string;
  author: string;
  authorRole: "admin" | "customer" | "developer";
  text: string;
  date: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "document" | "screenshot";
  url: string;
  date: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  project: string;
  client: string;
  label: Label;
  status: Status;
  priority: Priority;
  deadline?: string;
  createdAt: string;
  createdBy: string;
  devNote?: string;
  comments: Comment[];
  attachments: Attachment[];
}

export const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  critical: { label: "Kritik", color: "text-red-500", bg: "bg-red-500/10" },
  high: { label: "Yüksek", color: "text-orange-400", bg: "bg-orange-500/10" },
  medium: { label: "Orta", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  low: { label: "Düşük", color: "text-gray-400", bg: "bg-gray-500/10" },
};

export const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  todo: { label: "Bekliyor", color: "text-gray-400", bg: "bg-gray-500/10" },
  in_progress: { label: "Devam Ediyor", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  review: { label: "İncelemede", color: "text-blue-400", bg: "bg-blue-500/10" },
  done: { label: "Tamamlandı", color: "text-green-400", bg: "bg-green-500/10" },
};

export const labelConfig: Record<Label, { label: string; color: string; bg: string }> = {
  bug: { label: "Hata", color: "text-red-400", bg: "bg-red-500/10" },
  feature: { label: "Özellik", color: "text-green-400", bg: "bg-green-500/10" },
  improvement: { label: "İyileştirme", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  docs: { label: "Doküman", color: "text-blue-400", bg: "bg-blue-500/10" },
  urgent: { label: "Acil", color: "text-red-500", bg: "bg-red-500/10" },
};

export const initialTasks: Task[] = [
  // CANIAS ERP - Sirmersan
  { id: 1, title: "SIRPRD05: Parti numarası detay ve performans iyileştirmesi", description: "SIRPRD05 uygulamasında Kasa No ve Adet girildikten sonra Part Numarası Detayına tıklanıyor. Sağ taraftaki pencere ilk açılanın detay ekranı olarak kalıyor. Kaydet'e basıldığında çok yavaş çalışıyor.", project: "CANIAS", client: "Sirmersan", label: "bug", status: "todo", priority: "high", createdAt: "2026-03-28", createdBy: "Sirmersan", comments: [{ id: "c1", author: "Sirmersan", authorRole: "customer", text: "Bu sorun üretimi çok yavaşlatıyor, acil çözülmesi gerekiyor.", date: "2026-03-28" }], attachments: [] },
  { id: 2, title: "DSG Malzeme kartı parti numarası kurgusu değişikliği", description: "DSG Malzeme kartında farklı bir parti numarası kurgusu olacak. SIRPRD05 Parti numarası üretme fonksiyonu değiştirilecek.", project: "CANIAS", client: "Sirmersan", label: "feature", status: "todo", priority: "medium", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 3, title: "SIRSTOK2: CREATEVARCOLUMNS fonksiyonu hızlandırılacak", description: "SIRSTOK2 ekranında arama sırasında CREATEVARCOLUMNS fonksiyonu yavaş çalışıyor. Performans optimizasyonu yapılacak.", project: "CANIAS", client: "Sirmersan", label: "improvement", status: "todo", priority: "medium", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 4, title: "Kayıt anahtarları revizesi - Bordro", description: "Kayıt anahtarlarının revizesi yapılacak. Bordro modülünden başlanacak.", project: "CANIAS", client: "Sirmersan", label: "improvement", status: "todo", priority: "low", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 5, title: "SALT01: İrsaliye silindikten sonra INVT29 çift rezervasyon", description: "SALT01'de irsaliyesi kesilen bir kaydın INVT29'a rezervasyon kaydı atıyor. İrsaliye silindi işaretlendikten sonra INVT29'da iki kayıt oluyor.", project: "CANIAS", client: "Sirmersan", label: "bug", status: "todo", priority: "high", createdAt: "2026-03-28", createdBy: "Sirmersan", comments: [], attachments: [] },
  { id: 6, title: "SALT04: Satış faturasında iskonto 611.01.001 hesap", description: "Satış faturasında iskonto uygulandığında 611.01.001 hesap çalışacak.", project: "CANIAS", client: "Sirmersan", label: "feature", status: "todo", priority: "medium", createdAt: "2026-03-28", createdBy: "Sirmersan", comments: [], attachments: [] },
  { id: 7, title: "Kalem bazlı tevkifat muhasebe fişi oluşturmuyor", description: "Tüm belge yerine kalem bazlı tevkifat olduğunda muhasebe fişi oluşturmuyor.", project: "CANIAS", client: "Sirmersan", label: "bug", status: "todo", priority: "critical", createdAt: "2026-03-28", createdBy: "Sirmersan", comments: [], attachments: [] },
  { id: 8, title: "SIRPRD02: Performans iyileştirmesi", description: "SIRPRD02 hızlandırılacak.", project: "CANIAS", client: "Sirmersan", label: "improvement", status: "in_progress", priority: "high", createdAt: "2026-03-28", createdBy: "Admin", devNote: "N+1 sorgu problemi tespit edildi. LEFT JOIN mimarisine geçiş yapılıyor.", comments: [{ id: "c2", author: "ERPIDE Dev", authorRole: "developer", text: "Analiz tamamlandı, 10.000+ SQL sorgusu tek sorguda birleştirilecek.", date: "2026-03-29" }], attachments: [] },
  { id: 9, title: "FINT64: İndirilecek KDV listesinde hatalı rakamlar", description: "FINT64'te indirilecek KDV listesine rakamlar hatalı geliyor.", project: "CANIAS", client: "Sirmersan", label: "bug", status: "todo", priority: "high", createdAt: "2026-03-28", createdBy: "Sirmersan", comments: [], attachments: [] },
  { id: 10, title: "ACTT09: Proje alanında karlılık analiz raporu", description: "ACTT09 Proje alanında karlılık analiz raporu gibi bir şey isteniyor.", project: "CANIAS", client: "Sirmersan", label: "feature", status: "todo", priority: "medium", createdAt: "2026-03-28", createdBy: "Sirmersan", comments: [], attachments: [] },
  // 1C ERP - ATM Constructor
  { id: 11, title: "İthalat faturası masraf dağılımı belgesi ve web servisi", description: "İthalat faturasına masraf dağılımı yapacak ACC'de yeni belge geliştirilecek ve web servisi yazılacak.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "high", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 12, title: "Belgesiz stok düşüm web servisi", description: "Belgesiz stok düşüm belgelerinin web servisi geliştirilecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 13, title: "Üretim aşaması belgesinde stok rapor ekranı", description: "Üretim aşaması belgesine içeride stok görülebilmesi için stok rapor ekranı geliştirilecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 14, title: "PT numarasına göre PITI otomatik üretim aşaması", description: "PT numarasına göre proje bazlı PITI üretim aşaması belgesine otomatik gelecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 15, title: "Banka ödemelerinde bağımsız avans süreci", description: "Banka ödemelerinde Nakit akışından bağımsız avans süreci modellenecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 16, title: "Banka ödeme komisyon masraf ödeme servisi", description: "Banka ödeme belgesinde komisyon tutarları için masraf ödeme tutarı servisi geliştirilecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "low", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 17, title: "Ödeme talebine otomatik nakit akışı basılması", description: "Ödeme talebi belgesine nakit akışı otomatik olarak basılacak.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 18, title: "Sabit kıymet faydalı ömür girişleri", description: "Sabit kıymetlerin faydalı ömürlerinin girişleri yapılacak.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "low", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 19, title: "Sabit kıymet ilk tahakkuk belgeleri", description: "Sabit kıymet ilk tahakkuk belgeleri oluşturulacak.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "low", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 20, title: "İdareten stok artırım belgeleri PT eşlemesi", description: "İdareten girilen stok artırım belgeleri PT numarası eşlemesi yapılarak silinecek.", project: "1C ERP", client: "ATM Constructor", label: "improvement", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 21, title: "HFE Holü özel Hata Talep Listesi hataları", description: "HFE Holü özel Hata Talep Listesi hataları çözülecek.", project: "1C ERP", client: "ATM Constructor", label: "bug", status: "in_progress", priority: "high", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "ATM Constructor", devNote: "Hata kaynağı tespit edildi, düzeltme yapılıyor.", comments: [], attachments: [] },
  { id: 22, title: "Ödeme Talepleri Raporu ATM logolu tasarım", description: "Ödeme Talepleri Raporu ATM logolu tasarlanacak. Çoklu seçme ile çıktı alınabilecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "ATM Constructor", comments: [], attachments: [] },
  { id: 23, title: "2024-2025 muhasebe fişleri sonrası devir ve açılış bakiyeleri", description: "2024 ve 2025 muhasebe fişleri tamamlandıktan sonra Devir ve Açılış bakiyeleri ERP'ye gömülecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "high", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 24, title: "Reçetede PT numaraları FIFO ile otomatik gelme", description: "Reçetede PT numaraları ilgili projeye göre FIFO ile otomatik gelecek, kullanıcı değiştirebilecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 25, title: "Ödeme talepleri hiyerarşik workflow onay sistemi", description: "Ödeme talepleri için tüm yönetim kademesinin hiyerarşiye göre onayladığı workflow geliştirilecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "high", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "ATM Constructor", comments: [], attachments: [] },
  { id: 26, title: "Fason süreci test", description: "Fason süreci Hasan Atılcan'a test ettirilecek.", project: "1C ERP", client: "ATM Constructor", label: "improvement", status: "todo", priority: "low", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "Admin", comments: [], attachments: [] },
  { id: 27, title: "Hol bazlı karlılık raporu", description: "Hol bazlı karlılık raporu istenen formatta geliştirilecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "ATM Constructor", comments: [], attachments: [] },
  { id: 28, title: "Kar ve Zarar raporu", description: "Kar ve Zarar raporu istenen formatta geliştirilecek.", project: "1C ERP", client: "ATM Constructor", label: "feature", status: "todo", priority: "medium", deadline: "2026-04-30", createdAt: "2026-03-28", createdBy: "ATM Constructor", comments: [], attachments: [] },
];
