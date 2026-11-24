import React, { useEffect, useState } from 'react';
import { SCHOOL_IDENTITY } from '../data/seedData';
import { Icon3D, type Icon3DName, type Icon3DTone } from './Icon3D';

interface VisiMisiShowcaseProps {
  variant?: 'banner' | 'editorial';
  onOpenProfile?: () => void;
}

const VISI_MISI_VALUES: Array<{
  label: string;
  note: string;
  icon: Icon3DName;
  tone: Icon3DTone;
  chipBg: string;
}> = [
  {
    label: 'Beriman & Bertakwa',
    note: 'Berakhlak mulia kepada Tuhan Yang Maha Esa',
    icon: 'award',
    tone: 'emerald',
    chipBg: 'from-emerald-100 to-teal-50 border-emerald-300 text-emerald-900',
  },
  {
    label: 'Bernalar Kritis',
    note: 'Gemar menelaah, bertanya, dan memecahkan masalah',
    icon: 'search',
    tone: 'sky',
    chipBg: 'from-sky-100 to-blue-50 border-sky-300 text-sky-900',
  },
  {
    label: 'Kreatif',
    note: 'Berani berkarya dan berinovasi dalam pembelajaran',
    icon: 'layers',
    tone: 'amber',
    chipBg: 'from-amber-100 to-yellow-50 border-amber-300 text-amber-900',
  },
  {
    label: 'Kolaboratif',
    note: 'Bekerja sama harmonis dengan teman dan guru',
    icon: 'users',
    tone: 'indigo',
    chipBg: 'from-indigo-100 to-sky-50 border-indigo-300 text-indigo-900',
  },
  {
    label: 'Mandiri',
    note: 'Bertanggung jawab dan percaya diri dalam belajar',
    icon: 'user-check',
    tone: 'teal',
    chipBg: 'from-teal-100 to-emerald-50 border-teal-300 text-teal-900',
  },
  {
    label: 'Sehat',
    note: 'Menjaga kebugaran jasmani, rohani, dan pola hidup bersih',
    icon: 'shield',
    tone: 'rose',
    chipBg: 'from-rose-100 to-orange-50 border-rose-300 text-rose-900',
  },
  {
    label: 'Peduli Lingkungan',
    note: 'Merawat alam, kebersihan kelas, dan kebun sekolah',
    icon: 'school',
    tone: 'emerald',
    chipBg: 'from-emerald-100 to-lime-50 border-emerald-300 text-emerald-900',
  },
  {
    label: 'Komunikatif',
    note: 'Santun menyampaikan gagasan dalam bahasa Indonesia & Sunda',
    icon: 'megaphone',
    tone: 'violet',
    chipBg: 'from-violet-100 to-purple-50 border-violet-300 text-violet-900',
  },
];

