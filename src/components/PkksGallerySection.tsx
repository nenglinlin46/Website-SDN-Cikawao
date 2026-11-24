import React, { useEffect, useMemo, useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { SCHOOL_IDENTITY } from '../data/seedData';
import type { AppTab, GalleryCategory, GalleryItem, PkksComponent } from '../types';
import { Icon3D, type Icon3DName, type Icon3DTone } from './Icon3D';
import { SafeImage } from './SafeImage';

interface PkksGallerySectionProps {
  onNavigate: (tab: AppTab) => void;
}

const GALLERY_FILTERS: Array<'Semua' | GalleryCategory> = [
  'Semua',
  'KBM',
  'Ekstrakurikuler',
  'Fasilitas',
  'Prestasi',
];

const PKKS_COMPONENTS: Array<'Semua' | PkksComponent> = [
  'Semua',
  'Manajerial',
  'Kurikulum Merdeka',
  'Supervisi',
  'Kewirausahaan',
  'Pengembangan Diri',
  'Kemitraan',
];

const GALLERY_CAT_STYLE: Record<
  GalleryCategory,
  { text: string; bar: string; card: string; tone: Icon3DTone; icon: Icon3DName; activeBtn: string }
> = {
  KBM: {
    text: 'text-sky-800',
    bar: 'bg-gradient-to-r from-sky-400 to-blue-500',
    card: 'border-sky-200 hover:border-sky-400 bg-gradient-to-b from-white to-sky-50/45',
    tone: 'sky',
    icon: 'book',
    activeBtn: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm',
  },
  Ekstrakurikuler: {
    text: 'text-amber-800',
    bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    card: 'border-amber-200 hover:border-amber-400 bg-gradient-to-b from-white to-amber-50/45',
    tone: 'amber',
    icon: 'award',
    activeBtn: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm',
  },
  Fasilitas: {
    text: 'text-emerald-800',
    bar: 'bg-gradient-to-r from-emerald-400 to-teal-500',
    card: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-b from-white to-emerald-50/45',
    tone: 'emerald',
    icon: 'school',
    activeBtn: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm',
  },
  Prestasi: {
    text: 'text-orange-800',
    bar: 'bg-gradient-to-r from-orange-400 to-rose-500',
    card: 'border-orange-200 hover:border-rose-400 bg-gradient-to-b from-white to-orange-50/45',
    tone: 'orange',
    icon: 'award',
    activeBtn: 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm',
  },
};

function isSafeHttpUrl(url: string): boolean {
  if (!url) return false;
  return url.startsWith('https://') || url.startsWith('http://');
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let videoId = '';
    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('/')[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] || '';
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/')[2] || '';
      }
    }
    if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  } catch {
    return null;
  }
}

