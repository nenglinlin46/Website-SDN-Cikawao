import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  ROMBEL_DISTRIBUTION,
  SCHOOL_IDENTITY,
  SCHOOL_IMAGES,
} from '../data/seedData';
import type { AppTab, StaffCategory } from '../types';
import { Icon3D, type Icon3DName, type Icon3DTone } from './Icon3D';
import { SafeImage } from './SafeImage';
import { VisiMisiShowcase } from './VisiMisiShowcase';

interface ProfileNewsSectionProps {
  onNavigate: (tab: AppTab) => void;
}

const MISI_ITEMS: Array<{
  no: string;
  color: string;
  cardBg: string;
  icon: Icon3DName;
  tone: Icon3DTone;
  title: string;
  desc: string;
}> = [
  {
    no: '01.',
    color: 'text-emerald-800',
    cardBg: 'bg-gradient-to-r from-emerald-50/80 to-white border-emerald-200 hover:border-emerald-400',
    icon: 'book',
    tone: 'emerald',
    title: 'Pembelajaran Berdiferensiasi Kurikulum Merdeka',
    desc: 'Menyelenggarakan KBM aktif, kreatif, dan menyenangkan sesuai fase perkembangan murid pada 6 rombongan belajar.',
  },
  {
    no: '02.',
    color: 'text-sky-800',
    cardBg: 'bg-gradient-to-r from-sky-50/80 to-white border-sky-200 hover:border-sky-400',
    icon: 'graduation',
    tone: 'sky',
    title: 'Penguatan Profil Pelajar Pancasila & Budaya Lokal',
    desc: 'Menanamkan akhlak mulia, gotong royong, dan kecintaan terhadap bahasa serta seni Sunda Sumedang melalui proyek P5.',
  },
  {
    no: '03.',
    color: 'text-amber-800',
    cardBg: 'bg-gradient-to-r from-amber-50/80 to-white border-amber-200 hover:border-amber-400',
    icon: 'award',
    tone: 'amber',
    title: 'Pengembangan Bakat Ekstrakurikuler Jabar Beraksi',
    desc: 'Mewadahi potensi siswa dalam Pramuka, angklung, olahraga, keagamaan, dan UKS secara aktif dan terdokumentasi.',
  },
  {
    no: '04.',
    color: 'text-violet-800',
    cardBg: 'bg-gradient-to-r from-violet-50/80 to-white border-violet-200 hover:border-violet-400',
    icon: 'siloka',
    tone: 'violet',
    title: 'Tata Kelola Sekolah Transparan & Akuntabel',
    desc: 'Melaksanakan supervisi mutu dan PKKS secara konsisten serta membuka layanan aspirasi masyarakat melalui SILOKA.',
  },
];

