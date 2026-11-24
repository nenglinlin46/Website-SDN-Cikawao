import React, { useMemo, useRef, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { JABAR_BERAKSI_PILLARS, SCHOOL_IMAGES } from '../data/seedData';
import type { EkskulType } from '../types';
import { Icon3D, type Icon3DName, type Icon3DTone } from './Icon3D';
import { SafeImage } from './SafeImage';

const JABAR_FILTERS: Array<'Semua' | EkskulType> = ['Semua', ...JABAR_BERAKSI_PILLARS];

const PILLAR_STYLE: Record<
  EkskulType,
  {
    text: string;
    card: string;
    bar: string;
    tone: Icon3DTone;
    icon: Icon3DName;
    activeBtn: string;
  }
> = {
  'Pendidikan Karakter': {
    text: 'text-emerald-800',
    card: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-b from-white to-emerald-50/45',
    bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    tone: 'emerald',
    icon: 'award',
    activeBtn: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm',
  },
  'Digitalisasi Pembelajaran': {
    text: 'text-sky-800',
    card: 'border-sky-200 hover:border-sky-400 bg-gradient-to-b from-white to-sky-50/45',
    bar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    tone: 'sky',
    icon: 'book',
    activeBtn: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm',
  },
  'Kualitas Dapodik': {
    text: 'text-amber-800',
    card: 'border-amber-200 hover:border-amber-400 bg-gradient-to-b from-white to-amber-50/45',
    bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    tone: 'amber',
    icon: 'database',
    activeBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm',
  },
  SPMI: {
    text: 'text-violet-800',
    card: 'border-violet-200 hover:border-violet-400 bg-gradient-to-b from-white to-violet-50/45',
    bar: 'bg-gradient-to-r from-violet-400 to-indigo-500',
    tone: 'violet',
    icon: 'file-check',
    activeBtn: 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-sm',
  },
  'Analisis Daya Tampung': {
    text: 'text-orange-800',
    card: 'border-orange-200 hover:border-orange-400 bg-gradient-to-b from-white to-orange-50/45',
    bar: 'bg-gradient-to-r from-orange-400 to-rose-500',
    tone: 'orange',
    icon: 'layers',
    activeBtn: 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm',
  },
};

const MAX_RAW_FILE_BYTES = 450 * 1024;
const MAX_ENCODED_FILE_URL_LENGTH = 700000;

function formatReadableFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = Math.round(bytes / 1024);
  return `${kb} KB`;
}