export const PkksGallerySection: React.FC<PkksGallerySectionProps> = ({ onNavigate }) => {
  const { isAdmin, gallery, pkksItems, resolveGalleryVideoUrl } = useSchool();
  const [subView, setSubView] = useState<'galeri' | 'pkks'>('galeri');
  const [galleryFilter, setGalleryFilter] = useState<'Semua' | GalleryCategory>('Semua');
  const [mediaFilter, setMediaFilter] = useState<'Semua' | 'Foto' | 'Video'>('Semua');
  const [pkksFilter, setPkksFilter] = useState<'Semua' | PkksComponent>('Semua');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
  const [lightboxVideoUrl, setLightboxVideoUrl] = useState('');
  const [lightboxLoading, setLightboxLoading] = useState(false);
  const [lightboxError, setLightboxError] = useState('');

  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [inlineVideoUrls, setInlineVideoUrls] = useState<Record<string, string>>({});
  const [loadingInlineId, setLoadingInlineId] = useState<string | null>(null);
  const [inlineVideoError, setInlineVideoError] = useState<string>('');

  const filteredGallery = useMemo(() => {
    return gallery.filter((g) => {
      const catMatch = galleryFilter === 'Semua' || g.category === galleryFilter;
      const isVideo = g.mediaType === 'video';
      const mediaMatch =
        mediaFilter === 'Semua' ||
        (mediaFilter === 'Video' && isVideo) ||
        (mediaFilter === 'Foto' && !isVideo);
      return catMatch && mediaMatch;
    });
  }, [gallery, galleryFilter, mediaFilter]);

  const videoCount = useMemo(
    () => gallery.filter((g) => g.mediaType === 'video').length,
    [gallery]
  );

  useEffect(() => {
    let active = true;
    if (!lightboxItem || lightboxItem.mediaType !== 'video') {
      setLightboxVideoUrl('');
      setLightboxLoading(false);
      setLightboxError('');
      return;
    }

    const cached = inlineVideoUrls[lightboxItem.id];
    if (cached) {
      setLightboxVideoUrl(cached);
      setLightboxLoading(false);
      setLightboxError('');
      return;
    }

    setLightboxLoading(true);
    setLightboxError('');
    setLightboxVideoUrl('');
    resolveGalleryVideoUrl(lightboxItem)
      .then((url) => {
        if (!active) return;
        if (!url) {
          setLightboxError('Sumber video tidak ditemukan.');
        } else {
          setLightboxVideoUrl(url);
          setInlineVideoUrls((prev) => ({ ...prev, [lightboxItem.id]: url }));
        }
      })
      .catch(() => {
        if (!active) return;
        setLightboxError('Gagal memuat video kegiatan. Silakan coba kembali.');
      })
      .finally(() => {
        if (active) setLightboxLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lightboxItem, inlineVideoUrls, resolveGalleryVideoUrl]);

  const handlePlayInline = async (item: GalleryItem) => {
    setInlineVideoError('');
    const existingUrl = inlineVideoUrls[item.id];
    if (existingUrl) {
      setPlayingCardId(item.id);
      return;
    }

    setLoadingInlineId(item.id);
    try {
      const url = await resolveGalleryVideoUrl(item);
      if (!url) {
        setInlineVideoError('Sumber video belum tersedia.');
        return;
      }
      setInlineVideoUrls((prev) => ({ ...prev, [item.id]: url }));
      setPlayingCardId(item.id);
    } catch {
      setInlineVideoError('Gagal memuat video kegiatan. Coba buka ulang halaman.');
    } finally {
      setLoadingInlineId(null);
    }
  };

  const filteredPkks = useMemo(() => {
    if (pkksFilter === 'Semua') return pkksItems;
    return pkksItems.filter((p) => p.component === pkksFilter);
  }, [pkksItems, pkksFilter]);

  const pkksStats = useMemo(() => {
    const total = pkksItems.length;
    const complete = pkksItems.filter((p) => p.status === 'Lengkap').length;
    const avgScore =
      total > 0
        ? (pkksItems.reduce((acc, p) => acc + (p.score || 0), 0) / total).toFixed(2)
        : '0.00';
    return { total, complete, avgScore };
  }, [pkksItems]);

  const lightboxYtEmbed =
    lightboxItem?.mediaType === 'video' ? getYouTubeEmbedUrl(lightboxVideoUrl) : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-20">
      {/* Colorful Header + Sub-View Segmented Control */}
      <div className="rounded-3xl bg-gradient-to-br from-orange-100/80 via-amber-50/70 to-emerald-100/75 border-2 border-orange-300/80 p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2.5">
              <Icon3D
                name={subView === 'galeri' ? 'camera' : 'file-check'}
                tone={subView === 'galeri' ? 'orange' : 'emerald'}
                size="md"
                variant="tile"
              />
              <p className="text-xs font-bold uppercase tracking-wider text-orange-800">
                Dokumentasi &amp; Akuntabilitas Sekolah
              </p>
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#132A2E] mt-3">
              {subView === 'galeri'
                ? 'Galeri Foto & Video Sekolah SDN Cikawao'
                : 'Penilaian Kinerja Kepala Sekolah (PKKS)'}
            </h1>
            <p className="text-sm text-slate-700 mt-2 max-w-2xl leading-relaxed">
              {subView === 'galeri'
                ? 'Dokumentasi foto dan video kegiatan belajar mengajar Kurikulum Merdeka, fasilitas sekolah, dan aktivitas siswa yang dapat langsung dilihat dan diputar oleh pengunjung.'
                : `Rekapitulasi indikator kinerja dan bukti fisik PKKS Kepala SDN Cikawao, ${SCHOOL_IDENTITY.principal.name} (NIP. ${SCHOOL_IDENTITY.principal.nip}).`}
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 p-1.5 bg-white/90 border-2 border-orange-200 rounded-2xl self-start shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setSubView('galeri')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                subView === 'galeri'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm'
                  : 'text-orange-900/80 hover:bg-orange-50'
              }`}
            >
              <Icon3D
                name="camera"
                tone={subView === 'galeri' ? 'white' : 'orange'}
                size="xs"
              />
              Galeri Sekolah
            </button>
            <button
              type="button"
              onClick={() => setSubView('pkks')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                subView === 'pkks'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                  : 'text-emerald-900/80 hover:bg-emerald-50'
              }`}
            >
              <Icon3D
                name="file-check"
                tone={subView === 'pkks' ? 'white' : 'emerald'}
                size="xs"
              />
              Fitur PKKS
            </button>
          </div>
        </div>
      </div>

      {subView === 'galeri' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gradient-to-r from-sky-50 via-white to-amber-50 border-2 border-sky-200 rounded-2xl shadow-xs">
                {GALLERY_FILTERS.map((f) => {
                  const active = galleryFilter === f;
                  const activeBtn =
                    f === 'Semua'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                      : GALLERY_CAT_STYLE[f].activeBtn;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setGalleryFilter(f)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                        active ? activeBtn : 'text-sky-900/75 hover:bg-sky-50'
                      }`}
                    >
                      <Icon3D
                        name={f === 'Semua' ? 'image' : GALLERY_CAT_STYLE[f].icon}
                        tone={active ? 'white' : f === 'Semua' ? 'sky' : GALLERY_CAT_STYLE[f].tone}
                        size="xs"
                      />
                      <span>{f}</span>
                    </button>
                  );
                })}
              </div>

              {videoCount > 0 && (
                <div className="flex items-center gap-1.5 p-1.5 bg-gradient-to-r from-orange-50 to-rose-50 border-2 border-orange-200 rounded-2xl shadow-xs">
                  {(['Semua', 'Foto', 'Video'] as const).map((mf) => {
                    const active = mediaFilter === mf;
                    return (
                      <button
                        key={mf}
                        type="button"
                        onClick={() => setMediaFilter(mf)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-sm'
                            : 'text-orange-950/75 hover:bg-white'
                        }`}
                      >
                        <Icon3D
                          name={mf === 'Video' ? 'video' : mf === 'Foto' ? 'image' : 'layers'}
                          tone={active ? 'white' : mf === 'Video' ? 'rose' : 'orange'}
                          size="xs"
                        />
                        {mf === 'Video' ? `Video (${videoCount})` : mf}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="btn-3d inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-600 rounded-xl whitespace-nowrap shrink-0"
              >
                <Icon3D name="shield" tone="white" size="xs" />
                Kelola Galeri di Dashboard Admin
              </button>
            )}
          </div>

          {inlineVideoError && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 bg-rose-50 border-2 border-rose-200 rounded-xl px-4 py-2.5">
              <Icon3D name="alert" tone="rose" size="xs" />
              <span>{inlineVideoError}</span>
            </div>
          )}

          {filteredGallery.length === 0 ? (
            <div className="bg-gradient-to-br from-orange-50/60 via-white to-sky-50/60 border-2 border-orange-200 rounded-2xl p-10 text-center text-sm text-slate-600">
              Belum ada dokumentasi untuk filter yang dipilih.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGallery.map((item) => {
                const isVideo = item.mediaType === 'video';
                const isPlayingInline = isVideo && playingCardId === item.id;
                const activeInlineUrl = isPlayingInline ? inlineVideoUrls[item.id] || '' : '';
                const inlineYtEmbed = activeInlineUrl ? getYouTubeEmbedUrl(activeInlineUrl) : null;
                const isLoadingThis = loadingInlineId === item.id;
                const catStyle = GALLERY_CAT_STYLE[item.category] || GALLERY_CAT_STYLE.KBM;

                return (
                  <article
                    key={item.id}
                    className={`card-interactive border-2 rounded-2xl overflow-hidden group flex flex-col shadow-xs ${catStyle.card}`}
                  >
                    <div className={`h-1.5 w-full ${catStyle.bar}`} />
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                      {isPlayingInline && activeInlineUrl ? (
                        <>
                          {inlineYtEmbed ? (
                            <iframe
                              src={inlineYtEmbed}
                              title={item.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-0"
                            />
                          ) : (
                            <video
                              src={activeInlineUrl}
                              poster={item.imageUrl}
                              controls
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover bg-black"
                            />
                          )}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                            <button
                              type="button"
                              onClick={() => {
                                setPlayingCardId(null);
                                setLightboxItem(item);
                              }}
                              aria-label="Perbesar video"
                              className="p-1.5 rounded-xl bg-black/70 hover:bg-sky-600 text-white transition-colors"
                            >
                              <Icon3D name="maximize" tone="white" size="xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPlayingCardId(null)}
                              aria-label="Tutup pemutar inline"
                              className="p-1.5 rounded-xl bg-black/70 hover:bg-rose-600 text-white transition-colors"
                            >
                              <Icon3D name="close" tone="white" size="xs" />
                            </button>
                          </div>
                        </>
                      ) : isVideo ? (
                        <button
                          type="button"
                          disabled={isLoadingThis}
                          onClick={() => void handlePlayInline(item)}
                          aria-label={`Putar video ${item.title}`}
                          className="relative w-full h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                          <SafeImage
                            src={item.imageUrl}
                            alt={item.title}
                            fallbackTitle={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center gap-2">
                            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-rose-600 border-b-[3px] border-rose-800 text-white flex items-center justify-center shadow-xl transition-transform group-hover:scale-110">
                              {isLoadingThis ? (
                                <Icon3D name="loader" tone="white" size="md" className="animate-spin" />
                              ) : (
                                <Icon3D name="play" tone="white" size="md" className="ml-0.5" />
                              )}
                            </span>
                            <span className="text-[11px] font-semibold text-white bg-black/65 px-3 py-1 rounded-lg backdrop-blur-xs">
                              {isLoadingThis ? 'Memuat Video...' : 'Putar Video'}
                            </span>
                          </div>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxItem(item);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                setLightboxItem(item);
                              }
                            }}
                            aria-label={`Buka pratinjau penuh ${item.title}`}
                            className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-sky-600 text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                          >
                            <Icon3D name="maximize" tone="white" size="xs" />
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLightboxItem(item)}
                          className="relative w-full h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                        >
                          <SafeImage
                            src={item.imageUrl}
                            alt={item.title}
                            fallbackTitle={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                          <span className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Icon3D name="maximize" tone="white" size="xs" />
                          </span>
                        </button>
                      )}
                    </div>

                    <div
                      onClick={() => {
                        if (isVideo) {
                          setPlayingCardId(null);
                        }
                        setLightboxItem(item);
                      }}
                      className="p-4 space-y-1.5 cursor-pointer flex-1 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {isVideo && (
                            <>
                              <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                                <Icon3D name="video" tone="rose" size="xs" />
                                Video
                              </span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span className={`inline-flex items-center gap-1 font-bold ${catStyle.text}`}>
                            <Icon3D name={catStyle.icon} tone={catStyle.tone} size="xs" />
                            {item.category}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.takenDate}</span>
                        </div>
                        <h2 className="text-sm font-semibold text-[#132A2E]">{item.title}</h2>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.caption}</p>
                      </div>

                      {isVideo && (
                        <div className="pt-2 flex items-center gap-2 text-xs font-bold text-orange-700">
                          <Icon3D name="play" tone="orange" size="xs" />
                          <span>Putar di sini atau layar penuh</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* PKKS Summary Metrics with 3D Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-sky-100/90 via-white to-blue-100/70 border-2 border-sky-300 shadow-xs flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-sky-900">Total Indikator PKKS</p>
                <p className="mt-1 font-mono text-3xl font-bold text-sky-700 tabular-nums">
                  {pkksStats.total}
                </p>
              </div>
              <Icon3D name="clipboard" tone="sky" size="lg" variant="tile" />
            </div>
            <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-emerald-100/90 via-white to-teal-100/70 border-2 border-emerald-300 shadow-xs flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-emerald-900">Bukti Fisik Lengkap</p>
                <p className="mt-1 font-mono text-3xl font-bold text-emerald-700 tabular-nums">
                  {pkksStats.complete} / {pkksStats.total}
                </p>
              </div>
              <Icon3D name="file-check" tone="emerald" size="lg" variant="tile" />
            </div>
            <div className="card-interactive p-5 rounded-2xl bg-gradient-to-br from-amber-100/90 via-white to-orange-100/70 border-2 border-amber-300 shadow-xs flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-amber-900">
                  Rata-rata Skor Kinerja (Skala 4.00)
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-amber-700 tabular-nums">
                  {pkksStats.avgScore}
                </p>
              </div>
              <Icon3D name="award" tone="amber" size="lg" variant="tile" />
            </div>
          </div>

          {/* PKKS Component Filter */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-2 border-emerald-200 rounded-2xl shadow-xs">
              {PKKS_COMPONENTS.map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => setPkksFilter(comp)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 ${
                    pkksFilter === comp
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                      : 'text-emerald-900/75 hover:bg-emerald-50'
                  }`}
                >
                  {comp}
                </button>
              ))}
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="btn-3d inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl whitespace-nowrap shrink-0"
              >
                <Icon3D name="shield" tone="white" size="xs" />
                Kelola Bukti &amp; Skor PKKS
              </button>
            )}
          </div>

          {/* PKKS Table */}
          <div className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-sky-500 to-amber-400" />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-emerald-200 bg-gradient-to-r from-emerald-50 via-sky-50/70 to-amber-50/50 text-xs text-emerald-950">
                    <th className="py-3.5 px-4 font-bold">Kode</th>
                    <th className="py-3.5 px-4 font-bold">Komponen</th>
                    <th className="py-3.5 px-4 font-bold">Indikator &amp; Ringkasan Bukti Fisik</th>
                    <th className="py-3.5 px-4 font-bold">Status Berkas</th>
                    <th className="py-3.5 px-4 font-bold text-right">Skor</th>
                    <th className="py-3.5 px-4 font-bold text-right">Tautan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPkks.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/45 align-top transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-emerald-800 whitespace-nowrap">
                        {item.code}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-sky-700 whitespace-nowrap">
                        {item.component}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-medium text-[#132A2E]">{item.indicatorTitle}</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {item.evidenceSummary}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold ${
                            item.status === 'Lengkap'
                              ? 'text-emerald-700'
                              : item.status === 'Dalam Proses'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          <Icon3D
                            name={
                              item.status === 'Lengkap'
                                ? 'check-circle'
                                : item.status === 'Dalam Proses'
                                ? 'clock'
                                : 'alert'
                            }
                            tone={
                              item.status === 'Lengkap'
                                ? 'emerald'
                                : item.status === 'Dalam Proses'
                                ? 'amber'
                                : 'rose'
                            }
                            size="xs"
                          />
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-[#132A2E]">
                        {Number(item.score ?? 0).toFixed(1)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isSafeHttpUrl(item.evidenceUrl) ? (
                          <a
                            href={item.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:underline"
                          >
                            <span>Bukti</span>
                            <Icon3D name="external" tone="sky" size="xs" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">Arsip Sekolah</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Lightbox Modal (Photo Preview & Direct Video Player) */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
          onClick={() => setLightboxItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden border-2 border-orange-300 shadow-2xl"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-amber-400 to-sky-500" />
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-gradient-to-r from-orange-50/60 via-white to-sky-50/60">
              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                {lightboxItem.mediaType === 'video' && (
                  <>
                    <span className="font-bold text-rose-700 inline-flex items-center gap-1">
                      <Icon3D name="video" tone="rose" size="xs" />
                      Video Kegiatan
                    </span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <span className="font-bold text-emerald-700">{lightboxItem.category}</span>
                <span aria-hidden="true">·</span>
                <span>{lightboxItem.takenDate}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                aria-label="Tutup pemutar media"
                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <Icon3D name="close" tone="rose" size="sm" />
              </button>
            </div>
            <div className="bg-[#18221D] max-h-[65vh] flex items-center justify-center overflow-hidden">
              {lightboxItem.mediaType === 'video' ? (
                lightboxLoading ? (
                  <div className="py-20 flex flex-col items-center gap-2 text-white/90 text-xs">
                    <Icon3D name="loader" tone="amber" size="lg" className="animate-spin" />
                    <span>Memuat video kegiatan...</span>
                  </div>
                ) : lightboxError ? (
                  <div className="py-16 px-6 text-center text-xs text-red-200">{lightboxError}</div>
                ) : lightboxYtEmbed ? (
                  <div className="w-full aspect-video">
                    <iframe
                      src={lightboxYtEmbed}
                      title={lightboxItem.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : lightboxVideoUrl ? (
                  <video
                    src={lightboxVideoUrl}
                    poster={lightboxItem.imageUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-[65vh] bg-black"
                  />
                ) : (
                  <SafeImage
                    src={lightboxItem.imageUrl}
                    alt={lightboxItem.title}
                    className="w-full h-full max-h-[65vh] object-contain"
                  />
                )
              ) : (
                <SafeImage
                  src={lightboxItem.imageUrl}
                  alt={lightboxItem.title}
                  className="w-full h-full max-h-[65vh] object-contain"
                />
              )}
            </div>
            <div className="p-5">
              <h3 className="font-editorial text-lg font-semibold text-[#132A2E]">
                {lightboxItem.title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">{lightboxItem.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