export const ProfileNewsSection: React.FC<ProfileNewsSectionProps> = ({ onNavigate }) => {
  const { staffMembers } = useSchool();
  const [directoryTab, setDirectoryTab] = useState<'guru' | 'rombel'>('guru');
  const [gtkFilter, setGtkFilter] = useState<'Semua' | StaffCategory>('Semua');

  const guruCount = staffMembers.filter((m) => m.category === 'Guru').length;
  const tendikCount = staffMembers.filter((m) => m.category === 'Tenaga Kependidikan').length;
  const visibleStaff =
    gtkFilter === 'Semua'
      ? staffMembers
      : staffMembers.filter((m) => m.category === gtkFilter);

  return (
    <div className="space-y-16 pb-20">
      {/* Cheerful Colorful Hero Band */}
      <section className="bg-gradient-to-br from-amber-100/75 via-[#FFFDF7] to-emerald-100/75 border-b-2 border-amber-200 pb-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 lg:pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <p className="text-xs font-bold text-sky-800 tracking-wide mb-3 inline-flex items-center gap-2">
                  <Icon3D name="school" tone="sky" size="xs" />
                  <span>NPSN 20208591 · Kurikulum Merdeka · Kab. Sumedang</span>
                </p>
                <h1 className="font-editorial text-[clamp(2.1rem,3.6vw,3.35rem)] leading-[1.12] font-semibold tracking-tight text-[#132A2E] text-balance max-w-xl">
                  Mendidik Generasi Cerdas, Berkarakter Pancasila, dan Cinta Budaya Sunda.
                </h1>
                <p className="mt-5 text-[15px] sm:text-base text-slate-700 leading-relaxed max-w-[60ch]">
                  Portal resmi SDN Cikawao di Desa Sukawangi, Kecamatan Pamulihan. Menyajikan informasi profil sekolah, galeri kegiatan belajar, transparansi PKKS dan Jabar Beraksi, layanan pengaduan Siloka, serta pemantauan perkembangan akademik siswa bagi orang tua secara real-time.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('akademik')}
                  className="btn-3d inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 border-b-[3px] border-emerald-800 rounded-xl whitespace-nowrap shrink-0"
                >
                  <Icon3D name="graduation" tone="white" size="sm" />
                  <span>Pantau Akademik Siswa</span>
                  <Icon3D name="arrow-right" tone="white" size="xs" />
                </button>
                <a
                  href="#direktori-gtk"
                  className="btn-3d inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-sky-900 bg-gradient-to-r from-sky-100 to-amber-100 hover:from-sky-200 hover:to-amber-200 border border-sky-300 border-b-[3px] rounded-xl whitespace-nowrap shrink-0"
                >
                  <Icon3D name="users" tone="sky" size="sm" />
                  <span>Lihat Guru &amp; Tendik</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-2xl overflow-hidden border-2 border-amber-300 shadow-lg">
                <SafeImage
                  src={SCHOOL_IMAGES.hero}
                  alt="Halaman dan gedung sekolah SDN Cikawao, Desa Sukawangi, Kec. Pamulihan, Sumedang"
                  fallbackTitle="Kampus SDN Cikawao Sumedang"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-xs font-medium text-amber-100 flex items-center gap-1.5">
                    <Icon3D name="map-pin" tone="amber" size="xs" />
                    <span>Jln. Nyampay RT 01 RW 09, Desa Sukawangi, Kec. Pamulihan</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Colorful School Stats Strip with 3D Icons */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-interactive p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-100/90 via-white to-teal-100/70 border-2 border-emerald-300 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-emerald-900">Peserta Didik Aktif</p>
                <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums">
                  184
                </p>
                <p className="mt-1 text-xs text-emerald-900/80">Siswa Kelas 1 sampai 6</p>
              </div>
              <Icon3D name="graduation" tone="emerald" size="lg" variant="tile" />
            </div>
            <div className="card-interactive p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-sky-100/90 via-white to-blue-100/70 border-2 border-sky-300 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-sky-900">Rombongan Belajar</p>
                <p className="mt-1 font-mono text-2xl sm:text-3xl font-bold text-sky-700 tabular-nums">
                  6
                </p>
                <p className="mt-1 text-xs text-sky-900/80">Fase A, Fase B, dan Fase C</p>
              </div>
              <Icon3D name="layers" tone="sky" size="lg" variant="tile" />
            </div>
            <div className="card-interactive p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-100/90 via-white to-yellow-100/70 border-2 border-amber-300 flex items-center justify-between gap-3">
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
            <div className="card-interactive p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-100/90 via-white to-rose-100/70 border-2 border-orange-300 flex items-center justify-between gap-3">
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

      {/* Sambutan Kepala Sekolah & Identitas Resmi */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-sky-300 bg-white shadow-md">
              <SafeImage
                src={SCHOOL_IMAGES.kepsek}
                alt="Neng Linlin Irmawati, S.Pd. — Kepala SDN Cikawao"
                fallbackTitle="Neng Linlin Irmawati, S.Pd."
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-sky-100/80 via-white to-teal-50 border-2 border-sky-200 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#132A2E]">
                  {SCHOOL_IDENTITY.principal.name}
                </p>
                <p className="text-xs text-sky-800 font-mono tabular-nums mt-0.5 font-semibold">
                  NIP. {SCHOOL_IDENTITY.principal.nip}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{SCHOOL_IDENTITY.principal.rank}</p>
              </div>
              <Icon3D name="award" tone="sky" size="md" variant="tile" />
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 inline-flex items-center gap-2">
                <Icon3D name="quote" tone="emerald" size="xs" />
                <span>Sambutan Kepala Sekolah</span>
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#132A2E] mt-2 text-balance">
                Menghadirkan Pendidikan Dasar yang Transparan, Kolaboratif, dan Berpusat pada Murid
              </h2>
              <div className="mt-4 space-y-3 text-[15px] text-slate-700 leading-relaxed max-w-[70ch]">
                <p>
                  Assalamu’alaikum warahmatullahi wabarakatuh. Sampurasun warga belajar SDN Cikawao dan seluruh orang tua murid di Desa Sukawangi, Kecamatan Pamulihan.
                </p>
                <p>
                  Melalui portal digital resmi SDN Cikawao, kami berkomitmen membangun jembatan komunikasi yang terbuka antara sekolah, orang tua, dan masyarakat. Orang tua kini dapat memantau perkembangan akademik Kurikulum Merdeka putra-putrinya secara real-time, menerima pengumuman penting otomatis, menyaksikan dokumentasi kegiatan ekstrakurikuler Jabar Beraksi, serta menyampaikan aspirasi melalui layanan SILOKA.
                </p>
              </div>
            </div>

            {/* Institutional Identity Grid */}
            <div className="bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/50 border-2 border-emerald-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={SCHOOL_IMAGES.logo}
                  alt="Logo Resmi SD Negeri Cikawao"
                  className="w-10 h-10 object-contain shrink-0"
                />
                <div>
                  <h3 className="text-sm font-bold text-emerald-800">
                    Identitas Resmi Satuan Pendidikan
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    Berdiri sejak {SCHOOL_IDENTITY.foundedYear} · Kecamatan Pamulihan
                  </p>
                </div>
              </div>
              <dl className="divide-y divide-emerald-100 text-sm">
                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                  <dt className="text-slate-500">Nama Sekolah</dt>
                  <dd className="sm:col-span-2 font-semibold text-[#132A2E]">SDN Cikawao</dd>
                </div>
                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                  <dt className="text-slate-500">NPSN</dt>
                  <dd className="sm:col-span-2 font-mono tabular-nums font-bold text-sky-700">
                    20208591
                  </dd>
                </div>
                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                  <dt className="text-slate-500">Alamat Lengkap</dt>
                  <dd className="sm:col-span-2 text-[#132A2E]">
                    Jln. Nyampay RT 01 RW 09, Desa Sukawangi, Kec. Pamulihan, Kab. Sumedang, Jawa Barat
                  </dd>
                </div>
                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                  <dt className="text-slate-500">Kepala Sekolah</dt>
                  <dd className="sm:col-span-2 text-[#132A2E]">
                    Neng Linlin Irmawati, S.Pd. (NIP. 198603272010012011 · Penata Tk. I / III/d)
                  </dd>
                </div>
                <div className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
                  <dt className="text-slate-500">Kurikulum &amp; Skala</dt>
                  <dd className="sm:col-span-2 text-emerald-700 font-semibold tabular-nums">
                    Kurikulum Merdeka · 184 Siswa · 6 Rombel · {guruCount} Guru · {tendikCount} Tendik
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Visi Misi Sekolah */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t-2 border-amber-200/80 pt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 inline-flex items-center gap-2">
              <Icon3D name="award" tone="amber" size="xs" />
              <span>Visi Misi &amp; Arah Mutu</span>
            </p>
            <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#132A2E] mt-2 mb-5">
              Visi Misi SDN Cikawao
            </h2>
            <VisiMisiShowcase variant="editorial" />
          </div>

          <div className="lg:col-span-7">
            <h3 className="text-sm font-bold text-sky-800 mb-4">Misi Strategis Sekolah</h3>
            <div className="space-y-3">
              {MISI_ITEMS.map((misi) => (
                <div
                  key={misi.no}
                  className={`card-interactive p-4 rounded-2xl border-2 flex gap-4 items-start ${misi.cardBg}`}
                >
                  <Icon3D name={misi.icon} tone={misi.tone} size="md" variant="tile" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold ${misi.color}`}>{misi.no}</span>
                      <h4 className="text-sm font-semibold text-[#132A2E]">{misi.title}</h4>
                    </div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{misi.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Direktori Guru & Tendik + 6 Rombel */}
      <section id="direktori-gtk" className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/40 border-2 border-sky-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sky-200">
            <div className="flex items-center gap-3.5">
              <Icon3D name="users" tone="sky" size="lg" variant="tile" />
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#132A2E]">
                  Pendidik, Tendik &amp; Rombongan Belajar
                </h2>
                <p className="text-sm text-slate-600 mt-1 tabular-nums">
                  Data resmi {guruCount} guru pendidik, {tendikCount} tenaga kependidikan, dan sebaran 184 siswa pada 6 rombongan belajar.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 p-1.5 bg-gradient-to-r from-sky-100 to-emerald-100 border border-sky-200 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setDirectoryTab('guru')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  directoryTab === 'guru'
                    ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm'
                    : 'text-sky-900 hover:bg-white/70'
                }`}
              >
                <Icon3D name="users" tone={directoryTab === 'guru' ? 'white' : 'sky'} size="xs" />
                Guru &amp; Tendik ({staffMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryTab('rombel')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                  directoryTab === 'rombel'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                    : 'text-emerald-900 hover:bg-white/70'
                }`}
              >
                <Icon3D name="layers" tone={directoryTab === 'rombel' ? 'white' : 'emerald'} size="xs" />
                6 Rombel (184 Siswa)
              </button>
            </div>
          </div>

          {directoryTab === 'guru' ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5">
                  {(['Semua', 'Guru', 'Tenaga Kependidikan'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setGtkFilter(cat)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                        gtkFilter === cat
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-medium text-sky-800 tabular-nums">
                  Menampilkan {visibleStaff.length} personel
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {visibleStaff.map((member, index) => (
                  <article
                    key={member.id}
                    className={`card-interactive rounded-2xl border-2 p-5 flex flex-col justify-between gap-4 ${
                      member.category === 'Guru'
                        ? 'bg-gradient-to-br from-sky-50/90 via-white to-emerald-50/70 border-sky-200 hover:border-sky-400'
                        : 'bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md shrink-0 bg-slate-100">
                        {member.photoUrl ? (
                          <SafeImage
                            src={member.photoUrl}
                            alt={`Foto ${member.fullName}`}
                            fallbackTitle={member.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 via-sky-100 to-amber-100 text-emerald-800 font-editorial text-xl font-bold">
                            {member.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div>
                            <span
                              className={`font-bold ${
                                member.category === 'Guru' ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {member.category === 'Tenaga Kependidikan' ? 'Tendik' : 'Guru'}
                            </span>
                            <span className="text-slate-400 mx-1.5" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-slate-600 font-mono text-[11px]">
                              {member.employmentStatus}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-sky-700 tabular-nums shrink-0">
                            #{String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <h3 className="font-editorial text-base sm:text-lg font-semibold text-[#132A2E] mt-1 leading-snug">
                          {member.fullName}
                        </h3>
                        <p className="text-xs font-semibold text-sky-800 mt-0.5">{member.role}</p>
                        {member.assignment && (
                          <p className="text-xs text-slate-600 mt-1">{member.assignment}</p>
                        )}
                        <p className="text-[11px] font-mono text-slate-500 tabular-nums mt-1.5">
                          {member.nip && member.nip !== '-' ? `NIP. ${member.nip}` : 'Tenaga Non-ASN'}
                          {member.rank ? ` · ${member.rank}` : ''}
                        </p>
                      </div>
                    </div>

                    {member.motto && (
                      <blockquote className="rounded-xl bg-white/95 border border-amber-200/80 px-4 py-3 text-xs sm:text-[13px] italic text-slate-700 leading-relaxed flex items-start gap-2.5">
                        <Icon3D name="quote" tone="amber" size="xs" className="mt-0.5" />
                        <span>“{member.motto}”</span>
                      </blockquote>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-emerald-200 bg-gradient-to-r from-emerald-100/80 via-sky-50 to-amber-50 text-xs text-emerald-950">
                    <th className="py-3 px-3 font-bold rounded-tl-lg">Rombel</th>
                    <th className="py-3 px-3 font-bold">Fase Kurikulum Merdeka</th>
                    <th className="py-3 px-3 font-bold">Wali Kelas</th>
                    <th className="py-3 px-3 font-bold text-right">Laki-laki</th>
                    <th className="py-3 px-3 font-bold text-right">Perempuan</th>
                    <th className="py-3 px-3 font-bold text-right rounded-tr-lg">Total Siswa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {ROMBEL_DISTRIBUTION.map((row) => (
                    <tr key={row.rombel} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#132A2E]">{row.rombel}</td>
                      <td className="py-3 px-3 text-slate-600">{row.fase}</td>
                      <td className="py-3 px-3 text-slate-600">{row.homeroom}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-sky-700 font-semibold">
                        {row.male}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-orange-700 font-semibold">
                        {row.female}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-emerald-700">
                        {row.students}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-amber-100/80 to-emerald-100/80 font-bold">
                    <td className="py-3 px-3 text-[#132A2E]" colSpan={3}>
                      Total Keseluruhan (6 Rombel)
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-sky-800">
                      91
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-orange-800">
                      93
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-800">
                      184
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
