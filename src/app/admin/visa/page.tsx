'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Play, CheckCircle, AlertCircle } from 'lucide-react';
interface Applicant {
  id: string;
  name: string;
  surname: string;
  tc_no: string;
  passport: string;
  phone: string;
  personal_email: string;
  countries: string[];
  bookings: Record<string, string>;
  form_status: Record<string, any>;
}

const COUNTRIES = [
  { id: 'italy', name: 'İtalya (iData)' },
  { id: 'greece', name: 'Yunanistan (Kosmos)' },
  { id: 'spain', name: 'İspanya (BLS)' },
  { id: 'france', name: 'Fransa (VFS)' },
];

export default function VisaPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('greece');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [botRunning, setBotRunning] = useState(false);

  // Load applicants
  useEffect(() => {
    fetchApplicants();
  }, []);

  const fetchApplicants = async () => {
    try {
      const res = await fetch('/api/visa/applicants');
      if (res.ok) {
        const data = await res.json();
        setApplicants(data);
      }
    } catch (error) {
      alert('Başvurucular yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const deleteApplicant = async (id: string) => {
    if (confirm('Sil?')) {
      try {
        await fetch(`/api/visa/applicants/${id}`, { method: 'DELETE' });
        alert('Silindi');
        fetchApplicants();
      } catch (error) {
        alert('Hata: Silinemiyor');
      }
    }
  };

  const triggerBot = async (applicantId: string, country: string) => {
    setBotRunning(true);
    try {
      const res = await fetch('/api/visa/bot/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId, country }),
      });

      if (res.ok) {
        const result = await res.json();
        alert(result.message || 'Bot başlatıldı');
        setTimeout(fetchApplicants, 2000);
      } else {
        alert('Hata: Bot başlatılamadı');
      }
    } catch (error) {
      alert('Hata: Bot başlatılamadı');
    } finally {
      setBotRunning(false);
    }
  };

  const getStatusBadge = (status: any) => {
    if (!status) return <span className="text-gray-400">Bekleniyor</span>;

    if (status.status === 'booked') {
      return <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Alındı</span>;
    }

    if (status.status === 'error') {
      return <span className="text-red-600 flex items-center gap-1"><AlertCircle size={16} /> Hata</span>;
    }

    return <span className="text-blue-600">İşlemde</span>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🟦 Visa Randevu Bot</h1>
          <p className="text-gray-500">Otomatik randevu yönetimi</p>
        </div>
        <button onClick={() => alert('Yeni başvurucu formu')} className="bg-blue-600 text-white px-4 py-2 rounded gap-2 flex items-center">
          <Plus size={16} /> Başvurucu Ekle
        </button>
      </div>

      {/* Country Filter */}
      <div className="border rounded p-4 bg-white">
        <h3 className="font-bold mb-3">Ülke Seçimi</h3>
        <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)} className="border rounded px-3 py-2 w-full md:w-64">
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Applicants Table */}
      <div className="border rounded p-4 bg-white">
        <h3 className="font-bold mb-4">Başvurucular ({applicants.length})</h3>
        {loading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-3">Ad Soyad</th>
                  <th className="text-left py-3 px-3">TC</th>
                  <th className="text-left py-3 px-3">Tel</th>
                  <th className="text-left py-3 px-3">Email</th>
                  <th className="text-center py-3 px-3">Durum</th>
                  <th className="text-center py-3 px-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium">{app.name} {app.surname}</td>
                    <td className="py-3 px-3 font-mono text-xs">{app.tc_no}</td>
                    <td className="py-3 px-3">{app.phone}</td>
                    <td className="py-3 px-3 text-sm">{app.personal_email}</td>
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(app.form_status?.[selectedCountry])}
                    </td>
                    <td className="py-3 px-3 text-center flex justify-center gap-2">
                      <button
                        onClick={() => triggerBot(app.id, selectedCountry)}
                        disabled={botRunning || !app.countries.includes(selectedCountry)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        <Play size={12} /> Bot
                      </button>
                      <button
                        onClick={() => deleteApplicant(app.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {applicants.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                Başvurucu yok. Yeni ekle.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bot Status */}
      <div className="border-2 border-blue-200 bg-blue-50 rounded p-4">
        <h3 className="font-bold text-lg mb-2">🤖 Bot Durumu</h3>
        <p>
          <strong>Durum:</strong> {botRunning ? '🔴 Çalışıyor' : '🟢 Hazır'}
        </p>
        <p className="text-gray-600 mt-2 text-sm">
          Bot otomatik olarak gece 3-6 arası slot açılışlarını takip eder.
          Telegram bot'a (@vize2026bot) SMS kodlarını gönderirsin,
          bot otomatik doğrulama ve randevu almayı yapıyor.
        </p>
      </div>
    </div>
  );
}
