import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSchool } from '../context/SchoolContext';
import { Icon3D } from './Icon3D';

interface PortalLoginModalProps {
  open: boolean;
  initialTab?: 'google' | 'tim-it';
  onClose: () => void;
  onAdminAuthenticated?: () => void;
}

export const PortalLoginModal: React.FC<PortalLoginModalProps> = ({
  open,
  initialTab = 'google',
  onClose,
  onAdminAuthenticated,
}) => {
  const {
    user,
    isFirebaseAdmin,
    isItAdmin,
    authLoading,
    itAdminStatus,
    refreshItAdminStatus,
    signInWithGoogle,
    setupItAdmin,
    loginItAdmin,
  } = useSchool();

  const [tab, setTab] = useState<'google' | 'tim-it'>(initialTab);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
    void refreshItAdminStatus();
  }, [open, initialTab, refreshItAdminStatus]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const isSetupMode = itAdminStatus.mode === 'needs-setup' && !itAdminStatus.configured;

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    await signInWithGoogle();
    onClose();
  };

  const handleItAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');

    const cleanPhone = phone.trim();
    if (cleanPhone.replace(/\D/g, '').length < 9) {
      setErrorMsg('Masukkan nomor HP Tim IT yang valid (minimal 9 digit).');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal terdiri dari 8 karakter.');
      return;
    }
    if (isSetupMode && password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSetupMode) {
        await setupItAdmin(cleanPhone, password);
      } else {
        await loginItAdmin(cleanPhone, password);
      }
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      onAdminAuthenticated?.();
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Proses autentikasi Tim IT gagal.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-login-title"
    >
      <div className="my-auto w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border-2 border-emerald-200 rounded-3xl shadow-2xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-sky-500" />
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Icon3D name="shield" tone="emerald" size="md" variant="tile" />
              <div>
                <h2
                  id="portal-login-title"
                  className="font-editorial text-xl font-semibold text-[#132A2E]"
                >
                  Masuk Portal SDN Cikawao
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pilih akses Kepala Sekolah, Wali Murid, atau Tim IT.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela masuk"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            >
              <Icon3D name="close" tone="rose" size="xs" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setTab('google');
                setErrorMsg('');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === 'google'
                  ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Akun Google
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('tim-it');
                setErrorMsg('');
                void refreshItAdminStatus();
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === 'tim-it'
                  ? 'bg-white text-sky-800 shadow-xs border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tim IT (No. HP)
            </button>
          </div>

          {tab === 'google' ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-emerald-50/75 border border-emerald-200 p-4 space-y-2 text-xs text-slate-700 leading-relaxed">
                <p className="font-semibold text-emerald-900">
                  Untuk Kepala Sekolah &amp; Wali Murid
                </p>
                <p>
                  Kepala Sekolah menggunakan akun Belajar.id resmi untuk tata kelola penuh, sedangkan orang tua / masyarakat menggunakan akun Google untuk layanan akademik &amp; SILOKA.
                </p>
                {user && (
                  <p className="text-[11px] font-medium text-emerald-800 bg-white/80 rounded-xl px-3 py-2 border border-emerald-200">
                    Saat ini terhubung sebagai {user.email}{' '}
                    {isFirebaseAdmin ? '(Admin Terverifikasi)' : '(Wali Murid)'}.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={authLoading}
                onClick={() => void handleGoogleLogin()}
                className="btn-3d w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 border-b-[3px] border-emerald-800 rounded-xl disabled:opacity-60"
              >
                <Icon3D name="login" tone="white" size="xs" />
                <span>{authLoading ? 'Membuka Google...' : 'Masuk dengan Akun Google'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleItAdminSubmit} className="space-y-4">
              <div className="rounded-2xl bg-sky-50/80 border border-sky-200 p-3.5 text-xs text-slate-700 leading-relaxed">
                {isSetupMode ? (
                  <>
                    <p className="font-semibold text-sky-900">
                      Aktivasi Pertama Akses Tim IT SDN Cikawao
                    </p>
                    <p className="mt-1">
                      Belum ada kredensial Tim IT aktif di server. Daftarkan Nomor HP dan kata sandi Tim IT sekarang untuk mengaktifkan akses Admin Dashboard. Setelah diklaim, kredensial langsung dikunci aman di server.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-sky-900">
                      Login Administrator Tim IT SDN Cikawao
                    </p>
                    <p className="mt-1">
                      Masuk menggunakan nomor HP dan kata sandi Tim IT yang terdaftar untuk mengakses Dashboard Admin SDN Cikawao.
                    </p>
                  </>
                )}
              </div>

              {isItAdmin && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800">
                  Sesi Tim IT SDN Cikawao sudah aktif saat ini.
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-800 font-medium"
                >
                  <Icon3D name="alert" tone="rose" size="xs" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="it-admin-phone"
                  className="block text-[11px] font-semibold text-slate-700 mb-1"
                >
                  Nomor HP Tim IT
                </label>
                <input
                  id="it-admin-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 08xxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FFFDF7] border border-slate-300 focus:border-sky-500 focus:outline-none rounded-xl font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="it-admin-password"
                    className="block text-[11px] font-semibold text-slate-700"
                  >
                    {isSetupMode ? 'Buat Kata Sandi Tim IT' : 'Kata Sandi'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-[11px] font-semibold text-sky-700 hover:underline"
                  >
                    {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>
                <input
                  id="it-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete={isSetupMode ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FFFDF7] border border-slate-300 focus:border-sky-500 focus:outline-none rounded-xl"
                />
              </div>

              {isSetupMode && (
                <div>
                  <label
                    htmlFor="it-admin-password-confirm"
                    className="block text-[11px] font-semibold text-slate-700 mb-1"
                  >
                    Konfirmasi Kata Sandi
                  </label>
                  <input
                    id="it-admin-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi Tim IT"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FFFDF7] border border-slate-300 focus:border-sky-500 focus:outline-none rounded-xl"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-3d w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 border-b-[3px] border-blue-800 rounded-xl disabled:opacity-60"
              >
                <Icon3D name="user-check" tone="white" size="xs" />
                <span>
                  {submitting
                    ? 'Memverifikasi...'
                    : isSetupMode
                    ? 'Aktifkan & Masuk Tim IT'
                    : 'Masuk sebagai Tim IT SDN Cikawao'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
