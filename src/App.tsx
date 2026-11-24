/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AcademicSection } from './components/AcademicSection';
import { AdminDashboard } from './components/AdminDashboard';
import { AnnouncementRibbonAndDrawer } from './components/AnnouncementDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GamesSection } from './components/GamesSection';
import { HomeSection } from './components/HomeSection';
import { Icon3D } from './components/Icon3D';
import { JabarBeraksiSection } from './components/JabarBeraksiSection';
import { PkksGallerySection } from './components/PkksGallerySection';
import { ProfileNewsSection } from './components/ProfileNewsSection';
import { SilokaSection } from './components/SilokaSection';
import { TapFeedbackOverlay } from './components/TapFeedbackOverlay';
import { TopNav } from './components/TopNav';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { SCHOOL_IDENTITY, SCHOOL_IMAGES } from './data/seedData';
import type { AppTab } from './types';

function PortalShell() {
  const { authError, clearAuthError, staffMembers } = useSchool();
  const [activeTab, setActiveTab] = useState<AppTab>('beranda');
  const guruCount = staffMembers.filter((m) => m.category === 'Guru').length;
  const tendikCount = staffMembers.filter((m) => m.category === 'Tenaga Kependidikan').length;

  const navigate = (tab: AppTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col portal-colorful-canvas text-[#132A2E]">
      <TapFeedbackOverlay />
      <TopNav activeTab={activeTab} onSelectTab={navigate} />
      <AnnouncementRibbonAndDrawer />

      {authError && (
        <div
          role="alert"
          className="bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 border-b border-amber-300 px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-amber-950"
        >
          <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 font-medium">
              <Icon3D name="alert" tone="amber" size="sm" />
              {authError}
            </span>
            <button
              type="button"
              onClick={clearAuthError}
              className="px-3 py-1 rounded-lg bg-white/80 font-semibold text-amber-900 hover:bg-white whitespace-nowrap shrink-0"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeTab === 'beranda' && <HomeSection onNavigate={navigate} />}
        {activeTab === 'profil' && <ProfileNewsSection onNavigate={navigate} />}
        {activeTab === 'akademik' && <AcademicSection onNavigate={navigate} />}
        {activeTab === 'jabar-beraksi' && <JabarBeraksiSection />}
        {activeTab === 'pkks-galeri' && <PkksGallerySection onNavigate={navigate} />}
        {activeTab === 'siloka' && <SilokaSection onNavigate={navigate} />}
        {activeTab === 'game' && <GamesSection />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      {/* Cheerful Colorful Institutional Footer */}
      <footer className="bg-gradient-to-br from-[#064E3B] via-[#0E4D64] to-[#312E81] text-emerald-50">
        <div className="grid grid-cols-6 h-2 w-full" aria-hidden="true">
          <div className="bg-emerald-400" />
          <div className="bg-teal-400" />
          <div className="bg-sky-400" />
          <div className="bg-amber-400" />
          <div className="bg-orange-400" />
          <div className="bg-violet-400" />
        </div>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 text-xs text-emerald-50/90">
          <div className="md:col-span-5 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shrink-0 flex items-center justify-center shadow-md ring-2 ring-amber-300/60">
              <img
                src={SCHOOL_IMAGES.logo}
                alt="Logo SDN Cikawao"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1.5">
              <p className="font-editorial text-xl font-semibold text-white">SDN Cikawao</p>
              <p className="leading-relaxed text-sky-100/90">{SCHOOL_IDENTITY.address}</p>
              <p className="font-mono tabular-nums text-amber-300 font-semibold">
                NPSN {SCHOOL_IDENTITY.npsn} · Kurikulum Merdeka
              </p>
            </div>
          </div>

          <div className="md:col-span-4 space-y-2">
            <p className="font-semibold text-amber-300 inline-flex items-center gap-2">
              <Icon3D name="award" tone="amber" size="sm" />
              <span>Pimpinan Satuan Pendidikan</span>
            </p>
            <p className="text-white font-semibold text-sm">{SCHOOL_IDENTITY.principal.name}</p>
            <p className="font-mono tabular-nums text-emerald-100/90">
              NIP. {SCHOOL_IDENTITY.principal.nip}
            </p>
            <p className="text-sky-100/85">{SCHOOL_IDENTITY.principal.rank}</p>
          </div>

          <div className="md:col-span-3 space-y-2">
            <p className="font-semibold text-sky-300">Navigasi Portal</p>
            <div className="flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => navigate('beranda')}
                className="inline-flex items-center gap-2 hover:text-teal-300 transition-colors rounded-lg px-1.5 py-0.5 -mx-1.5 hover:bg-white/10"
              >
                <Icon3D name="home" tone="teal" size="xs" />
                <span>Beranda Portal</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('profil')}
                className="inline-flex items-center gap-2 hover:text-emerald-300 transition-colors rounded-lg px-1.5 py-0.5 -mx-1.5 hover:bg-white/10"
              >
                <Icon3D name="users" tone="emerald" size="xs" />
                <span>Profil Sekolah &amp; GTK</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('akademik')}
                className="inline-flex items-center gap-2 hover:text-sky-300 transition-colors rounded-lg px-1.5 py-0.5 -mx-1.5 hover:bg-white/10"
              >
                <Icon3D name="graduation" tone="sky" size="xs" />
                <span>Akademik &amp; Data Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('jabar-beraksi')}
                className="inline-flex items-center gap-2 hover:text-amber-300 transition-colors rounded-lg px-1.5 py-0.5 -mx-1.5 hover:bg-white/10"
              >
                <Icon3D name="award" tone="amber" size="xs" />
                <span>Jabar Beraksi</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('pkks-galeri')}
                className="inline-flex items-center gap-2 hover:text-orange-300 transition-colors rounded-lg px-1.5 py-0.5 -mx-1.5 hover:bg-white/10"
              >
                <Icon3D name="camera" tone="orange" size="xs" />
                <span>PKKS &amp; Galeri Sekolah</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('siloka')}
                className="inline-flex items-center gap-2 hover:text-violet-300 transition-colors rounded-lg px-1.5 py-0.5 -mx-1.5 hover:bg-white/10"
              >
                <Icon3D name="siloka" tone="violet" size="xs" />
                <span>Program &amp; Layanan Siloka</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('game')}
                className="inline-flex items-center gap-2 hover:text-rose-300 transition-colors rounded-lg px-1.5 py-0.5 -mx-1.5 hover:bg-white/10"
              >
                <Icon3D name="gamepad" tone="rose" size="xs" />
                <span>Game Belajar Interaktif</span>
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/15 py-4 px-4 sm:px-6 lg:px-8 max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-sky-100/85">
          <span>© 2026 SDN Cikawao, Kec. Pamulihan, Kab. Sumedang, Jawa Barat.</span>
          <span className="tabular-nums text-amber-300 font-semibold">
            184 Siswa · 6 Rombel · {guruCount} Guru · {tendikCount} Tendik
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SchoolProvider>
        <PortalShell />
      </SchoolProvider>
    </ErrorBoundary>
  );
}