export const VisiMisiShowcase: React.FC<VisiMisiShowcaseProps> = ({
  variant = 'banner',
  onOpenProfile,
}) => {
  const [paused, setPaused] = useState(false);
  const [activeTraitIndex, setActiveTraitIndex] = useState(0);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveTraitIndex((prev) => (prev + 1) % VISI_MISI_VALUES.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [paused]);

  const activeTrait = VISI_MISI_VALUES[activeTraitIndex];

  if (variant === 'editorial') {
    return (
      <div className="space-y-4">
        {/* Editorial Running Visi Misi Card */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/90 border-2 border-amber-300 shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-sky-400 via-amber-400 to-violet-500" />

          {/* Smooth Running Text Ribbon */}
          <div className="visi-marquee-wrapper border-b border-amber-200/80 bg-gradient-to-r from-emerald-600/5 via-sky-500/8 to-amber-500/10 py-3">
            <div className="flex items-center justify-between gap-3 px-5 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                <Icon3D name="award" tone="amber" size="xs" />
                Teks Berjalan Visi Misi SDN Cikawao
              </span>
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Putar teks berjalan visi misi' : 'Jeda teks berjalan visi misi'}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/90 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <Icon3D name={paused ? 'play' : 'clock'} tone="amber" size="xs" />
                <span>{paused ? 'Putar' : 'Jeda'}</span>
              </button>
            </div>

            <div className="visi-marquee-mask overflow-hidden">
              <div
                className="visi-marquee-track visi-marquee-track-slow items-center"
                data-paused={paused ? 'true' : 'false'}
              >
                <div className="flex items-center gap-6 pr-8 shrink-0">
                  <span className="font-editorial italic text-lg sm:text-xl font-semibold bg-gradient-to-r from-emerald-800 via-sky-800 to-amber-800 bg-clip-text text-transparent visi-gradient-flow whitespace-nowrap">
                    “{SCHOOL_IDENTITY.visiMisi}”
                  </span>
                  <Icon3D name="award" tone="amber" size="sm" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-700 whitespace-nowrap">
                    SD Negeri Cikawao · Sumedang
                  </span>
                  <Icon3D name="school" tone="sky" size="sm" />
                </div>
                <div className="flex items-center gap-6 pr-8 shrink-0" aria-hidden="true">
                  <span className="font-editorial italic text-lg sm:text-xl font-semibold bg-gradient-to-r from-emerald-800 via-sky-800 to-amber-800 bg-clip-text text-transparent visi-gradient-flow whitespace-nowrap">
                    “{SCHOOL_IDENTITY.visiMisi}”
                  </span>
                  <Icon3D name="award" tone="amber" size="sm" />
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-700 whitespace-nowrap">
                    SD Negeri Cikawao · Sumedang
                  </span>
                  <Icon3D name="school" tone="sky" size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Static Complete Quote + Animated Active Character Spotlight */}
          <div className="p-6 space-y-5">
            <blockquote className="font-editorial italic text-xl sm:text-[22px] text-[#132A2E] leading-relaxed">
              “{SCHOOL_IDENTITY.visiMisi}”
            </blockquote>

            {/* Active Rotating Trait Card */}
            <div
              className={`rounded-2xl border-2 bg-gradient-to-r p-3.5 flex items-center justify-between gap-3 transition-all duration-500 ${activeTrait.chipBg}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon3D name={activeTrait.icon} tone={activeTrait.tone} size="md" variant="tile" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                    Nilai Karakter Unggul ({activeTraitIndex + 1}/{VISI_MISI_VALUES.length})
                  </p>
                  <p className="text-sm font-bold text-[#132A2E] truncate">{activeTrait.label}</p>
                  <p className="text-xs text-slate-700 truncate">{activeTrait.note}</p>
                </div>
              </div>
            </div>

            {/* Interactive Trait Switcher */}
            <div className="flex flex-wrap gap-1.5">
              {VISI_MISI_VALUES.map((item, idx) => {
                const isActive = idx === activeTraitIndex;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveTraitIndex(idx)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-sm scale-[1.03]'
                        : 'bg-white/90 text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/70'
                    }`}
                  >
                    <Icon3D
                      name={item.icon}
                      tone={isActive ? 'white' : item.tone}
                      size="xs"
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Banner Variant for HomeSection (Beranda)
  return (
    <section
      aria-label="Visi Misi SDN Cikawao"
      className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="visi-marquee-wrapper rounded-3xl bg-gradient-to-r from-emerald-50/90 via-amber-50/85 to-sky-50/90 border-2 border-amber-300 shadow-md overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-sky-400 via-amber-400 to-violet-500" />

        <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Left Identity Badge */}
          <div className="flex items-center justify-between lg:justify-start gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <Icon3D name="award" tone="amber" size="md" variant="tile" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                  Visi Misi Sekolah
                </p>
                <p className="font-editorial text-base font-bold text-[#132A2E]">
                  Visi Misi SDN Cikawao
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Putar teks berjalan' : 'Jeda teks berjalan'}
                className="p-2 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-100"
              >
                <Icon3D name={paused ? 'play' : 'clock'} tone="amber" size="xs" />
              </button>
            </div>
          </div>

          {/* Center Elegant Seamless Marquee */}
          <div className="flex-1 min-w-0 visi-marquee-mask overflow-hidden py-1">
            <div
              className="visi-marquee-track items-center"
              data-paused={paused ? 'true' : 'false'}
            >
              <div className="flex items-center gap-6 pr-8 shrink-0">
                <span className="font-editorial italic text-base sm:text-lg font-semibold bg-gradient-to-r from-emerald-800 via-sky-800 to-amber-800 bg-clip-text text-transparent visi-gradient-flow whitespace-nowrap">
                  “{SCHOOL_IDENTITY.visiMisi}”
                </span>
                <Icon3D name={activeTrait.icon} tone={activeTrait.tone} size="sm" />
                <span className="text-xs font-bold text-sky-800 bg-sky-100/90 border border-sky-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                  {activeTrait.label}
                </span>
              </div>
              <div className="flex items-center gap-6 pr-8 shrink-0" aria-hidden="true">
                <span className="font-editorial italic text-base sm:text-lg font-semibold bg-gradient-to-r from-emerald-800 via-sky-800 to-amber-800 bg-clip-text text-transparent visi-gradient-flow whitespace-nowrap">
                  “{SCHOOL_IDENTITY.visiMisi}”
                </span>
                <Icon3D name={activeTrait.icon} tone={activeTrait.tone} size="sm" />
                <span className="text-xs font-bold text-sky-800 bg-sky-100/90 border border-sky-200 px-2.5 py-1 rounded-lg whitespace-nowrap">
                  {activeTrait.label}
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Putar teks berjalan visi misi' : 'Jeda teks berjalan visi misi'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white/90 border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors"
            >
              <Icon3D name={paused ? 'play' : 'clock'} tone="amber" size="xs" />
              <span>{paused ? 'Putar' : 'Jeda'}</span>
            </button>
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="btn-3d inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl whitespace-nowrap"
              >
                <span>Detail Profil</span>
                <Icon3D name="arrow-right" tone="white" size="xs" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