export const JabarBeraksiSection: React.FC = () => {
  const { user, isAdmin, jabarBeraksi, saveJabarBeraksi, signInWithGoogle } = useSchool();
  const [activeFilter, setActiveFilter] = useState<'Semua' | EkskulType>('Semua');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [ekskulType, setEkskulType] = useState<EkskulType>('Pendidikan Karakter');
  const [coachName, setCoachName] = useState('');
  const [activityDate, setActivityDate] = useState('23 November 2026');
  const [participantCount, setParticipantCount] = useState(184);
  const [characterOutcome, setCharacterOutcome] = useState('');
  const [description, setDescription] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState('');

  const visibleReports = useMemo(() => {
    const base = isAdmin
      ? jabarBeraksi
      : jabarBeraksi.filter((r) => r.status === 'terverifikasi');
    if (activeFilter === 'Semua') return base;
    return base.filter((r) => r.ekskulType === activeFilter);
  }, [jabarBeraksi, isAdmin, activeFilter]);

  const totalDocuments = useMemo(
    () => visibleReports.filter((r) => Boolean(r.fileUrl)).length,
    [visibleReports]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');

    if (file.size > MAX_RAW_FILE_BYTES) {
      setFileError(
        'Ukuran file melebihi 450 KB. Untuk dokumen besar, unggah ke Google Drive lalu tempel tautannya di kolom URL.'
      );
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result || result.length > MAX_ENCODED_FILE_URL_LENGTH) {
        setFileError('File gagal diproses atau terlalu besar. Gunakan tautan Google Drive / Belajar.id.');
        return;
      }
      setFileName(file.name.slice(0, 200));
      setFileUrl(result);
      setFileSize(formatReadableFileSize(file.size));
    };
    reader.onerror = () => {
      setFileError('Gagal membaca file dari perangkat.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (fileUrl.trim().length > MAX_ENCODED_FILE_URL_LENGTH) {
      setFileError('Lampiran melebihi batas ukuran. Gunakan tautan URL singkat.');
      return;
    }
    setSubmitting(true);
    try {
      await saveJabarBeraksi({
        title: title.trim(),
        ekskulType,
        coachName: coachName.trim() || user.displayName || 'Tim Pengembang Sekolah',
        activityDate: activityDate.trim(),
        participantCount: Number(participantCount) || 1,
        description: description.trim(),
        characterOutcome: characterOutcome.trim(),
        imageUrl: SCHOOL_IMAGES.ekskul,
        fileName: fileName.trim() || (fileUrl.trim() ? 'Dokumen_Pendukung_Jabar_Beraksi' : ''),
        fileUrl: fileUrl.trim(),
        fileSize: fileSize.trim() || (fileUrl.trim().startsWith('http') ? 'Tautan Dokumen' : ''),
        status: isAdmin ? 'terverifikasi' : 'menunggu',
      });
      setTitle('');
      setCoachName('');
      setCharacterOutcome('');
      setDescription('');
      setFileName('');
      setFileUrl('');
      setFileSize('');
      setFileError('');
      setModalOpen(false);
      setSubmitNotice(
        isAdmin
          ? 'Laporan dan dokumen Jabar Beraksi berhasil diterbitkan langsung.'
          : 'Laporan program berhasil dikirim dan menunggu verifikasi Admin sekolah.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-20">
      {/* Colorful Hero Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-amber-100/80 via-orange-50/75 to-sky-100/75 border-2 border-amber-300/80 p-6 sm:p-8 shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2.5">
                <Icon3D name="award" tone="amber" size="md" variant="tile" />
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Jabar Beraksi · 5 Pilar Transformasi Mutu SDN Cikawao
                </p>
              </div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#132A2E] mt-3 text-balance">
                Jawa Barat Bergerak Aktif Berkreasi dan Berprestasi
              </h1>
              <p className="text-[15px] text-slate-700 mt-4 leading-relaxed">
                Platform pelaporan dan arsip dokumen resmi SDN Cikawao untuk lima fokus program Jabar Beraksi: Pendidikan Karakter, Digitalisasi Pembelajaran, Kualitas Dapodik, Sistem Penjaminan Mutu Internal (SPMI), dan Analisis Daya Tampung satuan pendidikan.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {user ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="btn-3d inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-xl whitespace-nowrap shrink-0"
                >
                  <Icon3D name="plus" tone="white" size="sm" />
                  Tambah Program &amp; File
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="btn-3d inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-xl whitespace-nowrap shrink-0"
                >
                  <Icon3D name="login" tone="white" size="sm" />
                  Masuk Guru / Admin untuk Unggah Laporan
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="h-64 lg:h-full min-h-[260px] rounded-2xl overflow-hidden border-2 border-white shadow-lg">
              <SafeImage
                src={SCHOOL_IMAGES.ekskul}
                alt="Program Jabar Beraksi SDN Cikawao"
                fallbackTitle="Jabar Beraksi SDN Cikawao"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Strip with 3D Icon Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-amber-100/90 via-white to-orange-100/70 border-2 border-amber-300 shadow-xs flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-amber-900">Program &amp; Laporan Terpublikasi</p>
            <p className="mt-1 font-mono text-3xl font-bold text-amber-700 tabular-nums">
              {visibleReports.length}
            </p>
          </div>
          <Icon3D name="award" tone="amber" size="lg" variant="tile" />
        </div>
        <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-emerald-100/90 via-white to-teal-100/70 border-2 border-emerald-300 shadow-xs flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-emerald-900">Dokumen &amp; Berkas Terlampir</p>
            <p className="mt-1 font-mono text-3xl font-bold text-emerald-700 tabular-nums">
              {totalDocuments}
            </p>
          </div>
          <Icon3D name="folder-up" tone="emerald" size="lg" variant="tile" />
        </div>
        <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-sky-100/90 via-white to-indigo-100/70 border-2 border-sky-300 shadow-xs flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-sky-900">Pilar Jabar Beraksi</p>
            <p className="mt-1 font-mono text-3xl font-bold text-sky-700 tabular-nums">
              {JABAR_BERAKSI_PILLARS.length}
            </p>
          </div>
          <Icon3D name="layers" tone="sky" size="lg" variant="tile" />
        </div>
      </div>

      {submitNotice && (
        <div className="flex items-center gap-3 text-sm font-medium text-emerald-900 bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-2 border-emerald-300 rounded-2xl px-4 py-3.5 shadow-xs">
          <Icon3D name="check-circle" tone="emerald" size="sm" variant="tile" />
          <span>{submitNotice}</span>
        </div>
      )}

      {/* Colorful Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gradient-to-r from-amber-50 via-orange-50/70 to-sky-50 border-2 border-amber-200 rounded-2xl w-fit shadow-xs">
        {JABAR_FILTERS.map((f) => {
          const active = activeFilter === f;
          const activeClass =
            f === 'Semua'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm'
              : PILLAR_STYLE[f].activeBtn;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                active ? activeClass : 'text-amber-950/75 hover:bg-white/80'
              }`}
            >
              <Icon3D
                name={f === 'Semua' ? 'award' : PILLAR_STYLE[f].icon}
                tone={active ? 'white' : f === 'Semua' ? 'amber' : PILLAR_STYLE[f].tone}
                size="xs"
              />
              <span>{f}</span>
            </button>
          );
        })}
      </div>

      {/* Reports Grid */}
      {visibleReports.length === 0 ? (
        <div className="bg-gradient-to-br from-amber-50/60 via-white to-sky-50/60 border-2 border-amber-200 rounded-2xl p-10 text-center text-sm text-slate-600">
          Belum ada laporan atau dokumen untuk kategori {activeFilter}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleReports.map((report) => {
            const isDataFile = report.fileUrl.startsWith('data:');
            const pillarStyle = PILLAR_STYLE[report.ekskulType] || PILLAR_STYLE['Pendidikan Karakter'];
            return (
              <article
                key={report.id}
                className={`card-interactive border-2 rounded-2xl overflow-hidden flex flex-col shadow-xs ${pillarStyle.card}`}
              >
                <div className={`h-1.5 w-full ${pillarStyle.bar}`} />
                <div className="aspect-[16/10] overflow-hidden border-b border-slate-200/80">
                  <SafeImage
                    src={report.imageUrl}
                    alt={report.title}
                    fallbackTitle={report.ekskulType}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className={`inline-flex items-center gap-1.5 font-bold ${pillarStyle.text}`}>
                        <Icon3D name={pillarStyle.icon} tone={pillarStyle.tone} size="xs" />
                        {report.ekskulType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          report.status === 'terverifikasi'
                            ? 'text-emerald-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {report.status === 'terverifikasi'
                          ? 'Terverifikasi'
                          : 'Menunggu Verifikasi'}
                      </span>
                    </div>
                    <h3 className="font-editorial text-lg font-semibold text-[#132A2E] mt-2 leading-snug">
                      {report.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {report.fileUrl && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-sky-50 via-white to-indigo-50/75 border-2 border-sky-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon3D name="file-text" tone="sky" size="sm" variant="tile" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#132A2E] truncate">
                              {report.fileName || 'Dokumen Lampiran'}
                            </p>
                            {report.fileSize && (
                              <p className="text-[11px] font-mono tabular-nums text-slate-500">
                                {report.fileSize}
                              </p>
                            )}
                          </div>
                        </div>
                        {isDataFile ? (
                          <a
                            href={report.fileUrl}
                            download={report.fileName || 'dokumen-jabar-beraksi'}
                            className="btn-3d inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="download" tone="white" size="xs" />
                            Unduh
                          </a>
                        ) : (
                          <a
                            href={report.fileUrl}
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
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon3D name="calendar" tone="sky" size="xs" />
                          {report.activityDate}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono tabular-nums font-bold text-[#132A2E]">
                          <Icon3D name="users" tone="emerald" size="xs" />
                          {report.participantCount} Sasaran
                        </span>
                      </div>
                      <p className="inline-flex items-start gap-1.5 text-[#132A2E]">
                        <Icon3D name="award" tone="amber" size="xs" className="mt-0.5" />
                        <span>{report.characterOutcome}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Penanggung Jawab: {report.coachName}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Submit Report Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Kirim Laporan Jabar Beraksi"
        >
          <div className="bg-white border-2 border-amber-300 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-amber-200">
              <div className="flex items-center gap-2.5">
                <Icon3D name="folder-up" tone="amber" size="md" variant="tile" />
                <h2 className="font-editorial text-xl font-semibold text-[#132A2E]">
                  Tambah Program &amp; File Jabar Beraksi
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Tutup form"
                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <Icon3D name="close" tone="rose" size="sm" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                  Judul Program / Dokumen
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={160}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Validasi Data Residu Dapodik Semester Ganjil"
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                    Kategori Program
                  </label>
                  <select
                    value={ekskulType}
                    onChange={(e) => setEkskulType(e.target.value as EkskulType)}
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
                  >
                    {JABAR_BERAKSI_PILLARS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                    Jumlah Sasaran / Peserta
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={500}
                    value={participantCount}
                    onChange={(e) => setParticipantCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FFFDF7] border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                    Penanggung Jawab
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={coachName}
                    onChange={(e) => setCoachName(e.target.value)}
                    placeholder="Contoh: Rizki Maulana, S.Kom."
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                  Capaian / Hasil Program
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={300}
                  value={characterOutcome}
                  onChange={(e) => setCharacterOutcome(e.target.value)}
                  placeholder="Contoh: Data Dapodik valid 100% dan siap cetak SK"
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#132A2E] mb-1">
                  Uraian Singkat Program
                </label>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan pelaksanaan program dan hasil evaluasi..."
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-gradient-to-br from-sky-50 via-white to-indigo-50/75 border-2 border-sky-200 space-y-2.5">
                <label className="block text-xs font-bold text-sky-900">
                  Lampiran File / Dokumen (Opsional)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-3d inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg whitespace-nowrap shrink-0"
                  >
                    <Icon3D name="upload" tone="white" size="xs" />
                    Unggah File (Maks. 450 KB)
                  </button>
                  {fileUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setFileName('');
                        setFileUrl('');
                        setFileSize('');
                        setFileError('');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-lg hover:bg-rose-50"
                    >
                      <Icon3D name="close" tone="rose" size="xs" />
                      Hapus File
                    </button>
                  )}
                </div>
                {fileName && (
                  <p className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                    File terlampir: {fileName} {fileSize ? `(${fileSize})` : ''}
                  </p>
                )}
                <input
                  type="text"
                  value={fileUrl.startsWith('data:') ? '' : fileUrl}
                  onChange={(e) => {
                    setFileUrl(e.target.value);
                    if (!fileName && e.target.value.trim()) {
                      setFileName('Tautan Dokumen Program');
                      setFileSize('Tautan Eksternal');
                    }
                    setFileError('');
                  }}
                  placeholder={
                    fileUrl.startsWith('data:')
                      ? 'File unggahan aktif'
                      : 'Atau tempel tautan Google Drive / Belajar.id (https://...)'
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
                {fileError && (
                  <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                    {fileError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-3d inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl disabled:opacity-60"
                >
                  <Icon3D name="check" tone="white" size="xs" />
                  {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
