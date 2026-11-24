import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SCHOOL_IMAGES } from '../data/seedData';
import type { AppTab } from '../types';
import { Icon3D, type Icon3DName, type Icon3DTone } from './Icon3D';
import { PortalLoginModal } from './PortalLoginModal';

interface TopNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const NAV_ITEMS: Array<{
  id: AppTab;
  label: string;
  icon: Icon3DName;
  tone: Icon3DTone;
  activeText: string;
  activeBg: string;
  activeBar: string;
  mobileActiveBg: string;
}> = [
  {
    id: 'beranda',
    label: 'Beranda',
    icon: 'home',
    tone: 'teal',
    activeText: 'text-teal-800',
    activeBg: 'bg-teal-50/90 border-teal-200',
    activeBar: 'bg-gradient-to-r from-teal-400 to-emerald-500',
    mobileActiveBg: 'bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-800 border-teal-200',
  },
  {
    id: 'profil',
    label: 'Profil',
    icon: 'users',
    tone: 'emerald',
    activeText: 'text-emerald-800',
    activeBg: 'bg-emerald-50/90 border-emerald-200',
    activeBar: 'bg-gradient-to-r from-emerald-400 to-green-500',
    mobileActiveBg: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 'akademik',
    label: 'Akademik',
    icon: 'graduation',
    tone: 'sky',
    activeText: 'text-sky-800',
    activeBg: 'bg-sky-50/90 border-sky-200',
    activeBar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    mobileActiveBg: 'bg-gradient-to-r from-sky-50 to-blue-50 text-sky-800 border-sky-200',
  },
  {
    id: 'jabar-beraksi',
    label: 'Jabar Beraksi',
    icon: 'award',
    tone: 'amber',
    activeText: 'text-amber-800',
    activeBg: 'bg-amber-50/90 border-amber-200',
    activeBar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    mobileActiveBg: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border-amber-200',
  },
  {
    id: 'pkks-galeri',
    label: 'PKKS & Galeri',
    icon: 'camera',
    tone: 'orange',
    activeText: 'text-orange-800',
    activeBg: 'bg-orange-50/90 border-orange-200',
    activeBar: 'bg-gradient-to-r from-orange-400 to-rose-500',
    mobileActiveBg: 'bg-gradient-to-r from-orange-50 to-rose-50 text-orange-800 border-orange-200',
  },
  {
    id: 'siloka',
    label: 'Siloka',
    icon: 'siloka',
    tone: 'violet',
    activeText: 'text-violet-800',
    activeBg: 'bg-violet-50/90 border-violet-200',
    activeBar: 'bg-gradient-to-r from-violet-400 to-purple-500',
    mobileActiveBg: 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-800 border-violet-200',
  },
  {
    id: 'game',
    label: 'Game',
    icon: 'gamepad',
    tone: 'rose',
    activeText: 'text-rose-800',
    activeBg: 'bg-rose-50/90 border-rose-200',
    activeBar: 'bg-gradient-to-r from-rose-400 to-pink-500',
    mobileActiveBg: 'bg-gradient-to-r from-rose-50 to-pink-50 text-rose-800 border-rose-200',
  },
];

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onSelectTab }) => {
  const {
    user,
    isAdmin,
    isBootstrappedAdmin,
    isItAdmin,
    itAdminSession,
    authLoading,
    signInWithGoogle,
    logout,
  } = useSchool();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginModalTab, setLoginModalTab] = useState<'google' | 'tim-it'>('google');

  const isSignedIn = Boolean(user || isItAdmin);

  const openLoginModal = (tab: 'google' | 'tim-it' = 'google') => {
    setLoginModalTab(tab);
    setLoginModalOpen(true);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  };

  const handleNav = (tab: AppTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Emblem & Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('beranda')}
          className="inline-flex items-center gap-2.5 font-editorial text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 bg-clip-text text-transparent hover:opacity-85 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-1 py-0.5"
        >
          <img
            src={SCHOOL_IMAGES.logo}
            alt="Logo SDN Cikawao"
            className="w-9 h-9 object-contain shrink-0 drop-shadow-xs"
          />
          <span>SDN Cikawao</span>
        </button>

        {/* Zone 2: Colorful Single-Line Navigation Links with 3D Icons */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs xl:text-[13px] font-semibold text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isActive
                    ? `${item.activeText} ${item.activeBg} shadow-xs`
                    : 'border-transparent text-slate-600 hover:text-[#132A2E] hover:bg-slate-100/80'
                }`}
              >
                <Icon3D
                  name={item.icon}
                  tone={item.tone}
                  size="sm"
                  variant={isActive ? 'tile' : 'glyph'}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span
                    aria-hidden="true"
                    className={`absolute left-2 right-2 -bottom-[11px] h-[3px] rounded-full ${item.activeBar}`}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0 relative">
          {!isSignedIn ? (
            <button
              type="button"
              disabled={authLoading}
              onClick={() => openLoginModal('google')}
              className="btn-3d hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 border-b-[3px] border-emerald-700 rounded-xl whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <Icon3D name="login" tone="white" size="xs" />
              {authLoading ? 'Memproses...' : 'Masuk Portal'}
            </button>
          ) : (
            <div className="hidden sm:block relative">
              <button
                type="button"
                onClick={() =>
                  isAdmin && activeTab !== 'admin'
                    ? handleNav('admin')
                    : setAccountMenuOpen((prev) => !prev)
                }
                className="btn-3d inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 border-b-[3px] border-emerald-800 rounded-xl whitespace-nowrap shrink-0"
              >
                {isAdmin ? (
                  <>
                    <Icon3D name="shield" tone="amber" size="xs" />
                    {activeTab === 'admin'
                      ? isItAdmin && !isBootstrappedAdmin
                        ? 'Tim IT SDN Cikawao'
                        : 'Akun Kepala Sekolah'
                      : 'Dashboard Admin'}
                  </>
                ) : (
                  <>
                    <Icon3D name="user" tone="white" size="xs" />
                    Akun Wali Murid
                  </>
                )}
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-sky-200 rounded-2xl shadow-xl p-3 z-50">
                  <div className="pb-2.5 mb-2.5 border-b border-slate-200">
                    <p className="text-xs font-semibold text-[#132A2E] truncate">
                      {isItAdmin && !isBootstrappedAdmin
                        ? itAdminSession?.roleLabel || 'Tim IT SDN Cikawao'
                        : user?.displayName || 'Pengguna Portal'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {isItAdmin && itAdminSession
                        ? `No. HP ${itAdminSession.phoneMasked}${user?.email ? ` · ${user.email}` : ''}`
                        : user?.email}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-700 mt-1">
                      {isBootstrappedAdmin
                        ? 'Administrator / Kepala Sekolah'
                        : isItAdmin
                        ? 'Administrator Teknis · Tim IT SDN Cikawao'
                        : isAdmin
                        ? 'Administrator Delegasi SDN Cikawao'
                        : 'Orang Tua / Masyarakat'}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleNav('admin')}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 rounded-xl transition-colors mb-1.5"
                    >
                      <Icon3D name="dashboard" tone="emerald" size="xs" />
                      <span>Buka Dashboard Admin</span>
                    </button>
                  )}
                  {!isItAdmin && (
                    <button
                      type="button"
                      onClick={() => openLoginModal('tim-it')}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50/70 hover:bg-sky-100 rounded-xl transition-colors mb-1.5"
                    >
                      <Icon3D name="user-check" tone="sky" size="xs" />
                      <span>Masuk sebagai Tim IT</span>
                    </button>
                  )}
                  {isItAdmin && !user && (
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() => {
                        setAccountMenuOpen(false);
                        void signInWithGoogle();
                      }}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs font-semibold text-sky-800 bg-sky-50/70 hover:bg-sky-100 rounded-xl transition-colors mb-1.5 disabled:opacity-60"
                    >
                      <Icon3D name="login" tone="sky" size="xs" />
                      <span>Tautkan Akun Google</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountMenuOpen(false);
                      void logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-xl transition-colors"
                  >
                    <Icon3D name="logout" tone="rose" size="xs" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-xl border border-sky-200 bg-sky-50/80 text-[#132A2E] hover:bg-sky-100 transition-colors"
          >
            <Icon3D name={mobileMenuOpen ? 'close' : 'menu'} tone={mobileMenuOpen ? 'rose' : 'sky'} size="md" />
          </button>
        </div>
      </div>

      {/* Cheerful 7-color school underline divider */}
      <div className="grid grid-cols-7 h-[4px] w-full" aria-hidden="true">
        <div className="bg-teal-400" />
        <div className="bg-emerald-500" />
        <div className="bg-sky-400" />
        <div className="bg-amber-400" />
        <div className="bg-orange-400" />
        <div className="bg-violet-500" />
        <div className="bg-rose-500" />
      </div>

      {/* Mobile Navigation Panel */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-sky-200 bg-white/95 backdrop-blur-md px-4 py-4 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                activeTab === item.id
                  ? item.mobileActiveBg
                  : 'border-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon3D name={item.icon} tone={item.tone} size="sm" variant="tile" />
              <span>{item.label}</span>
            </button>
          ))}

          <div className="pt-3 mt-2 border-t border-slate-200 space-y-2">
            {!isSignedIn ? (
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={() => openLoginModal('google')}
                  className="btn-3d w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-sky-500 border-b-[3px] border-emerald-700 rounded-xl"
                >
                  <Icon3D name="login" tone="white" size="xs" />
                  Masuk Portal (Google / Tim IT)
                </button>
                <button
                  type="button"
                  onClick={() => openLoginModal('tim-it')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-xl hover:bg-sky-100"
                >
                  <Icon3D name="user-check" tone="sky" size="xs" />
                  Login Tim IT SDN Cikawao
                </button>
              </div>
            ) : (
              <>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleNav('admin')}
                    className="btn-3d w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 border-b-[3px] border-emerald-800 rounded-xl"
                  >
                    <Icon3D name="shield" tone="amber" size="xs" />
                    Dashboard Admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    void logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100"
                >
                  <Icon3D name="logout" tone="rose" size="xs" />
                  Keluar ({isItAdmin && !isBootstrappedAdmin ? itAdminSession?.roleLabel || 'Tim IT' : user?.email || 'Akun'})
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <PortalLoginModal
        open={loginModalOpen}
        initialTab={loginModalTab}
        onClose={() => setLoginModalOpen(false)}
        onAdminAuthenticated={() => handleNav('admin')}
      />
    </header>
  );
};
