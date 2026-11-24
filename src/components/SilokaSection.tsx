import React, { useMemo, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SILOKA_PILLARS, SCHOOL_IMAGES } from '../data/seedData';
import type { AppTab, SilokaCategory, SilokaPillar, SilokaRole } from '../types';
import { Icon3D, type Icon3DName, type Icon3DTone } from './Icon3D';
import { SafeImage } from './SafeImage';

interface SilokaSectionProps {
  onNavigate?: (tab: AppTab) => void;
}

const SILOKA_FILTERS: Array<'Semua' | SilokaPillar> = ['Semua', ...SILOKA_PILLARS];

const PILLAR_STYLE: Record<
  SilokaPillar,
  {
    text: string;
    bg: string;
    card: string;
    bar: string;
    border: string;
    tone: Icon3DTone;
    icon: Icon3DName;
    activeBtn: string;
    summary: string;
  }
> = {
  Perencanaan: {
    text: 'text-violet-800',
    bg: 'bg-gradient-to-br from-violet-100/85 via-white to-indigo-100/70',
    card: 'border-violet-200 hover:border-violet-400 bg-gradient-to-b from-white to-violet-50/45',
    bar: 'bg-gradient-to-r from-violet-400 to-indigo-500',
    border: 'border-violet-200',
    tone: 'violet',
    icon: 'calendar',
    activeBtn: 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm',
    summary: 'Penyusunan RKT, RKJM, RKAS & target mutu berbasis Rapor Pendidikan.',
  },
  Pengorganisasian: {
    text: 'text-sky-800',
    bg: 'bg-gradient-to-br from-sky-100/85 via-white to-blue-100/70',
    card: 'border-sky-200 hover:border-sky-400 bg-gradient-to-b from-white to-sky-50/45',
    bar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    border: 'border-sky-200',
    tone: 'sky',
    icon: 'users',
    activeBtn: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm',
    summary: 'Pembagian tugas GTK, tim pengembang sekolah & struktur 6 rombel.',
  },
  Pelaksana: {
    text: 'text-emerald-800',
    bg: 'bg-gradient-to-br from-emerald-100/85 via-white to-teal-100/70',
    card: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-b from-white to-emerald-50/45',
    bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    border: 'border-emerald-200',
    tone: 'emerald',
    icon: 'book',
    activeBtn: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm',
    summary: 'Implementasi KBM Kurikulum Merdeka, projek P5 & pembiasaan siswa.',
  },
  'Program Unggulan': {
    text: 'text-amber-800',
    bg: 'bg-gradient-to-br from-amber-100/85 via-white to-yellow-100/70',
    card: 'border-amber-200 hover:border-amber-400 bg-gradient-to-b from-white to-amber-50/45',
    bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    border: 'border-amber-200',
    tone: 'amber',
    icon: 'award',
    activeBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm',
    summary: 'Inovasi budaya Sunda, kebun edukasi, pramuka & literasi digital.',
  },
  Evaluasi: {
    text: 'text-orange-800',
    bg: 'bg-gradient-to-br from-orange-100/85 via-white to-rose-100/70',
    card: 'border-orange-200 hover:border-rose-400 bg-gradient-to-b from-white to-orange-50/45',
    bar: 'bg-gradient-to-r from-orange-400 to-rose-500',
    border: 'border-orange-200',
    tone: 'orange',
    icon: 'clipboard',
    activeBtn: 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm',
    summary: 'Supervisi akademik, evaluasi diri sekolah & rencana tindak lanjut.',
  },
};

const ROLES: SilokaRole[] = ['Orang Tua Murid', 'Masyarakat Sekitar', 'Komite Sekolah'];
const CATEGORIES: SilokaCategory[] = [
  'Akademik & KBM',
  'Sarana Prasarana',
  'Layanan Administrasi',
  'Keamanan & Lingkungan',
  'Saran & Masukan',
];

