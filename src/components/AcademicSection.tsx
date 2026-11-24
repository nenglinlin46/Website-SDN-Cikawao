import React, { useEffect, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SCHOOL_IMAGES } from '../data/seedData';
import type { AppTab, NisnDirectoryEntry, RombelName } from '../types';
import { hashNikSha256 } from '../utils/hashNik';
import { Icon3D } from './Icon3D';
import { SafeImage } from './SafeImage';

interface AcademicSectionProps {
  onNavigate: (tab: AppTab) => void;
}

const ROMBEL_LIST: RombelName[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

type SearchMode = 'auto' | 'nama' | 'nik';

export const AcademicSection: React.FC<AcademicSectionProps> = ({ onNavigate }) => {
  const { isAdmin, nisnDirectory } = useSchool();

  const [searchMode, setSearchMode] = useState<SearchMode>('auto');
  const [queryInput, setQueryInput] = useState('');
  const [rombelFilter, setRombelFilter] = useState<'Semua' | RombelName>('Semua');
  const [results, setResults] = useState<NisnDirectoryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState<
    'idle' | 'short-name' | 'short-nik' | 'matched-nik' | 'matched-name' | 'empty'
  >('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const runSearch = async (rawQuery: string, mode: SearchMode, rombel: 'Semua' | RombelName) => {
    const trimmed = rawQuery.trim();
    const digitsOnly = trimmed.replace(/\D/g, '');

    if (!trimmed) {
      setResults([]);
      setSearchStatus('idle');
      return;
    }

    const treatAsNik =
      mode === 'nik' ||
      (mode === 'auto' && /^[\d\s-]+$/.test(trimmed) && digitsOnly.length > 0);

    if (treatAsNik) {
      if (digitsOnly.length < 16) {
        setResults([]);
        setSearchStatus('short-nik');
        return;
      }

      setSearching(true);
      try {
        const targetHash = await hashNikSha256(digitsOnly.slice(0, 16));
        const matched = nisnDirectory.filter((entry) => {
          const matchRombel = rombel === 'Semua' || entry.rombel === rombel;
          return matchRombel && Boolean(entry.nikHash) && entry.nikHash === targetHash;
        });
        setResults(matched);
        setSearchStatus(matched.length > 0 ? 'matched-nik' : 'empty');
      } finally {
        setSearching(false);
      }
      return;
    }

    if (trimmed.length < 2) {
      setResults([]);
      setSearchStatus('short-name');
      return;
    }

    const qLower = trimmed.toLowerCase();
    const matched = nisnDirectory.filter((entry) => {
      const matchRombel = rombel === 'Semua' || entry.rombel === rombel;
      return matchRombel && entry.fullName.toLowerCase().includes(qLower);
    });
    setResults(matched);
    setSearchStatus(matched.length > 0 ? 'matched-name' : 'empty');
  };

  useEffect(() => {
    let active = true;
    const execute = async () => {
      const trimmed = queryInput.trim();
      const digitsOnly = trimmed.replace(/\D/g, '');

      if (!trimmed) {
        if (active) {
          setResults([]);
          setSearchStatus('idle');
        }
        return;
      }

      const treatAsNik =
        searchMode === 'nik' ||
        (searchMode === 'auto' && /^[\d\s-]+$/.test(trimmed) && digitsOnly.length > 0);

      if (treatAsNik) {
        if (digitsOnly.length < 16) {
          if (active) {
            setResults([]);
            setSearchStatus('short-nik');
          }
          return;
        }
        if (active) setSearching(true);
        const targetHash = await hashNikSha256(digitsOnly.slice(0, 16));
        if (!active) return;
        const matched = nisnDirectory.filter((entry) => {
          const matchRombel = rombelFilter === 'Semua' || entry.rombel === rombelFilter;
          return matchRombel && Boolean(entry.nikHash) && entry.nikHash === targetHash;
        });
        setResults(matched);
        setSearchStatus(matched.length > 0 ? 'matched-nik' : 'empty');
        setSearching(false);
        return;
      }

      if (trimmed.length < 2) {
        if (active) {
          setResults([]);
          setSearchStatus('short-name');
        }
        return;
      }

      const qLower = trimmed.toLowerCase();
      const matched = nisnDirectory.filter((entry) => {
        const matchRombel = rombelFilter === 'Semua' || entry.rombel === rombelFilter;
        return matchRombel && entry.fullName.toLowerCase().includes(qLower);
      });
      if (active) {
        setResults(matched);
        setSearchStatus(matched.length > 0 ? 'matched-name' : 'empty');
      }
    };

    void execute();
    return () => {
      active = false;
    };
  }, [queryInput, searchMode, rombelFilter, nisnDirectory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(queryInput, searchMode, rombelFilter);
  };

  const handleReset = () => {
    setQueryInput('');
    setRombelFilter('Semua');
    setResults([]);
    setSearchStatus('idle');
  };

  const handleCopyNisn = async (entry: NisnDirectoryEntry) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(entry.nisn);
      }
      setCopiedId(entry.id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === entry.id ? null : prev));
      }, 2000);
    } catch {
      setCopiedId(null);
    }
  };

  const digitsCount = queryInput.replace(/\D/g, '').length;
  const isNikMode =
    searchMode === 'nik' ||
    (searchMode === 'auto' && /^[\d\s-]+$/.test(queryInput.trim()) && digitsCount > 0);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14 pb-20">
      {/* KBM Kurikulum Merdeka Header & Showcase */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700 inline-flex items-center gap-2">
              <Icon3D name="graduation" tone="sky" size="xs" />
              <span>Kurikulum Merdeka · KBM Terpadu</span>
            </p>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#132A2E] mt-2 text-balance">
              Kegiatan Belajar Mengajar &amp; Layanan Pencarian NISN
            </h1>
            <p className="text-[15px] text-slate-700 mt-4 leading-relaxed">
              SDN Cikawao menerapkan Kurikulum Merdeka pada 6 rombongan belajar dengan pendekatan pembelajaran berdiferensiasi, penguatan literasi-numerasi pagi, serta Projek Penguatan Profil Pelajar Pancasila (P5) yang kontekstual dengan lingkungan Kecamatan Pamulihan, Sumedang.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <div className="card-interactive p-4 rounded-2xl bg-gradient-to-br from-emerald-100/90 via-white to-teal-50 border-2 border-emerald-300 space-y-2">
              <Icon3D name="book" tone="emerald" size="sm" variant="tile" />
              <p className="text-xs font-bold text-emerald-900">Fase A (Kelas 1–2)</p>
              <p className="text-xs text-emerald-950/80 leading-relaxed">
                Transisi PAUD–SD menyenangkan, penguatan calistung bermakna &amp; budi pekerti.
              </p>
            </div>
            <div className="card-interactive p-4 rounded-2xl bg-gradient-to-br from-sky-100/90 via-white to-blue-50 border-2 border-sky-300 space-y-2">
              <Icon3D name="layers" tone="sky" size="sm" variant="tile" />
              <p className="text-xs font-bold text-sky-900">Fase B (Kelas 3–4)</p>
              <p className="text-xs text-sky-950/80 leading-relaxed">
                Eksplorasi IPAS, literasi Bahasa Indonesia &amp; Bahasa Sunda, serta proyek P5 kolaboratif.
              </p>
            </div>
            <div className="card-interactive p-4 rounded-2xl bg-gradient-to-br from-amber-100/90 via-white to-orange-50 border-2 border-amber-300 space-y-2">
              <Icon3D name="award" tone="amber" size="sm" variant="tile" />
              <p className="text-xs font-bold text-amber-900">Fase C (Kelas 5–6)</p>
              <p className="text-xs text-amber-950/80 leading-relaxed">
                Penalaran kritis numerasi-sains, kepemimpinan siswa &amp; kesiapan jenjang SMP.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="h-72 sm:h-80 lg:h-full min-h-[300px] rounded-2xl overflow-hidden border-2 border-sky-300 shadow-lg">
            <SafeImage
              src={SCHOOL_IMAGES.kbm}
              alt="Kegiatan Belajar Mengajar Kurikulum Merdeka di kelas SDN Cikawao"
              fallbackTitle="KBM Kurikulum Merdeka SDN Cikawao"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Pencarian NISN Menggunakan Nama Siswa atau NIK */}
      <section className="border-t-2 border-sky-200/80 pt-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Icon3D name="search" tone="sky" size="lg" variant="tile" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Pencarian NISN Peserta Didik SDN Cikawao
              </p>
              <h2 className="font-editorial text-2xl sm:text-3xl font-semibold text-[#132A2E] mt-0.5">
                Cek NISN Menggunakan Nama Siswa atau NIK
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Masukkan nama lengkap peserta didik atau Nomor Induk Kependudukan (NIK 16 digit) sesuai Kartu Keluarga untuk mengetahui nomor NISN resmi siswa secara cepat.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="btn-3d inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 border-b-[3px] border-indigo-800 rounded-xl whitespace-nowrap shrink-0"
            >
              <Icon3D name="shield" tone="amber" size="xs" />
              Kelola Data &amp; NISN Siswa
            </button>
          )}
        </div>

        {/* Search Box Card */}
        <div className="bg-gradient-to-br from-sky-50/90 via-white to-emerald-50/80 border-2 border-sky-300 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          {/* Search Mode Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'auto', label: 'Nama Siswa atau NIK', icon: 'search' as const },
                  { id: 'nama', label: 'Berdasarkan Nama Siswa', icon: 'user' as const },
                  { id: 'nik', label: 'Berdasarkan NIK (16 Digit)', icon: 'shield' as const },
                ] as const
              ).map((m) => {
                const active = searchMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSearchMode(m.id);
                      if (m.id === 'nik') {
                        setQueryInput((prev) => prev.replace(/\D/g, '').slice(0, 16));
                      }
                    }}
                    className={`btn-3d inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border whitespace-nowrap shrink-0 transition-all ${
                      active
                        ? 'text-white bg-gradient-to-r from-sky-500 to-emerald-600 border-sky-700 shadow-sm'
                        : 'text-[#132A2E] bg-white border-sky-200 hover:border-sky-400'
                    }`}
                  >
                    <Icon3D
                      name={m.icon}
                      tone={active ? 'white' : 'sky'}
                      size="xs"
                    />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-3 py-1.5 rounded-xl tabular-nums">
              <Icon3D name="database" tone="emerald" size="xs" />
              <span>{nisnDirectory.length} Siswa Terindeks</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6 relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                <Icon3D name={isNikMode ? 'shield' : 'search'} tone="sky" size="sm" />
              </span>
              <input
                type="text"
                inputMode={searchMode === 'nik' ? 'numeric' : 'text'}
                value={queryInput}
                maxLength={searchMode === 'nik' ? 16 : 120}
                onChange={(e) => {
                  const val = e.target.value;
                  setQueryInput(
                    searchMode === 'nik' ? val.replace(/\D/g, '').slice(0, 16) : val
                  );
                }}
                placeholder={
                  searchMode === 'nik'
                    ? 'Masukkan 16 digit NIK siswa...'
                    : searchMode === 'nama'
                    ? 'Ketik nama siswa (contoh: Rafi Pratama)...'
                    : 'Ketik Nama Lengkap Siswa atau 16 digit NIK...'
                }
                className="w-full pl-11 pr-20 py-3 text-sm bg-white border-2 border-sky-200 rounded-xl text-[#132A2E] placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
              {isNikMode && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg tabular-nums">
                  {digitsCount}/16
                </span>
              )}
            </div>

            <div className="lg:col-span-3">
              <select
                value={rombelFilter}
                onChange={(e) => setRombelFilter(e.target.value as 'Semua' | RombelName)}
                className="w-full h-full px-3.5 py-3 text-sm bg-white border-2 border-sky-200 rounded-xl text-[#132A2E] focus:outline-none focus:border-sky-500"
              >
                <option value="Semua">Semua Rombel (Kelas 1–6)</option>
                {ROMBEL_LIST.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3 flex items-center gap-2">
              <button
                type="submit"
                className="btn-3d flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 border-b-[3px] border-emerald-800 rounded-xl whitespace-nowrap shrink-0"
              >
                <Icon3D name="search" tone="white" size="xs" />
                <span>{searching ? 'Mencari...' : 'Cari NISN'}</span>
              </button>
              {(queryInput || rombelFilter !== 'Semua') && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-3d inline-flex items-center justify-center px-3.5 py-3 text-xs font-semibold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-400 rounded-xl whitespace-nowrap shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <Icon3D name="check-circle" tone="emerald" size="xs" />
            <span>
              Demi perlindungan data pribadi anak, pencarian NIK menggunakan verifikasi terenkripsi (SHA-256) dan nomor NIK tidak ditampilkan secara terbuka.
            </span>
          </div>
        </div>

        {/* Search States & Results */}
        {searchStatus === 'idle' && (
          <div className="bg-white border-2 border-dashed border-sky-300 rounded-2xl p-8 text-center space-y-3">
            <div className="flex justify-center">
              <Icon3D name="graduation" tone="sky" size="xl" variant="tile" />
            </div>
            <h3 className="font-editorial text-xl font-semibold text-[#132A2E]">
              Siap Mencari NISN Peserta Didik
            </h3>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Ketik minimal <strong>2 huruf nama siswa</strong> (misalnya <span className="font-mono text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded">Rafi</span>) atau masukkan lengkap <strong>16 digit NIK</strong> untuk menampilkan NISN serta rombongan belajar siswa SDN Cikawao.
            </p>
          </div>
        )}

        {searchStatus === 'short-name' && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex items-center gap-3 text-sm text-amber-950">
            <Icon3D name="alert" tone="amber" size="sm" />
            <span>
              Ketik minimal <strong>2 huruf</strong> nama siswa agar pencarian NISN lebih akurat.
            </span>
          </div>
        )}

        {searchStatus === 'short-nik' && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex items-center gap-3 text-sm text-amber-950">
            <Icon3D name="shield" tone="amber" size="sm" />
            <span>
              NIK harus terdiri dari lengkap <strong>16 digit angka</strong> ({digitsCount}/16 digit terisi). Lanjutkan mengetik NIK siswa atau ubah ke mode Nama Siswa.
            </span>
          </div>
        )}

        {searchStatus === 'empty' && (
          <div className="bg-rose-50/80 border-2 border-rose-200 rounded-2xl p-6 text-center space-y-2">
            <div className="flex justify-center">
              <Icon3D name="alert" tone="rose" size="md" variant="tile" />
            </div>
            <h3 className="font-editorial text-lg font-semibold text-[#132A2E]">
              Data NISN Tidak Ditemukan
            </h3>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Pastikan ejaan nama siswa atau 16 digit NIK sudah benar serta filter rombel sesuai. Apabila data siswa baru atau NIK belum terinput, silakan hubungi Operator Dapodik / Wali Kelas SDN Cikawao.
            </p>
          </div>
        )}

        {(searchStatus === 'matched-name' || searchStatus === 'matched-nik') && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#132A2E] inline-flex items-center gap-2">
                <Icon3D name="check-circle" tone="emerald" size="sm" />
                <span>
                  Ditemukan <strong className="font-mono text-emerald-700">{results.length}</strong> data siswa sesuai pencarian{' '}
                  {searchStatus === 'matched-nik' ? 'NIK terverifikasi' : 'nama siswa'}.
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {results.map((entry) => {
                const isCopied = copiedId === entry.id;
                return (
                  <article
                    key={entry.id}
                    className="card-interactive bg-gradient-to-br from-white via-sky-50/50 to-emerald-50/50 border-2 border-sky-200 hover:border-sky-400 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Icon3D
                          name="user-check"
                          tone={entry.gender === 'P' ? 'rose' : 'sky'}
                          size="md"
                          variant="tile"
                        />
                        <div>
                          <h3 className="font-editorial text-xl font-semibold text-[#132A2E]">
                            {entry.fullName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                            <span className="font-bold text-sky-900 bg-sky-100 border border-sky-300 px-2.5 py-0.5 rounded-lg">
                              {entry.rombel}
                            </span>
                            <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                              {entry.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                            </span>
                            {entry.nikHash && (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-lg">
                                <Icon3D name="shield" tone="emerald" size="xs" />
                                NIK Terverifikasi Dapodik
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-sky-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Nomor Induk Siswa Nasional (NISN)
                        </p>
                        <p className="font-mono text-2xl font-bold text-sky-900 tracking-wider tabular-nums mt-0.5">
                          {entry.nisn}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleCopyNisn(entry)}
                        className={`btn-3d inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border whitespace-nowrap shrink-0 ${
                          isCopied
                            ? 'text-white bg-emerald-600 border-emerald-700'
                            : 'text-sky-900 bg-sky-50 border-sky-300 hover:bg-sky-100'
                        }`}
                      >
                        <Icon3D
                          name={isCopied ? 'check' : 'clipboard'}
                          tone={isCopied ? 'white' : 'sky'}
                          size="xs"
                        />
                        <span>{isCopied ? 'NISN Tersalin' : 'Salin NISN'}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
