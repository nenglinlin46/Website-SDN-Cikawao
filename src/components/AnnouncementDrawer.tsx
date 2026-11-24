import React, { useEffect, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import type { RombelName } from '../types';
import { Icon3D } from './Icon3D';

const ROMBEL_OPTIONS: Array<'Semua' | RombelName> = [
  'Semua',
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

export const AnnouncementRibbonAndDrawer: React.FC = () => {
  const {
    user,
    announcements,
    mySubscription,
    saveParentSubscription,
    signInWithGoogle,
    activeToast,
    dismissToast,
    unreadAnnouncementCount,
    markAnnouncementsRead,
  } = useSchool();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rombelFilter, setRombelFilter] = useState<'Semua' | RombelName>('Semua');
  const [browserPush, setBrowserPush] = useState(false);
  const [instantAlert, setInstantAlert] = useState(true);
  const [savingSub, setSavingSub] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (mySubscription) {
      setRombelFilter(mySubscription.rombelFilter);
      setBrowserPush(mySubscription.browserPushEnabled);
      setInstantAlert(mySubscription.instantAlertEnabled);
    }
  }, [mySubscription]);

  const activeList = announcements.filter((a) => a.isActive);
  const leadAnnouncement = activeList[0];

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
    markAnnouncementsRead();
  };

  const handleEnableBrowserPush = async (nextVal: boolean) => {
    if (nextVal && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setBrowserPush(perm === 'granted');
      } catch {
        setBrowserPush(false);
      }
    } else {
      setBrowserPush(nextVal);
    }
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSub(true);
    try {
      await saveParentSubscription(rombelFilter, browserPush, instantAlert);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    } finally {
      setSavingSub(false);
    }
  };

  return (
    <>
      {/* Operational Utility Ribbon (Colorful 1-line announcement strip) */}
      {leadAnnouncement && (
        <div className="bg-gradient-to-r from-amber-100 via-orange-100/90 to-rose-100 border-b border-amber-300/80">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon3D name="megaphone" tone="orange" size="sm" />
              <span className="font-bold text-orange-800 uppercase tracking-wider shrink-0">
                {leadAnnouncement.priority === 'mendesak' ? 'Penting' : 'Pengumuman'}
              </span>
              <span className="text-amber-600 font-bold" aria-hidden="true">
                ·
              </span>
              <p className="text-[#132A2E] font-semibold truncate">{leadAnnouncement.title}</p>
            </div>
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/80 hover:bg-white border border-amber-300 text-xs font-semibold text-sky-800 whitespace-nowrap shrink-0 shadow-2xs"
            >
              <Icon3D name="bell" tone="amber" size="xs" />
              <span>
                Notifikasi Orang Tua
                {unreadAnnouncementCount > 0 ? ` (${unreadAnnouncementCount})` : ''}
              </span>
              <Icon3D name="chevron-right" tone="sky" size="xs" />
            </button>
          </div>
        </div>
      )}

      {/* Real-time Automatic Notification Toast */}
      {activeToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100%-2.5rem)] bg-gradient-to-br from-white via-amber-50/70 to-emerald-50/80 border-2 border-amber-300 rounded-2xl shadow-2xl p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <Icon3D name="bell-ring" tone="amber" size="sm" variant="tile" />
              <span>Notifikasi Otomatis Sekolah</span>
            </div>
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Tutup notifikasi"
              className="p-1 rounded-lg hover:bg-rose-100 text-slate-600"
            >
              <Icon3D name="close" tone="rose" size="xs" />
            </button>
          </div>
          <h4 className="text-sm font-semibold text-[#132A2E] mt-2">{activeToast.title}</h4>
          <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
            {activeToast.message}
          </p>
        </div>
      )}

      {/* Notification Center & Parent Subscription Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Pusat Notifikasi Otomatis Orang Tua"
        >
          <div className="w-full max-w-md bg-gradient-to-b from-[#FFFDF7] via-amber-50/30 to-sky-50/40 h-full overflow-y-auto border-l-2 border-amber-300 p-6 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-amber-200">
                <div className="flex items-center gap-3">
                  <Icon3D name="bell-ring" tone="amber" size="md" variant="tile" />
                  <div>
                    <h2 className="font-editorial text-xl font-semibold text-[#132A2E]">
                      Pusat Notifikasi Orang Tua
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Siaran otomatis pengumuman resmi SDN Cikawao
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Tutup pusat notifikasi"
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100"
                >
                  <Icon3D name="close" tone="rose" size="sm" />
                </button>
              </div>

              {/* Parent Auto-Notification Subscription Box */}
              <div className="mt-5 bg-gradient-to-br from-sky-50 via-white to-indigo-50 border border-sky-200 rounded-2xl p-4 shadow-xs">
                <h3 className="text-sm font-semibold text-sky-900">
                  Langganan Notifikasi Otomatis
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Terima pemberitahuan seketika setiap kali Kepala Sekolah atau Wali Kelas menerbitkan pengumuman penting.
                </p>

                {!user ? (
                  <button
                    type="button"
                    onClick={() => void signInWithGoogle()}
                    className="btn-3d mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 border-b-[3px] border-indigo-800 rounded-xl"
                  >
                    <Icon3D name="login" tone="white" size="xs" />
                    <span>Masuk dengan Google untuk Berlangganan</span>
                  </button>
                ) : (
                  <form onSubmit={handleSaveSubscription} className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[#132A2E] mb-1">
                        Filter Rombongan Belajar Anak
                      </label>
                      <select
                        value={rombelFilter}
                        onChange={(e) => setRombelFilter(e.target.value as 'Semua' | RombelName)}
                        className="w-full px-3 py-2 text-xs bg-white border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500"
                      >
                        {ROMBEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center justify-between gap-3 text-xs text-[#132A2E] cursor-pointer">
                      <span>Aktifkan notifikasi pop-up otomatis di portal</span>
                      <input
                        type="checkbox"
                        checked={instantAlert}
                        onChange={(e) => setInstantAlert(e.target.checked)}
                        className="accent-emerald-600 w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 text-xs text-[#132A2E] cursor-pointer">
                      <span>Aktifkan notifikasi perangkat (Browser Push)</span>
                      <input
                        type="checkbox"
                        checked={browserPush}
                        onChange={(e) => void handleEnableBrowserPush(e.target.checked)}
                        className="accent-sky-600 w-4 h-4"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={savingSub}
                      className="btn-3d w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 border-b-[3px] border-emerald-800 rounded-xl disabled:opacity-60"
                    >
                      {savedFeedback ? (
                        <>
                          <Icon3D name="check" tone="amber" size="xs" />
                          Preferensi Tersimpan
                        </>
                      ) : savingSub ? (
                        'Menyimpan...'
                      ) : (
                        'Simpan Pengaturan Notifikasi'
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Active Announcements Feed */}
              <div className="mt-6 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                  Daftar Pengumuman Aktif ({activeList.length})
                </h3>
                {activeList.length === 0 ? (
                  <p className="text-xs text-slate-600 py-6 text-center bg-white border border-slate-200 rounded-xl">
                    Belum ada pengumuman aktif saat ini.
                  </p>
                ) : (
                  activeList.map((ann) => {
                    const cardTheme =
                      ann.priority === 'mendesak'
                        ? 'bg-gradient-to-br from-rose-50 via-white to-orange-50/70 border-rose-200 hover:border-rose-300'
                        : ann.priority === 'penting'
                        ? 'bg-gradient-to-br from-amber-50 via-white to-yellow-50/70 border-amber-200 hover:border-amber-300'
                        : 'bg-gradient-to-br from-sky-50 via-white to-teal-50/70 border-sky-200 hover:border-sky-300';
                    return (
                      <article
                        key={ann.id}
                        className={`card-interactive border rounded-2xl p-4 space-y-1.5 ${cardTheme}`}
                      >
                        <div className="flex items-center gap-2 text-[11px] text-slate-600">
                          <span
                            className={`font-semibold ${
                              ann.priority === 'mendesak'
                                ? 'text-rose-700'
                                : ann.priority === 'penting'
                                ? 'text-amber-700'
                                : 'text-sky-700'
                            }`}
                          >
                            {ann.priority === 'mendesak'
                              ? 'Mendesak'
                              : ann.priority === 'penting'
                              ? 'Penting'
                              : 'Informasi'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{ann.targetAudience}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-[#132A2E]">{ann.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{ann.message}</p>
                        <p className="text-[11px] text-slate-500 pt-1">
                          Diterbitkan oleh {ann.authorName}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