export const SilokaSection: React.FC<SilokaSectionProps> = ({ onNavigate }) => {
  const {
    user,
    isAdmin,
    silokaItems,
    silokaComplaints,
    signInWithGoogle,
    submitSilokaComplaint,
    updateOwnSilokaComplaint,
  } = useSchool();

  const [activePillar, setActivePillar] = useState<'Semua' | SilokaPillar>('Semua');

  const [reporterName, setReporterName] = useState(user?.displayName || '');
  const [reporterRole, setReporterRole] = useState<SilokaRole>('Orang Tua Murid');
  const [category, setCategory] = useState<SilokaCategory>('Akademik & KBM');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const visibleSilokaItems = useMemo(() => {
    const base = isAdmin
      ? silokaItems
      : silokaItems.filter((item) => item.status === 'terpublikasi');
    if (activePillar === 'Semua') return base;
    return base.filter((item) => item.pillar === activePillar);
  }, [silokaItems, isAdmin, activePillar]);

  const totalAttachments = useMemo(
    () => visibleSilokaItems.filter((item) => Boolean(item.fileUrl)).length,
    [visibleSilokaItems]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreatedTicket('');
    try {
      const code = await submitSilokaComplaint({
        reporterName: reporterName.trim() || user?.displayName || 'Warga Sekolah',
        reporterRole,
        category,
        subject: subject.trim(),
        description: description.trim(),
      });
      setCreatedTicket(code);
      setSubject('');
      setDescription('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    await updateOwnSilokaComplaint(id, editSubject.trim(), editDescription.trim());
    setEditingId(null);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      {/* Colorful Hero Header */}
      <section className="rounded-3xl bg-gradient-to-br from-violet-100/80 via-indigo-50/75 to-sky-100/75 border-2 border-violet-300/80 p-6 sm:p-8 shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2.5">
                <Icon3D name="siloka" tone="violet" size="md" variant="tile" />
                <p className="text-xs font-bold uppercase tracking-wider text-violet-800">
                  SILOKA · Sistem Tata Kelola &amp; Layanan Sekolah SDN Cikawao
                </p>
              </div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#132A2E] mt-3 text-balance">
                Perencanaan, Pengorganisasian, Pelaksana, Program Unggulan &amp; Evaluasi
              </h1>
              <p className="text-[15px] text-slate-700 mt-4 leading-relaxed">
                Transparansi siklus manajemen sekolah SDN Cikawao dari tahap perencanaan, pengorganisasian sumber daya, pelaksanaan pembelajaran, inovasi program unggulan, evaluasi mutu berkelanjutan, hingga kanal aspirasi masyarakat.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {isAdmin && onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="btn-3d inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 rounded-xl whitespace-nowrap shrink-0"
                >
                  <Icon3D name="settings" tone="white" size="sm" />
                  Kelola SILOKA di Admin Dashboard
                </button>
              )}
              <a
                href="#siloka-pengaduan"
                className="btn-3d inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-violet-900 bg-white border-2 border-violet-300 rounded-xl hover:bg-violet-50 whitespace-nowrap shrink-0"
              >
                <Icon3D name="megaphone" tone="violet" size="sm" />
                Layanan Pengaduan Masyarakat
              </a>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-64 lg:h-full min-h-[250px] rounded-2xl overflow-hidden border-2 border-white shadow-lg">
              <SafeImage
                src={SCHOOL_IMAGES.hero}
                alt="Tata Kelola Program SILOKA SDN Cikawao"
                fallbackTitle="SILOKA SDN Cikawao"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-violet-100/90 via-white to-indigo-100/70 border-2 border-violet-300 shadow-xs flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-violet-900">Program &amp; Dokumen SILOKA</p>
            <p className="mt-1 font-mono text-3xl font-bold text-violet-700 tabular-nums">
              {visibleSilokaItems.length}
            </p>
          </div>
          <Icon3D name="siloka" tone="violet" size="lg" variant="tile" />
        </div>
        <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-emerald-100/90 via-white to-teal-100/70 border-2 border-emerald-300 shadow-xs flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-emerald-900">Lampiran Berkas Tersedia</p>
            <p className="mt-1 font-mono text-3xl font-bold text-emerald-700 tabular-nums">
              {totalAttachments}
            </p>
          </div>
          <Icon3D name="file-text" tone="emerald" size="lg" variant="tile" />
        </div>
        <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-sky-100/90 via-white to-cyan-100/70 border-2 border-sky-300 shadow-xs flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-sky-900">Pilar Manajemen SILOKA</p>
            <p className="mt-1 font-mono text-3xl font-bold text-sky-700 tabular-nums">
              {SILOKA_PILLARS.length} Pilar
            </p>
          </div>
          <Icon3D name="layers" tone="sky" size="lg" variant="tile" />
        </div>
      </div>

      {/* 5 Pillars Overview Cards with 3D Tiles */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {SILOKA_PILLARS.map((pillar, idx) => {
          const style = PILLAR_STYLE[pillar];
          const count = silokaItems.filter(
            (item) =>
              item.pillar === pillar && (isAdmin || item.status === 'terpublikasi')
          ).length;
          const selected = activePillar === pillar;
          return (
            <button
              key={pillar}
              type="button"
              onClick={() => setActivePillar(selected ? 'Semua' : pillar)}
              className={`card-interactive text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                style.bg
              } ${
                selected
                  ? 'ring-2 ring-violet-500 border-violet-500 shadow-md'
                  : `${style.border} hover:border-violet-400`
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Icon3D name={style.icon} tone={style.tone} size="md" variant="tile" />
                  <div className="text-right">
                    <span className={`block font-mono text-xs font-bold tabular-nums ${style.text}`}>
                      0{idx + 1}
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-slate-600 tabular-nums">
                      {count} Item
                    </span>
                  </div>
                </div>
                <h2 className="text-sm font-semibold text-[#132A2E] mt-3">{pillar}</h2>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{style.summary}</p>
              </div>
            </button>
          );
        })}
      </section>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gradient-to-r from-violet-50 via-white to-sky-50 border-2 border-violet-200 rounded-2xl w-fit shadow-xs">
          {SILOKA_FILTERS.map((pillar) => {
            const active = activePillar === pillar;
            const activeClass =
              pillar === 'Semua'
                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm'
                : PILLAR_STYLE[pillar].activeBtn;
            return (
              <button
                key={pillar}
                type="button"
                onClick={() => setActivePillar(pillar)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                  active ? activeClass : 'text-violet-950/80 hover:bg-violet-50'
                }`}
              >
                <Icon3D
                  name={pillar === 'Semua' ? 'siloka' : PILLAR_STYLE[pillar].icon}
                  tone={active ? 'white' : pillar === 'Semua' ? 'violet' : PILLAR_STYLE[pillar].tone}
                  size="xs"
                />
                <span>{pillar}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs font-medium text-slate-600 inline-flex items-center gap-1.5">
          <Icon3D name="layers" tone="violet" size="xs" />
          Menampilkan {visibleSilokaItems.length} program {activePillar === 'Semua' ? 'di semua pilar' : `pada pilar ${activePillar}`}
        </p>
      </div>

      {/* SILOKA 5-Pillar Grid */}
      {visibleSilokaItems.length === 0 ? (
        <div className="bg-gradient-to-br from-violet-50/60 via-white to-sky-50/60 border-2 border-violet-200 rounded-2xl p-10 text-center text-sm text-slate-600">
          Belum ada program atau dokumen SILOKA pada kategori {activePillar}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSilokaItems.map((item) => {
            const style = PILLAR_STYLE[item.pillar] || PILLAR_STYLE.Perencanaan;
            const isDataFile = item.fileUrl.startsWith('data:');
            return (
              <article
                key={item.id}
                className={`card-interactive border-2 rounded-2xl overflow-hidden flex flex-col shadow-xs ${style.card}`}
              >
                <div className={`h-1.5 w-full ${style.bar}`} />
                <div className="aspect-[16/10] overflow-hidden border-b border-slate-200/80">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    fallbackTitle={item.pillar}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className={`inline-flex items-center gap-1.5 font-bold ${style.text}`}>
                        <Icon3D name={style.icon} tone={style.tone} size="xs" />
                        {item.pillar}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.status === 'terpublikasi'
                            ? 'text-emerald-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {item.status === 'terpublikasi' ? 'Terpublikasi' : 'Draf'}
                      </span>
                    </div>
                    <h3 className="font-editorial text-lg font-semibold text-[#132A2E] mt-2 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {item.fileUrl && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 via-white to-indigo-50/75 border-2 border-sky-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon3D name="file-text" tone="sky" size="sm" variant="tile" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#132A2E] truncate">
                              {item.fileName || 'Dokumen Lampiran'}
                            </p>
                            {item.fileSize && (
                              <p className="text-[11px] font-mono tabular-nums text-slate-500">
                                {item.fileSize}
                              </p>
                            )}
                          </div>
                        </div>
                        {isDataFile ? (
                          <a
                            href={item.fileUrl}
                            download={item.fileName || 'dokumen-siloka'}
                            className="btn-3d inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="download" tone="white" size="xs" />
                            Unduh
                          </a>
                        ) : (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-3d inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="external" tone="white" size="xs" />
                            Buka
                          </a>
                        )}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-600">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon3D name="calendar" tone="violet" size="xs" />
                          {item.periodDate}
                        </span>
                        {item.targetGroup && (
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#132A2E]">
                            <Icon3D name="users" tone="emerald" size="xs" />
                            <span className="truncate max-w-[165px]">{item.targetGroup}</span>
                          </span>
                        )}
                      </div>
                      <p className="inline-flex items-start gap-1.5 text-[#132A2E]">
                        <Icon3D name="award" tone="amber" size="xs" className="mt-0.5" />
                        <span>{item.outcome}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 inline-flex items-center gap-1.5">
                        <Icon3D name="clipboard" tone="sky" size="xs" />
                        Koordinator: {item.coordinator}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Lower Section: Layanan Aspirasi & Pengaduan Masyarakat */}
      <section id="siloka-pengaduan" className="pt-10 border-t-2 border-violet-200 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2">
              <Icon3D name="megaphone" tone="violet" size="sm" variant="tile" />
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                Kanal Partisipasi Publik SILOKA
              </p>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#132A2E] mt-2">
              Layanan Aspirasi &amp; Pengaduan Masyarakat
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-2xl">
              Bagian dari pilar evaluasi layanan sekolah bagi orang tua murid, komite sekolah, dan warga Desa Sukawangi untuk menyampaikan saran atau pengaduan yang ditindaklanjuti langsung oleh Kepala Sekolah.
            </p>
          </div>
          <div className="lg:col-span-4 card-interactive bg-gradient-to-br from-violet-100/90 via-white to-indigo-100/75 border-2 border-violet-300 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-violet-900">Komitmen Tindak Lanjut</p>
              <p className="font-mono text-base font-bold text-violet-700 tabular-nums">
                Maksimal 1×24 Jam Kerja
              </p>
              <p className="text-[11px] text-violet-900/75">
                Ditangani langsung oleh Neng Linlin Irmawati, S.Pd.
              </p>
            </div>
            <Icon3D name="clock" tone="violet" size="lg" variant="tile" />
          </div>
        </div>

        {!user ? (
          <div className="bg-gradient-to-br from-violet-100/70 via-white to-sky-100/70 border-2 border-violet-300 rounded-3xl p-8 text-center max-w-2xl mx-auto shadow-sm">
            <div className="flex justify-center mb-4">
              <Icon3D name="siloka" tone="violet" size="xl" variant="tile" />
            </div>
            <h3 className="font-editorial text-xl font-semibold text-[#132A2E]">
              Verifikasi Identitas untuk Mengirim &amp; Melacak Tiket Pengaduan
            </h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Masuk dengan akun Google agar setiap pengaduan memiliki nomor tiket resmi yang dapat Anda pantau progres tanggapannya secara pribadi dan aman.
            </p>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="btn-3d mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-xl"
            >
              <Icon3D name="login" tone="white" size="sm" />
              Masuk dengan Akun Google
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Submission Form */}
            <div className="lg:col-span-5 bg-white border-2 border-violet-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <Icon3D name="send" tone="violet" size="md" variant="tile" />
                <div>
                  <h3 className="font-editorial text-xl font-semibold text-[#132A2E]">
                    Kirim Pengaduan atau Saran
                  </h3>
                  <p className="text-xs text-slate-600">
                    Identitas pelapor dijaga kerahasiaannya dan hanya dilihat oleh pengelola sekolah.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                    Nama Pelapor
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-violet-200 rounded-xl focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                      Peran
                    </label>
                    <select
                      value={reporterRole}
                      onChange={(e) => setReporterRole(e.target.value as SilokaRole)}
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-violet-200 rounded-xl focus:outline-none focus:border-violet-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                      Kategori
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as SilokaCategory)}
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-violet-200 rounded-xl focus:outline-none focus:border-violet-500"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                    Perihal / Judul Laporan
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    maxLength={160}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Contoh: Perbaikan Keran Air Depan Kelas 3"
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-violet-200 rounded-xl focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                    Uraian Lengkap
                  </label>
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan detail pengaduan atau saran secara jelas..."
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-violet-200 rounded-xl focus:outline-none focus:border-violet-500"
                  />
                </div>

                {createdTicket && (
                  <div className="flex items-start gap-2.5 text-xs text-emerald-900 bg-emerald-50 border-2 border-emerald-200 p-3 rounded-xl">
                    <Icon3D name="check-circle" tone="emerald" size="xs" className="mt-0.5" />
                    <span>
                      Pengaduan diterima dengan kode tiket{' '}
                      <strong className="font-mono">{createdTicket}</strong>. Anda dapat memantau status tanggapannya di sebelah kanan.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-3d w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 rounded-xl disabled:opacity-60"
                >
                  <Icon3D name="send" tone="white" size="sm" />
                  {submitting ? 'Mengirim Tiket...' : 'Kirim Pengaduan SILOKA'}
                </button>
              </form>
            </div>

            {/* Ticket Tracking List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-editorial text-xl font-semibold text-[#132A2E]">
                  Riwayat Tiket Pengaduan Anda ({silokaComplaints.length})
                </h3>
              </div>

              {silokaComplaints.length === 0 ? (
                <div className="bg-gradient-to-br from-violet-50/50 via-white to-sky-50/50 border-2 border-violet-200 rounded-2xl p-8 text-center text-sm text-slate-600">
                  Belum ada pengaduan yang Anda kirimkan. Gunakan formulir di samping jika ada masukan atau kendala yang ingin disampaikan.
                </div>
              ) : (
                <div className="space-y-4">
                  {silokaComplaints.map((ticket) => (
                    <article
                      key={ticket.id}
                      className="card-interactive bg-white border-2 border-violet-200 hover:border-violet-400 rounded-2xl p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-bold text-violet-700">
                            {ticket.ticketCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{ticket.category}</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                            ticket.status === 'Selesai'
                              ? 'text-emerald-700'
                              : ticket.status === 'Diproses'
                              ? 'text-amber-700'
                              : 'text-sky-700'
                          }`}
                        >
                          <Icon3D
                            name={ticket.status === 'Selesai' ? 'check-circle' : 'clock'}
                            tone={
                              ticket.status === 'Selesai'
                                ? 'emerald'
                                : ticket.status === 'Diproses'
                                ? 'amber'
                                : 'sky'
                            }
                            size="xs"
                          />
                          {ticket.status}
                        </span>
                      </div>

                      {editingId === ticket.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-violet-200 rounded-xl"
                          />
                          <textarea
                            rows={3}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="w-full px-3 py-1.5 text-sm border border-violet-200 rounded-xl"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void handleSaveEdit(ticket.id)}
                              className="btn-3d px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl"
                            >
                              Simpan Perubahan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="text-base font-semibold text-[#132A2E]">
                            {ticket.subject}
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {ticket.description}
                          </p>
                          {ticket.status === 'Diterima' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(ticket.id);
                                setEditSubject(ticket.subject);
                                setEditDescription(ticket.description);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
                            >
                              <Icon3D name="pencil" tone="violet" size="xs" />
                              Sunting Uraian
                            </button>
                          )}
                        </>
                      )}

                      {ticket.adminResponse && (
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50/75 border border-emerald-200 rounded-xl p-3.5 text-xs space-y-1">
                          <p className="font-semibold text-emerald-800">
                            Tanggapan Resmi Sekolah ({ticket.respondedBy || 'Admin SDN Cikawao'}):
                          </p>
                          <p className="text-[#132A2E] leading-relaxed">{ticket.adminResponse}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
