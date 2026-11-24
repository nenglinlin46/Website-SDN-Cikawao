import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SCHOOL_IDENTITY, SCHOOL_IMAGES } from '../data/seedData';
import type { AppTab, NewsArticle } from '../types';
import { Icon3D, type Icon3DTone } from './Icon3D';
import { SafeImage } from './SafeImage';
import { VisiMisiShowcase } from './VisiMisiShowcase';

interface HomeSectionProps {
  onNavigate: (tab: AppTab) => void;
}

const NEWS_CATEGORY_COLOR: Record<string, { text: string; bar: string; card: string }> = {
  Akademik: {
    text: 'text-sky-700',
    bar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    card: 'border-sky-200 hover:border-sky-400 bg-gradient-to-b from-white to-sky-50/40',
  },
  Prestasi: {
    text: 'text-amber-700',
    bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    card: 'border-amber-200 hover:border-amber-400 bg-gradient-to-b from-white to-amber-50/40',
  },
  Kegiatan: {
    text: 'text-orange-700',
    bar: 'bg-gradient-to-r from-orange-400 to-rose-500',
    card: 'border-orange-200 hover:border-orange-400 bg-gradient-to-b from-white to-orange-50/40',
  },
  'Kurikulum Merdeka': {
    text: 'text-emerald-700',
    bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    card: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-b from-white to-emerald-50/40',
  },
};

const PRIORITY_STYLE: Record<string, { label: string; text: string; bg: string; tone: Icon3DTone }> = {
  mendesak: {
    label: 'Mendesak',
    text: 'text-rose-800',
    bg: 'bg-gradient-to-br from-rose-50 via-white to-orange-50/80 border-rose-200 hover:border-rose-400',
    tone: 'rose',
  },
  penting: {
    label: 'Penting',
    text: 'text-amber-800',
    bg: 'bg-gradient-to-br from-amber-50 via-white to-yellow-50/80 border-amber-200 hover:border-amber-400',
    tone: 'amber',
  },
  info: {
    label: 'Informasi',
    text: 'text-sky-800',
    bg: 'bg-gradient-to-br from-sky-50 via-white to-teal-50/80 border-sky-200 hover:border-sky-400',
    tone: 'sky',
  },
};

export const HomeSection: React.FC<HomeSectionProps> = ({ onNavigate }) => {
  const { isAdmin, news, announcements, inputtedGallery, pkksItems, jabarBeraksi, staffMembers } =
    useSchool();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showAllNews, setShowAllNews] = useState(false);

  const guruCount = staffMembers.filter((m) => m.category === 'Guru').length;
  const tendikCount = staffMembers.filter((m) => m.category === 'Tenaga Kependidikan').length;

  const activeAnnouncements = announcements.filter((a) => a.isActive).slice(0, 3);
  const publishedNews = news.filter((item) => item.status === 'published');
  const featuredNews = showAllNews ? publishedNews : publishedNews.slice(0, 3);
  const featuredGallery = inputtedGallery.slice(0, 4);

  const quickServices: Array<{
    tab: AppTab;
    title: string;
    subtitle: string;
    metric: string;
    color: string;
    border: string;
    accentText: string;
    tone: Icon3DTone;
    icon: React.ReactNode;
    spanClass?: string;
  }> = [
    {
      tab: 'akademik',
      title: 'Cek NISN Siswa & Info KBM',
      subtitle:
        'Pencarian NISN resmi peserta didik menggunakan Nama Siswa atau NIK 16 digit beserta informasi Kurikulum Merdeka.',
      metric: 'Pencarian NISN · 6 Rombel',
      color: 'bg-gradient-to-br from-sky-100/80 via-white to-blue-100/75',
      border: 'border-sky-300 hover:border-sky-500',
      accentText: 'text-sky-800',
      tone: 'sky',
      icon: <Icon3D name="graduation" tone="sky" size="lg" variant="tile" />,
    },
    {
      tab: 'profil',
      title: 'Profil Sekolah & Direktori GTK',
      subtitle:
        'Sambutan Kepala Sekolah, visi misi, struktur rombongan belajar, dan daftar resmi Guru & Tenaga Kependidikan.',
      metric: `${guruCount} Guru · ${tendikCount} Tendik`,
      color: 'bg-gradient-to-br from-emerald-100/80 via-white to-teal-100/75',
      border: 'border-emerald-300 hover:border-emerald-500',
      accentText: 'text-emerald-800',
      tone: 'emerald',
      icon: <Icon3D name="users" tone="emerald" size="lg" variant="tile" />,
    },
    {
      tab: 'jabar-beraksi',
      title: 'Jabar Beraksi & Dokumen Program',
      subtitle:
        'Pelaporan & arsip dokumen Pendidikan Karakter, Digitalisasi Pembelajaran, Kualitas Dapodik, SPMI, dan Analisis Daya Tampung.',
      metric: `${jabarBeraksi.length} Laporan & Berkas`,
      color: 'bg-gradient-to-br from-amber-100/85 via-white to-yellow-100/80',
      border: 'border-amber-300 hover:border-amber-500',
      accentText: 'text-amber-800',
      tone: 'amber',
      icon: <Icon3D name="award" tone="amber" size="lg" variant="tile" />,
    },
    {
      tab: 'pkks-galeri',
      title: 'PKKS & Galeri Sekolah',
      subtitle:
        'Indikator kinerja manajerial Kepala Sekolah beserta dokumentasi foto & video kegiatan belajar mengajar SDN Cikawao.',
      metric: `${pkksItems.length} Indikator · ${inputtedGallery.length} Media Diunggah`,
      color: 'bg-gradient-to-br from-orange-100/85 via-white to-rose-100/75',
      border: 'border-orange-300 hover:border-orange-500',
      accentText: 'text-orange-800',
      tone: 'orange',
      icon: <Icon3D name="camera" tone="orange" size="lg" variant="tile" />,
    },
    {
      tab: 'siloka',
      title: 'SILOKA Sekolah & Aspirasi',
      subtitle:
        'Perencanaan, Pengorganisasian, Pelaksana, Program Unggulan, Evaluasi mutu, serta kanal pengaduan masyarakat.',
      metric: '5 Pilar · Layanan Publik',
      color: 'bg-gradient-to-br from-violet-100/85 via-white to-indigo-100/75',
      border: 'border-violet-300 hover:border-violet-500',
      accentText: 'text-violet-800',
      tone: 'violet',
      icon: <Icon3D name="siloka" tone="violet" size="lg" variant="tile" />,
    },
    {
      tab: 'game',
      title: 'Game Belajar Sambil Bermain',
      subtitle:
        'Kumpulan permainan edukasi Matematika, Memori Kata Sunda, Pilah Sampah, Susun Kata, dan Kuis IPAS untuk siswa.',
      metric: '5 Game Interaktif · Kelas 1–6',
      color: 'bg-gradient-to-br from-rose-100/85 via-white to-pink-100/75',
      border: 'border-rose-300 hover:border-rose-500',
      accentText: 'text-rose-800',
      tone: 'rose',
      icon: <Icon3D name="gamepad" tone="rose" size="lg" variant="tile" />,
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Beranda Colorful Hero Band */}
      <section className="bg-gradient-to-br from-emerald-100/75 via-sky-50/75 to-amber-100/75 border-b-2 border-amber-200/80 pb-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-2 border-amber-300 p-1.5 shadow-md shrink-0 flex items-center justify-center">
                    <img
                      src={SCHOOL_IMAGES.logo}
                      alt="Logo Resmi SD Negeri Cikawao Kec. Pamulihan 1956"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800 inline-flex items-center gap-1.5">
                      <Icon3D name="school" tone="emerald" size="xs" />
                      <span>SD Negeri Cikawao · Berdiri {SCHOOL_IDENTITY.foundedYear}</span>
                    </p>
                    <p className="text-xs text-sky-900/80 font-medium mt-0.5 tabular-nums">
                      NPSN {SCHOOL_IDENTITY.npsn} · Kurikulum Merdeka · Kec. Pamulihan
                    </p>
                  </div>
                </div>

                <h1 className="font-editorial text-[clamp(2.15rem,3.7vw,3.45rem)] leading-[1.12] font-semibold tracking-tight text-[#132A2E] text-balance max-w-xl">
                  Selamat Datang di Portal Resmi SDN Cikawao Sumedang.
                </h1>
                <p className="mt-4 text-[15px] sm:text-base text-slate-700 leading-relaxed max-w-[60ch]">
                  Pusat informasi terpadu kegiatan belajar mengajar, berita sekolah, notifikasi
                  otomatis orang tua, pelaporan Jabar Beraksi, PKKS, layanan SILOKA, serta galeri
                  foto dan video kegiatan siswa secara real-time.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('akademik')}
                  className="btn-3d inline-flex items-center gap-2.5 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 border-b-[3px] border-emerald-800 rounded-xl whitespace-nowrap shrink-0"
                >
                  <Icon3D name="graduation" tone="white" size="sm" />
                  <span>Cek NISN &amp; Akademik</span>
                  <Icon3D name="arrow-right" tone="white" size="xs" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('profil')}
                  className="btn-3d inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-sky-900 bg-gradient-to-r from-sky-100 to-amber-100 hover:from-sky-200 hover:to-amber-200 border border-sky-300 border-b-[3px] rounded-xl whitespace-nowrap shrink-0"
                >
                  <Icon3D name="users" tone="sky" size="sm" />
                  <span>Lihat Profil &amp; Guru</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border-2 border-emerald-300 shadow-lg">
                <SafeImage
                  src={SCHOOL_IMAGES.hero}
                  alt="Halaman dan gedung utama SDN Cikawao di Desa Sukawangi, Kec. Pamulihan"
                  fallbackTitle="Kampus SDN Cikawao"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-amber-300">
                      Kepala Sekolah: {SCHOOL_IDENTITY.principal.name}
                    </p>
                    <p className="text-xs text-white/95 flex items-center gap-1.5 mt-1">
                      <Icon3D name="map-pin" tone="amber" size="xs" />
                      <span>{SCHOOL_IDENTITY.address}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Colorful Snapshot Strip with 3D Icon Tiles */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-emerald-100/90 via-white to-teal-100/70 border-2 border-emerald-300 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-emerald-900">Peserta Didik Aktif</p>
                <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
                  184
                </p>
                <p className="mt-1 text-xs text-emerald-900/80">Siswa Kelas 1 sampai 6</p>
              </div>
              <Icon3D name="graduation" tone="emerald" size="lg" variant="tile" />
            </div>
            <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-sky-100/90 via-white to-blue-100/70 border-2 border-sky-300 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-sky-900">Rombongan Belajar</p>
                <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-sky-700 tabular-nums">
                  6
                </p>
                <p className="mt-1 text-xs text-sky-900/80">Fase A, Fase B, dan Fase C</p>
              </div>
              <Icon3D name="layers" tone="sky" size="lg" variant="tile" />
            </div>
            <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-amber-100/90 via-white to-yellow-100/70 border-2 border-amber-300 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-amber-900">Pendidik &amp; Tendik</p>
                <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-amber-700 tabular-nums">
                  {staffMembers.length}
                </p>
                <p className="mt-1 text-xs text-amber-900/80 tabular-nums">
                  {guruCount} Guru · {tendikCount} Tendik
                </p>
              </div>
              <Icon3D name="users" tone="amber" size="lg" variant="tile" />
            </div>
            <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-orange-100/90 via-white to-rose-100/70 border-2 border-orange-300 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-orange-900">Kurikulum &amp; NPSN</p>
                <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-orange-700 tabular-nums">
                  20208591
                </p>
                <p className="mt-1 text-xs text-orange-900/80">Kurikulum Merdeka</p>
              </div>
              <Icon3D name="award" tone="orange" size="lg" variant="tile" />
            </div>
          </div>
        </div>
      </section>

      {/* Visi Misi Berjalan Elegan */}
      <VisiMisiShowcase variant="banner" onOpenProfile={() => onNavigate('profil')} />

      {/* Papan Pengumuman & Siaran Orang Tua */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <Icon3D name="megaphone" tone="amber" size="lg" variant="tile" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Informasi Terkini Sekolah</p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#132A2E] mt-0.5">
                Pengumuman Penting Orang Tua
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('akademik')}
            className="btn-3d inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-300 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0"
          >
            <Icon3D name="bell-ring" tone="emerald" size="xs" />
            Atur Notifikasi Akademik
          </button>
        </div>

        {activeAnnouncements.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
            Belum ada pengumuman aktif saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {activeAnnouncements.map((ann) => {
              const pStyle = PRIORITY_STYLE[ann.priority] || PRIORITY_STYLE.info;
              return (
                <article
                  key={ann.id}
                  className={`card-interactive rounded-2xl border-2 p-5 flex flex-col justify-between ${pStyle.bg}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${pStyle.text}`}>{pStyle.label}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ann.targetAudience}</span>
                      </div>
                      <Icon3D name="bell-ring" tone={pStyle.tone} size="sm" />
                    </div>
                    <h3 className="text-base font-semibold text-[#132A2E] mt-2 leading-snug">
                      {ann.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                      {ann.message}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium mt-4 pt-3 border-t border-black/5">
                    Diterbitkan oleh {ann.authorName}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Akses Cepat Layanan Digital Sekolah */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t-2 border-amber-200/80 pt-12 mb-7 flex items-center gap-3.5">
          <Icon3D name="dashboard" tone="sky" size="lg" variant="tile" />
          <div>
            <p className="text-xs font-semibold text-sky-700">Navigasi Layanan Terpadu</p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#132A2E] mt-0.5">
              Jelajahi Layanan Portal SDN Cikawao
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quickServices.map((svc) => (
            <button
              key={svc.tab}
              type="button"
              onClick={() => onNavigate(svc.tab)}
              className={`card-interactive text-left rounded-2xl border-2 p-6 flex flex-col justify-between transition-all ${svc.color} ${svc.border} ${
                svc.spanClass || ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  {svc.icon}
                  <Icon3D name="arrow-right" tone={svc.tone} size="md" />
                </div>
                <h3 className="font-editorial text-lg font-semibold text-[#132A2E] mt-4">
                  {svc.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                  {svc.subtitle}
                </p>
              </div>
              <p className={`text-xs font-bold mt-4 tabular-nums ${svc.accentText}`}>
                {svc.metric}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Kenali Guru & Tenaga Kependidikan */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t-2 border-emerald-200/80 pt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div className="flex items-center gap-3.5">
            <Icon3D name="users" tone="emerald" size="lg" variant="tile" />
            <div>
              <p className="text-xs font-semibold text-emerald-700">Keluarga Besar Pendidik</p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#132A2E] mt-0.5">
                Guru &amp; Tenaga Kependidikan SDN Cikawao
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('profil')}
            className="btn-3d inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0"
          >
            <Icon3D name="users" tone="emerald" size="xs" />
            <span>Lihat Direktori Lengkap ({staffMembers.length}) →</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {staffMembers.slice(0, 5).map((member, idx) => {
            const stripeColors = [
              'from-emerald-400 to-teal-500 border-emerald-200 hover:border-emerald-400',
              'from-sky-400 to-blue-500 border-sky-200 hover:border-sky-400',
              'from-amber-400 to-orange-500 border-amber-200 hover:border-amber-400',
              'from-violet-400 to-purple-500 border-violet-200 hover:border-violet-400',
              'from-rose-400 to-pink-500 border-rose-200 hover:border-rose-400',
            ];
            const theme = stripeColors[idx % stripeColors.length];
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onNavigate('profil')}
                className={`card-interactive text-left bg-white border-2 rounded-2xl overflow-hidden flex flex-col justify-between ${theme}`}
              >
                <div className={`h-1.5 w-full bg-gradient-to-r ${theme.split(' ')[0]} ${theme.split(' ')[1]}`} />
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <div className="aspect-square rounded-xl overflow-hidden border-2 border-slate-100 bg-slate-50 mb-3 shadow-2xs">
                      {member.photoUrl ? (
                        <SafeImage
                          src={member.photoUrl}
                          alt={`Foto ${member.fullName}`}
                          fallbackTitle={member.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 via-sky-100 to-amber-100 text-emerald-800 font-editorial text-2xl font-bold">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <p
                      className={`text-[11px] font-bold ${
                        member.category === 'Guru' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {member.category === 'Tenaga Kependidikan' ? 'Tendik' : 'Guru'} ·{' '}
                      {member.employmentStatus}
                    </p>
                    <h3 className="text-sm font-semibold text-[#132A2E] mt-0.5 line-clamp-1">
                      {member.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-600 line-clamp-1">{member.role}</p>
                  </div>
                  {member.motto && (
                    <p className="text-[11px] italic text-slate-600 line-clamp-3 leading-relaxed border-t border-slate-100 pt-2.5">
                      “{member.motto}”
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sorotan Berita & Galeri Kegiatan */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t-2 border-orange-200/80 pt-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div className="flex items-center gap-3.5">
            <Icon3D name="newspaper" tone="orange" size="lg" variant="tile" />
            <div>
              <p className="text-xs font-semibold text-orange-700">Kabar &amp; Dokumentasi</p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#132A2E] mt-0.5">
                Berita &amp; Galeri Kegiatan Sekolah
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {publishedNews.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllNews((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800 hover:bg-sky-100 whitespace-nowrap shrink-0 tabular-nums"
              >
                {showAllNews
                  ? 'Tampilkan Ringkas'
                  : `Semua Berita (${publishedNews.length}) →`}
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('pkks-galeri')}
              className="btn-3d inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 text-xs font-semibold text-orange-800 whitespace-nowrap shrink-0"
            >
              <Icon3D name="camera" tone="orange" size="xs" />
              <span>Semua Galeri →</span>
            </button>
          </div>
        </div>

        {featuredNews.length === 0 && featuredGallery.length === 0 ? (
          <div className="bg-gradient-to-br from-white via-orange-50/40 to-amber-50/50 border-2 border-orange-200 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <Icon3D name="camera" tone="orange" size="lg" variant="tile" />
              <div>
                <h3 className="font-editorial text-lg font-semibold text-[#132A2E]">
                  Belum Ada Berita atau Dokumentasi yang Diinputkan
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                  Berita sekolah serta foto maupun video kegiatan yang diinputkan melalui Dashboard
                  Admin akan otomatis tampil pada bagian ini.
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="btn-3d inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 border-b-[3px] border-emerald-800 text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                <Icon3D name="plus" tone="white" size="xs" />
                <span>Input di Dashboard Admin</span>
              </button>
            )}
          </div>
        ) : (
          featuredNews.length > 0 && (
            <div
              className={`grid grid-cols-1 gap-6 ${
                featuredNews.length === 1
                  ? 'max-w-2xl'
                  : featuredNews.length === 2
                    ? 'lg:grid-cols-2'
                    : 'lg:grid-cols-3'
              }`}
            >
              {featuredNews.map((article) => {
                const catStyle = NEWS_CATEGORY_COLOR[article.category] || NEWS_CATEGORY_COLOR['Kurikulum Merdeka'];
                return (
                  <article
                    key={article.id}
                    onClick={() => setSelectedArticle(article)}
                    className={`card-interactive cursor-pointer border-2 rounded-2xl overflow-hidden flex flex-col justify-between ${catStyle.card}`}
                  >
                    <div>
                      <div className={`h-1.5 w-full ${catStyle.bar}`} />
                      <div className="aspect-[16/10] overflow-hidden border-b border-slate-100">
                        <SafeImage
                          src={article.imageUrl}
                          alt={article.title}
                          fallbackTitle={article.category}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className={`font-bold ${catStyle.text}`}>{article.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{article.publishedDate}</span>
                        </div>
                        <h3 className="font-editorial text-lg font-semibold text-[#132A2E] mt-2 leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                          {article.summary}
                        </p>
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedArticle(article);
                        }}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        <Icon3D name="book" tone="emerald" size="xs" />
                        <span>Baca Artikel</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        )}

        {featuredGallery.length > 0 && (
          <div
            className={`${featuredNews.length > 0 ? 'mt-8' : ''} grid gap-4 ${
              featuredGallery.length <= 2
                ? 'grid-cols-1 sm:grid-cols-2'
                : featuredGallery.length === 3
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : 'grid-cols-2 lg:grid-cols-4'
            }`}
          >
            {featuredGallery.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate('pkks-galeri')}
                className="card-interactive group text-left bg-gradient-to-b from-white to-amber-50/40 border-2 border-amber-200 hover:border-orange-400 rounded-2xl overflow-hidden"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.title}
                    fallbackTitle={item.category}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.mediaType === 'video' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Icon3D name="play" tone="orange" size="lg" variant="tile" />
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-[11px] font-bold text-orange-700">
                    {item.category} · {item.takenDate}
                  </p>
                  <p className="text-xs font-semibold text-[#132A2E] mt-0.5 line-clamp-1">
                    {item.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Full News Reader Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedArticle.title}
        >
          <div className="bg-white border-2 border-amber-300 rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-amber-50 via-white to-sky-50 border-b border-amber-200 px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span
                  className={`font-bold ${
                    (NEWS_CATEGORY_COLOR[selectedArticle.category] || NEWS_CATEGORY_COLOR['Kurikulum Merdeka']).text
                  }`}
                >
                  {selectedArticle.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon3D name="calendar" tone="amber" size="xs" />
                  {selectedArticle.publishedDate}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                aria-label="Tutup berita"
                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100"
              >
                <Icon3D name="close" tone="rose" size="sm" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <h2 className="font-editorial text-2xl font-semibold text-[#132A2E] leading-snug">
                {selectedArticle.title}
              </h2>
              <p className="text-xs text-slate-500">Ditulis oleh {selectedArticle.authorName}</p>
              <div className="aspect-[16/9] rounded-xl overflow-hidden border-2 border-sky-200">
                <SafeImage
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4 text-[15px] text-[#132A2E] leading-relaxed whitespace-pre-line">
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
