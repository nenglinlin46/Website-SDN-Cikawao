import React, { useMemo, useRef, useState } from 'react';
import { Icon3D, type Icon3DName, type Icon3DTone } from './Icon3D';
import { useSchool } from '../context/SchoolContext';
import {
  GTK_EMPLOYMENT_STATUSES,
  GTK_PORTRAIT_PRESETS,
  GTK_RANK_OPTIONS,
  JABAR_BERAKSI_PILLARS,
  SCHOOL_IDENTITY,
  SCHOOL_IMAGES,
  SILOKA_PILLARS,
} from '../data/seedData';
import {
  downloadDaftarPdTemplate,
  parseDaftarPdExcel,
  type DaftarPdParseResult,
} from '../utils/daftarPdExcel';
import { SafeImage } from './SafeImage';
import type {
  AnnouncementPriority,
  EkskulType,
  EmploymentStatus,
  GalleryCategory,
  GalleryMediaType,
  NewsCategory,
  NewsStatus,
  P5Status,
  PkksComponent,
  PkksStatus,
  RombelName,
  SilokaPillar,
  SilokaStatus,
  StaffCategory,
  TargetAudience,
} from '../types';

type AdminPanelTab =
  | 'overview'
  | 'staff'
  | 'news'
  | 'announcements'
  | 'students'
  | 'pkks'
  | 'jabar-beraksi'
  | 'siloka'
  | 'gallery';

const IMAGE_PRESETS = [
  { label: 'Foto Kampus SDN Cikawao', url: SCHOOL_IMAGES.hero },
  { label: 'Foto KBM Kurikulum Merdeka', url: SCHOOL_IMAGES.kbm },
  { label: 'Foto Pramuka & Angklung', url: SCHOOL_IMAGES.ekskul },
  { label: 'Foto Ruang Baca & Literasi', url: SCHOOL_IMAGES.library },
  { label: 'Foto Kepala Sekolah', url: SCHOOL_IMAGES.kepsek },
];

const MAX_PHOTO_URL_LENGTH = 80000;

function getStaffInitials(fullName: string): string {
  const parts = fullName
    .replace(/,.*$/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'GK';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

async function compressAvatarToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar (JPG, PNG, atau WebP).');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca gambar yang dipilih.'));
      el.src = objectUrl;
    });

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser tidak mendukung pemrosesan kanvas gambar.');
    }

    const minSide = Math.min(img.width, img.height);
    const sx = Math.max(0, (img.width - minSide) / 2);
    const sy = Math.max(0, (img.height - minSide) / 2);
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

    for (const quality of [0.8, 0.65, 0.48]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_PHOTO_URL_LENGTH) {
        return dataUrl;
      }
    }
  throw new Error('Ukuran foto setelah dikompresi masih terlalu besar. Pilih foto lain yang lebih ringan.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const MAX_JB_PHOTO_URL_LENGTH = 120000;

async function compressCoverPhotoToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File foto harus berupa gambar (JPG, PNG, atau WebP).');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca gambar yang dipilih.'));
      el.src = objectUrl;
    });

    const targetW = 640;
    const targetH = 400;
    const targetRatio = targetW / targetH;
    const srcRatio = img.width / img.height;

    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (srcRatio > targetRatio) {
      sw = Math.round(img.height * targetRatio);
      sx = Math.max(0, Math.round((img.width - sw) / 2));
    } else if (srcRatio < targetRatio) {
      sh = Math.round(img.width / targetRatio);
      sy = Math.max(0, Math.round((img.height - sh) / 2));
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser tidak mendukung pemrosesan kanvas gambar.');
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

    for (const quality of [0.8, 0.65, 0.5]) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= MAX_JB_PHOTO_URL_LENGTH) {
        return dataUrl;
      }
    }
    throw new Error('Ukuran foto setelah dikompresi masih terlalu besar. Pilih foto lain yang lebih ringan.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function compressGalleryPhotoToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File foto harus berupa gambar (JPG, PNG, atau WebP).');
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca gambar yang dipilih.'));
      el.src = objectUrl;
    });

    const attempts: Array<{ w: number; h: number; qualities: number[] }> = [
      { w: 800, h: 600, qualities: [0.82, 0.7, 0.56] },
      { w: 640, h: 480, qualities: [0.65, 0.5, 0.4] },
    ];

    const srcRatio = img.width / img.height;
    const targetRatio = 4 / 3;
    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (srcRatio > targetRatio) {
      sw = Math.round(img.height * targetRatio);
      sx = Math.max(0, Math.round((img.width - sw) / 2));
    } else if (srcRatio < targetRatio) {
      sh = Math.round(img.width / targetRatio);
      sy = Math.max(0, Math.round((img.height - sh) / 2));
    }

    for (const attempt of attempts) {
      const canvas = document.createElement('canvas');
      canvas.width = attempt.w;
      canvas.height = attempt.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Browser tidak mendukung pemrosesan kanvas gambar.');
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, attempt.w, attempt.h);

      for (const quality of attempt.qualities) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length <= MAX_JB_PHOTO_URL_LENGTH) {
          return dataUrl;
        }
      }
    }

    throw new Error('Ukuran foto setelah dikompresi masih terlalu besar. Pilih foto lain yang lebih ringan.');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const MAX_GALLERY_VIDEO_RAW_BYTES = 30 * 1024 * 1024;
const MAX_GALLERY_VIDEO_INLINE_LEN = 750000;
const GALLERY_VIDEO_CHUNK_LEN = 700000;
const MAX_GALLERY_VIDEO_CHUNKS = 80;

function isGalleryVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|m4v|ogv|ogg)$/i.test(file.name);
}

function isGalleryImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
}

function inferVideoMimeType(file: File): string {
  if (file.type && file.type.startsWith('video/')) {
    return file.type === 'video/quicktime' ? 'video/mp4' : file.type;
  }
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.ogv') || lower.endsWith('.ogg')) return 'video/ogg';
  return 'video/mp4';
}

function isLikelyVideoUrl(url: string): boolean {
  const lower = url.trim().toLowerCase();
  if (!lower) return false;
  if (lower.startsWith('data:video/')) return true;
  if (
    lower.includes('youtube.com/watch') ||
    lower.includes('youtu.be/') ||
    lower.includes('youtube.com/shorts/')
  ) {
    return true;
  }
  return /\.(mp4|webm|mov|m4v|ogv|ogg)(\?.*)?$/i.test(lower);
}

async function captureVideoPosterDataUrl(file: File): Promise<string | null> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = objectUrl;

    const loaded = await new Promise<boolean>((resolve) => {
      const timer = window.setTimeout(() => resolve(false), 3000);
      const done = (ok: boolean) => {
        window.clearTimeout(timer);
        resolve(ok);
      };
      video.onloadeddata = () => {
        const targetSeek =
          Number.isFinite(video.duration) && video.duration > 0.4
            ? Math.min(0.6, video.duration * 0.2)
            : 0;
        if (targetSeek > 0.05) {
          video.onseeked = () => done(true);
          try {
            video.currentTime = targetSeek;
          } catch {
            done(true);
          }
        } else {
          done(true);
        }
      };
      video.onerror = () => done(false);
    });

    if (!loaded || video.videoWidth <= 0 || video.videoHeight <= 0) {
      return null;
    }

    const canvasW = 640;
    const canvasH = 480;
    const targetRatio = canvasW / canvasH;
    const srcRatio = video.videoWidth / video.videoHeight;
    let sx = 0;
    let sy = 0;
    let sw = video.videoWidth;
    let sh = video.videoHeight;

    if (srcRatio > targetRatio) {
      sw = Math.round(video.videoHeight * targetRatio);
      sx = Math.max(0, Math.round((video.videoWidth - sw) / 2));
    } else if (srcRatio < targetRatio) {
      sh = Math.round(video.videoWidth / targetRatio);
      sy = Math.max(0, Math.round((video.videoHeight - sh) / 2));
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvasW, canvasH);

    for (const q of [0.78, 0.62, 0.48]) {
      const dataUrl = canvas.toDataURL('image/jpeg', q);
      if (dataUrl.length <= MAX_JB_PHOTO_URL_LENGTH) {
        return dataUrl;
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function readVideoAsGalleryPayload(file: File): Promise<{
  inlineDataUrl: string;
  chunks: string[] | null;
  mimeType: string;
  previewObjectUrl: string;
}> {
  if (file.size > MAX_GALLERY_VIDEO_RAW_BYTES) {
    throw new Error(
      'Ukuran video melebihi 30 MB. Kompres video terlebih dahulu (MP4/WebM <= 30 MB) atau tempel tautan YouTube / MP4 pada kolom URL.'
    );
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length > 0) {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca file video yang dipilih.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file video dari perangkat.'));
    reader.readAsDataURL(file);
  });

  const mimeType = inferVideoMimeType(file);
  const commaIdx = rawDataUrl.indexOf(',');
  const payloadBase64 = commaIdx >= 0 ? rawDataUrl.slice(commaIdx + 1) : rawDataUrl;
  const normalizedDataUrl = `data:${mimeType};base64,${payloadBase64}`;
  const previewObjectUrl = URL.createObjectURL(file);

  if (normalizedDataUrl.length <= MAX_GALLERY_VIDEO_INLINE_LEN) {
    return {
      inlineDataUrl: normalizedDataUrl,
      chunks: null,
      mimeType,
      previewObjectUrl,
    };
  }

  const chunks: string[] = [];
  for (let i = 0; i < normalizedDataUrl.length; i += GALLERY_VIDEO_CHUNK_LEN) {
    chunks.push(normalizedDataUrl.slice(i, i + GALLERY_VIDEO_CHUNK_LEN));
  }
  if (chunks.length > MAX_GALLERY_VIDEO_CHUNKS) {
    URL.revokeObjectURL(previewObjectUrl);
    throw new Error(
      'Ukuran video setelah dikodekan melampaui batas penyimpanan galeri. Gunakan video berdurasi lebih singkat (<= 30 MB) atau tautan URL.'
    );
  }

  return {
    inlineDataUrl: '',
    chunks,
    mimeType,
    previewObjectUrl,
  };
}

const MAX_DOC_RAW_BYTES = 450 * 1024;
const MAX_DOC_DATA_URL_LENGTH = 700000;

async function readSchoolDocumentAsDataUrl(
  file: File
): Promise<{ dataUrl: string; fileSize: string }> {
  if (file.size > MAX_DOC_RAW_BYTES) {
    throw new Error(
      'Ukuran file melebihi 450 KB. Untuk dokumen berukuran besar, unggah ke Google Drive lalu tempel tautannya pada kolom URL.'
    );
  }
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length > 0) {
        resolve(reader.result);
      } else {
        reject(new Error('Gagal membaca isi file yang dipilih.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat.'));
    reader.readAsDataURL(file);
  });

  if (dataUrl.length > MAX_DOC_DATA_URL_LENGTH) {
    throw new Error('Ukuran berkas setelah dikodekan terlalu besar. Gunakan tautan Google Drive.');
  }

  const sizeLabel =
    file.size < 1024 ? `${file.size} B` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
  return { dataUrl, fileSize: sizeLabel };
}

export const AdminDashboard: React.FC = () => {
  const {
    user,
    isAdmin,
    news,
    announcements,
    gallery,
    pkksItems,
    jabarBeraksi,
    silokaItems,
    staffMembers,
    students,
    linkRequests,
    silokaComplaints,
    allSubscriptionsCount,
    usingFallbackData,
    seeding,
    seedAllInitialData,
    saveNews,
    removeNews,
    saveAnnouncement,
    removeAnnouncement,
    saveGalleryItem,
    removeGalleryItem,
    resolveGalleryVideoUrl,
    saveStudent,
    importStudentsBulk,
    removeStudent,
    resolveStudentLinkRequest,
    savePkksItem,
    removePkksItem,
    saveJabarBeraksi,
    verifyJabarBeraksi,
    removeJabarBeraksi,
    respondSilokaComplaint,
    saveSilokaItem,
    removeSilokaItem,
    saveStaffMember,
    removeStaffMember,
  } = useSchool();

  const [panel, setPanel] = useState<AdminPanelTab>('overview');
  const [statusFeedback, setStatusFeedback] = useState('');

  // GTK (Guru & Tenaga Kependidikan) form & filter state
  const [staffEditId, setStaffEditId] = useState<string | undefined>(undefined);
  const [staffFullName, setStaffFullName] = useState('');
  const [staffNip, setStaffNip] = useState('');
  const [staffCategory, setStaffCategory] = useState<StaffCategory>('Guru');
  const [staffEmpStatus, setStaffEmpStatus] = useState<EmploymentStatus>('PNS');
  const [staffRole, setStaffRole] = useState('');
  const [staffRank, setStaffRank] = useState('');
  const [staffRankCustomMode, setStaffRankCustomMode] = useState(false);
  const [staffAssignment, setStaffAssignment] = useState('');
  const [staffPhotoUrl, setStaffPhotoUrl] = useState('');
  const [staffMotto, setStaffMotto] = useState('');
  const [staffPhotoError, setStaffPhotoError] = useState('');
  const [staffUploadingPhoto, setStaffUploadingPhoto] = useState(false);
  const staffPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [staffSortOrder, setStaffSortOrder] = useState<number>(11);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffCatFilter, setStaffCatFilter] = useState<'Semua' | StaffCategory>('Semua');
  const [confirmDeleteStaffId, setConfirmDeleteStaffId] = useState<string | null>(null);

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    return staffMembers.filter((m) => {
      const matchCat = staffCatFilter === 'Semua' || m.category === staffCatFilter;
      const matchSearch =
        !q ||
        m.fullName.toLowerCase().includes(q) ||
        m.nip.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.assignment.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [staffMembers, staffSearch, staffCatFilter]);

  const guruCount = useMemo(
    () => staffMembers.filter((m) => m.category === 'Guru').length,
    [staffMembers]
  );
  const tendikCount = useMemo(
    () => staffMembers.filter((m) => m.category === 'Tenaga Kependidikan').length,
    [staffMembers]
  );

  // News form state
  const [newsIdEdit, setNewsIdEdit] = useState<string | undefined>(undefined);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCat, setNewsCat] = useState<NewsCategory>('Kurikulum Merdeka');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState<string>(SCHOOL_IMAGES.kbm);
  const [newsStatus, setNewsStatus] = useState<NewsStatus>('published');

  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annMsg, setAnnMsg] = useState('');
  const [annPriority, setAnnPriority] = useState<AnnouncementPriority>('penting');
  const [annAudience, setAnnAudience] = useState<TargetAudience>('Semua Orang Tua');
  const [annAutoNotify, setAnnAutoNotify] = useState(true);

  // Student form state
  const [stuEditId, setStuEditId] = useState<string | undefined>(undefined);
  const [stuNisn, setStuNisn] = useState('');
  const [stuNik, setStuNik] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuRombel, setStuRombel] = useState<RombelName>('Kelas 6');
  const [stuGender, setStuGender] = useState<'L' | 'P'>('L');
  const [stuParentName, setStuParentName] = useState('');
  const [stuParentEmail, setStuParentEmail] = useState('');
  const [stuAttendance, setStuAttendance] = useState(96);
  const [stuP5Title, setStuP5Title] = useState('Proyek Kearifan Lokal Sumedang');
  const [stuP5Status, setStuP5Status] = useState<P5Status>('Berkembang Sesuai Harapan');
  const [stuMath, setStuMath] = useState(85);
  const [stuIndo, setStuIndo] = useState(88);
  const [stuIpas, setStuIpas] = useState(86);
  const [stuPancasila, setStuPancasila] = useState(90);
  const [stuSunda, setStuSunda] = useState(87);
  const [stuNote, setStuNote] = useState('');

  // Excel Daftar PD import & student filter state
  const excelInputRef = useRef<HTMLInputElement | null>(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelParseResult, setExcelParseResult] = useState<DaftarPdParseResult | null>(null);
  const [excelParseError, setExcelParseError] = useState('');
  const [importingExcel, setImportingExcel] = useState(false);
  const [stuSearch, setStuSearch] = useState('');
  const [stuFilterRombel, setStuFilterRombel] = useState<'Semua' | RombelName>('Semua');

  const filteredStudents = useMemo(() => {
    const q = stuSearch.trim().toLowerCase();
    return students.filter((s) => {
      const matchRombel = stuFilterRombel === 'Semua' || s.rombel === stuFilterRombel;
      const matchSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        (s.nik && s.nik.includes(q)) ||
        s.parentName.toLowerCase().includes(q);
      return matchRombel && matchSearch;
    });
  }, [students, stuSearch, stuFilterRombel]);

  // PKKS form state
  const [pkksEditId, setPkksEditId] = useState<string | undefined>(undefined);
  const [pkksCode, setPkksCode] = useState('PKKS-M.07');
  const [pkksComp, setPkksComp] = useState<PkksComponent>('Manajerial');
  const [pkksTitle, setPkksTitle] = useState('');
  const [pkksSummary, setPkksSummary] = useState('');
  const [pkksUrl, setPkksUrl] = useState('https://belajar.id');
  const [pkksStatus, setPkksStatus] = useState<PkksStatus>('Lengkap');
  const [pkksScore, setPkksScore] = useState('4');
  const [pkksSaving, setPkksSaving] = useState(false);
  const [pkksError, setPkksError] = useState('');
  const pkksFormRef = useRef<HTMLFormElement | null>(null);

  // Jabar Beraksi form, photo upload & file attachment state
  const [jbEditId, setJbEditId] = useState<string | undefined>(undefined);
  const [jbTitle, setJbTitle] = useState('');
  const [jbType, setJbType] = useState<EkskulType>('Pendidikan Karakter');
  const [jbCoach, setJbCoach] = useState('Neng Linlin Irmawati, S.Pd.');
  const [jbDate, setJbDate] = useState('23 November 2026');
  const [jbCount, setJbCount] = useState(184);
  const [jbOutcome, setJbOutcome] = useState('');
  const [jbDesc, setJbDesc] = useState('');
  const [jbStatus, setJbStatus] = useState<'terverifikasi' | 'menunggu'>('terverifikasi');
  const [jbImage, setJbImage] = useState<string>(SCHOOL_IMAGES.ekskul);
  const [jbPhotoError, setJbPhotoError] = useState('');
  const [jbUploadingPhoto, setJbUploadingPhoto] = useState(false);
  const [jbSaving, setJbSaving] = useState(false);
  const [confirmDeleteJbId, setConfirmDeleteJbId] = useState<string | null>(null);
  const jbPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const jbFormRef = useRef<HTMLFormElement | null>(null);
  const [jbFileName, setJbFileName] = useState('');
  const [jbFileUrl, setJbFileUrl] = useState('');
  const [jbFileSize, setJbFileSize] = useState('');
  const [jbFileError, setJbFileError] = useState('');
  const [jbUploadingFile, setJbUploadingFile] = useState(false);
  const [jbFilterCategory, setJbFilterCategory] = useState<'Semua' | EkskulType>('Semua');
  const jbFileInputRef = useRef<HTMLInputElement | null>(null);

  // Siloka 5-pillar & complaint response state
  const [silokaAdminView, setSilokaAdminView] = useState<'pillars' | 'complaints'>('pillars');
  const [silokaEditId, setSilokaEditId] = useState<string | undefined>(undefined);
  const [silokaTitle, setSilokaTitle] = useState('');
  const [silokaPillar, setSilokaPillar] = useState<SilokaPillar>('Perencanaan');
  const [silokaCoordinator, setSilokaCoordinator] = useState('Neng Linlin Irmawati, S.Pd.');
  const [silokaPeriodDate, setSilokaPeriodDate] = useState('Tahun Ajaran 2026/2027');
  const [silokaTargetGroup, setSilokaTargetGroup] = useState('184 Siswa & 10 GTK');
  const [silokaOutcome, setSilokaOutcome] = useState('');
  const [silokaDesc, setSilokaDesc] = useState('');
  const [silokaStatus, setSilokaStatus] = useState<'terpublikasi' | 'draf'>('terpublikasi');
  const [silokaImage, setSilokaImage] = useState<string>(SCHOOL_IMAGES.hero);
  const [silokaPhotoError, setSilokaPhotoError] = useState('');
  const [silokaUploadingPhoto, setSilokaUploadingPhoto] = useState(false);
  const [silokaFileName, setSilokaFileName] = useState('');
  const [silokaFileUrl, setSilokaFileUrl] = useState('');
  const [silokaFileSize, setSilokaFileSize] = useState('');
  const [silokaFileError, setSilokaFileError] = useState('');
  const [silokaUploadingFile, setSilokaUploadingFile] = useState(false);
  const [silokaSaving, setSilokaSaving] = useState(false);
  const [silokaFilterPillar, setSilokaFilterPillar] = useState<'Semua' | SilokaPillar>('Semua');
  const [confirmDeleteSilokaId, setConfirmDeleteSilokaId] = useState<string | null>(null);
  const silokaPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const silokaFileInputRef = useRef<HTMLInputElement | null>(null);
  const silokaFormRef = useRef<HTMLFormElement | null>(null);
  const [silokaDrafts, setSilokaDrafts] = useState<
    Record<string, { status: SilokaStatus; response: string }>
  >({});

  // Gallery form & upload state (supports both photos and videos)
  const [galEditId, setGalEditId] = useState<string | undefined>(undefined);
  const [galTitle, setGalTitle] = useState('');
  const [galCat, setGalCat] = useState<GalleryCategory>('KBM');
  const [galTakenDate, setGalTakenDate] = useState('November 2026');
  const [galCaption, setGalCaption] = useState('');
  const [galMediaType, setGalMediaType] = useState<GalleryMediaType>('image');
  const [galImage, setGalImage] = useState<string>(SCHOOL_IMAGES.kbm);
  const [galVideoUrl, setGalVideoUrl] = useState('');
  const [galVideoMimeType, setGalVideoMimeType] = useState('');
  const [galVideoFileName, setGalVideoFileName] = useState('');
  const [galVideoChunks, setGalVideoChunks] = useState<string[] | null | undefined>(null);
  const [galVideoPreviewUrl, setGalVideoPreviewUrl] = useState('');
  const [galExistingChunkCount, setGalExistingChunkCount] = useState(0);
  const [galPhotoError, setGalPhotoError] = useState('');
  const [galUploadingPhoto, setGalUploadingPhoto] = useState(false);
  const [galSaving, setGalSaving] = useState(false);
  const [galFilterCat, setGalFilterCat] = useState<'Semua' | GalleryCategory>('Semua');
  const [confirmDeleteGalId, setConfirmDeleteGalId] = useState<string | null>(null);
  const galPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const galFormRef = useRef<HTMLFormElement | null>(null);
  const galLocalBlobRef = useRef<string | null>(null);

  if (!user || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E4E6E1] rounded-xl p-8">
          <h1 className="font-editorial text-2xl font-semibold text-[#18221D]">
            Akses Khusus Administrator SDN Cikawao
          </h1>
          <p className="text-sm text-[#4A5550] mt-2">
            Dashboard Admin hanya dapat dibuka oleh akun resmi Kepala Sekolah (
            {SCHOOL_IDENTITY.principal.email}).
          </p>
        </div>
      </div>
    );
  }

  const notifySaved = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(''), 3500);
  };

  const resetStaffForm = () => {
    setStaffEditId(undefined);
    setStaffFullName('');
    setStaffNip('');
    setStaffCategory('Guru');
    setStaffEmpStatus('PNS');
    setStaffRole('');
    setStaffRank('');
    setStaffRankCustomMode(false);
    setStaffAssignment('');
    setStaffPhotoUrl('');
    setStaffMotto('');
    setStaffPhotoError('');
    if (staffPhotoInputRef.current) {
      staffPhotoInputRef.current.value = '';
    }
    setStaffSortOrder(
      staffMembers.length > 0
        ? Math.max(...staffMembers.map((m) => m.sortOrder)) + 1
        : 1
    );
  };

  const handleStaffPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStaffPhotoError('');
    setStaffUploadingPhoto(true);
    try {
      const compressed = await compressAvatarToDataUrl(file);
      setStaffPhotoUrl(compressed);
    } catch (err) {
      setStaffPhotoError(err instanceof Error ? err.message : 'Gagal memproses foto.');
    } finally {
      setStaffUploadingPhoto(false);
      if (staffPhotoInputRef.current) {
        staffPhotoInputRef.current.value = '';
      }
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffSaving) return;
    const trimmedPhoto = staffPhotoUrl.trim();
    if (trimmedPhoto.length > MAX_PHOTO_URL_LENGTH) {
      setStaffPhotoError('URL atau data foto melebihi batas 80.000 karakter. Gunakan unggah foto atau URL singkat.');
      return;
    }
    setStaffSaving(true);
    try {
      await saveStaffMember(
        {
          fullName: staffFullName.trim(),
          nip: staffNip.trim() || '-',
          category: staffCategory,
          employmentStatus: staffEmpStatus,
          role: staffRole.trim(),
          rank: staffRank.trim(),
          assignment: staffAssignment.trim(),
          photoUrl: trimmedPhoto,
          motto: staffMotto.trim().slice(0, 280),
          sortOrder: Number(staffSortOrder) || staffMembers.length + 1,
        },
        staffEditId
      );
      const actionMsg = staffEditId
        ? `Data GTK "${staffFullName.trim()}" berhasil diperbarui.`
        : `Data GTK "${staffFullName.trim()}" berhasil ditambahkan ke direktori sekolah.`;
      resetStaffForm();
      notifySaved(actionMsg);
    } finally {
      setStaffSaving(false);
    }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveNews(
      {
        title: newsTitle.trim(),
        category: newsCat,
        summary: newsSummary.trim(),
        content: newsContent.trim(),
        imageUrl: newsImage,
        authorName: SCHOOL_IDENTITY.principal.name,
        status: newsStatus,
        publishedDate: new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      },
      newsIdEdit
    );
    setNewsIdEdit(undefined);
    setNewsTitle('');
    setNewsSummary('');
    setNewsContent('');
    notifySaved('Berita sekolah berhasil disimpan.');
  };

  const handleAnnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAnnouncement({
      title: annTitle.trim(),
      message: annMsg.trim(),
      priority: annPriority,
      targetAudience: annAudience,
      isActive: true,
      autoNotifyParents: annAutoNotify,
      authorName: SCHOOL_IDENTITY.principal.name,
    });
    setAnnTitle('');
    setAnnMsg('');
    notifySaved('Pengumuman diterbitkan & notifikasi otomatis dikirim ke orang tua.');
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveStudent(
      {
        nisn: stuNisn.replace(/\D/g, ''),
        nik: stuNik.replace(/\D/g, ''),
        fullName: stuName.trim(),
        rombel: stuRombel,
        gender: stuGender,
        parentName: stuParentName.trim(),
        parentEmail: stuParentEmail.trim(),
        parentUid: '',
        attendancePercent: Number(stuAttendance),
        p5ProjectTitle: stuP5Title.trim(),
        p5Status: stuP5Status,
        mathScore: Number(stuMath),
        indoScore: Number(stuIndo),
        ipasScore: Number(stuIpas),
        pancasilaScore: Number(stuPancasila),
        sundaScore: Number(stuSunda),
        teacherNote: stuNote.trim(),
      },
      stuEditId
    );
    setStuEditId(undefined);
    setStuNisn('');
    setStuNik('');
    setStuName('');
    setStuParentName('');
    setStuParentEmail('');
    setStuNote('');
    notifySaved('Data & direktori NISN siswa berhasil diperbarui real-time.');
  };

  const resetPkksForm = () => {
    setPkksEditId(undefined);
    setPkksCode('PKKS-M.07');
    setPkksComp('Manajerial');
    setPkksTitle('');
    setPkksSummary('');
    setPkksUrl('https://belajar.id');
    setPkksStatus('Lengkap');
    setPkksScore('4');
    setPkksError('');
  };

  const handlePkksSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pkksSaving) return;
    setPkksError('');

    const cleanCode = pkksCode.trim();
    const cleanTitle = pkksTitle.trim();
    const cleanSummary = pkksSummary.trim();
    const cleanUrl = pkksUrl.trim();
    const parsedScore = Number(pkksScore.trim().replace(',', '.'));

    if (cleanCode.length < 2 || cleanCode.length > 24) {
      setPkksError('Kode indikator PKKS harus antara 2 sampai 24 karakter.');
      return;
    }
    if (cleanTitle.length < 5 || cleanTitle.length > 220) {
      setPkksError('Nama indikator kinerja PKKS minimal 5 karakter dan maksimal 220 karakter.');
      return;
    }
    if (cleanSummary.length < 5 || cleanSummary.length > 600) {
      setPkksError('Ringkasan dokumen bukti fisik minimal 5 karakter dan maksimal 600 karakter.');
      return;
    }
    if (cleanUrl.length > 500) {
      setPkksError('Tautan atau keterangan bukti maksimal 500 karakter.');
      return;
    }
    if (!Number.isFinite(parsedScore) || parsedScore < 0 || parsedScore > 4) {
      setPkksError('Skor PKKS harus berupa angka antara 0 sampai 4 (contoh: 3.8 atau 4).');
      return;
    }

    setPkksSaving(true);
    try {
      const wasEditing = Boolean(pkksEditId);
      await savePkksItem(
        {
          code: cleanCode,
          component: pkksComp,
          indicatorTitle: cleanTitle,
          evidenceSummary: cleanSummary,
          evidenceUrl: cleanUrl,
          status: pkksStatus,
          score: parsedScore,
        },
        pkksEditId
      );
      resetPkksForm();
      notifySaved(
        wasEditing
          ? `Perubahan indikator PKKS "${cleanCode}" berhasil disimpan.`
          : `Indikator & bukti PKKS "${cleanCode}" berhasil ditambahkan.`
      );
    } catch (err) {
      const message =
        err instanceof Error && !err.message.startsWith('{')
          ? err.message
          : 'Gagal menyimpan perubahan indikator PKKS ke database. Pastikan Anda login dengan akun Admin resmi dan seluruh kolom valid.';
      setPkksError(message);
    } finally {
      setPkksSaving(false);
    }
  };

  const resetJbForm = () => {
    setJbEditId(undefined);
    setJbTitle('');
    setJbType('Pendidikan Karakter');
    setJbCoach('Neng Linlin Irmawati, S.Pd.');
    setJbDate('23 November 2026');
    setJbCount(184);
    setJbOutcome('');
    setJbDesc('');
    setJbStatus('terverifikasi');
    setJbImage(SCHOOL_IMAGES.ekskul);
    setJbPhotoError('');
    if (jbPhotoInputRef.current) {
      jbPhotoInputRef.current.value = '';
    }
    setJbFileName('');
    setJbFileUrl('');
    setJbFileSize('');
    setJbFileError('');
    if (jbFileInputRef.current) {
      jbFileInputRef.current.value = '';
    }
  };

  const handleJbPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJbPhotoError('');
    setJbUploadingPhoto(true);
    try {
      const compressed = await compressCoverPhotoToDataUrl(file);
      setJbImage(compressed);
    } catch (err) {
      setJbPhotoError(err instanceof Error ? err.message : 'Gagal memproses foto kegiatan.');
    } finally {
      setJbUploadingPhoto(false);
      if (jbPhotoInputRef.current) {
        jbPhotoInputRef.current.value = '';
      }
    }
  };

  const handleJbFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setJbFileError('');
    setJbUploadingFile(true);
    try {
      const res = await readSchoolDocumentAsDataUrl(file);
      setJbFileName(file.name.slice(0, 200));
      setJbFileUrl(res.dataUrl);
      setJbFileSize(res.fileSize);
    } catch (err) {
      setJbFileError(err instanceof Error ? err.message : 'Gagal memproses file.');
    } finally {
      setJbUploadingFile(false);
      if (jbFileInputRef.current) {
        jbFileInputRef.current.value = '';
      }
    }
  };

  const handleJbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhotoUrl = jbImage.trim();
    if (trimmedPhotoUrl.length > MAX_JB_PHOTO_URL_LENGTH) {
      setJbPhotoError('Ukuran foto terlalu besar. Unggah ulang atau gunakan foto bawaan sekolah.');
      return;
    }
    const trimmedFileUrl = jbFileUrl.trim();
    if (trimmedFileUrl.length > MAX_DOC_DATA_URL_LENGTH) {
      setJbFileError('Ukuran file lampiran melebihi batas. Gunakan tautan Google Drive / Belajar.id.');
      return;
    }
    const cleanFileName =
      jbFileName.trim() || (trimmedFileUrl ? 'Dokumen_Program_Jabar_Beraksi' : '');
    const cleanFileSize =
      jbFileSize.trim() || (trimmedFileUrl.startsWith('http') ? 'Tautan Dokumen' : '');

    setJbSaving(true);
    try {
      await saveJabarBeraksi(
        {
          title: jbTitle.trim(),
          ekskulType: jbType,
          coachName: jbCoach.trim(),
          activityDate: jbDate.trim(),
          participantCount: Number(jbCount) || 1,
          characterOutcome: jbOutcome.trim(),
          description: jbDesc.trim(),
          imageUrl: trimmedPhotoUrl || SCHOOL_IMAGES.ekskul,
          fileName: cleanFileName,
          fileUrl: trimmedFileUrl,
          fileSize: cleanFileSize,
          status: jbStatus,
        },
        jbEditId
      );
      const msg = jbEditId
        ? 'Program, foto, dan lampiran file Jabar Beraksi berhasil diperbarui.'
        : 'Program, foto & file Jabar Beraksi berhasil diterbitkan.';
      resetJbForm();
      notifySaved(msg);
    } finally {
      setJbSaving(false);
    }
  };

  const revokeLocalGalBlob = () => {
    if (galLocalBlobRef.current) {
      URL.revokeObjectURL(galLocalBlobRef.current);
      galLocalBlobRef.current = null;
    }
  };

  const resetGalForm = () => {
    revokeLocalGalBlob();
    setGalEditId(undefined);
    setGalTitle('');
    setGalCat('KBM');
    setGalTakenDate('November 2026');
    setGalCaption('');
    setGalMediaType('image');
    setGalImage(SCHOOL_IMAGES.kbm);
    setGalVideoUrl('');
    setGalVideoMimeType('');
    setGalVideoFileName('');
    setGalVideoChunks(null);
    setGalVideoPreviewUrl('');
    setGalExistingChunkCount(0);
    setGalPhotoError('');
    if (galPhotoInputRef.current) {
      galPhotoInputRef.current.value = '';
    }
  };

  const handleGalMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalPhotoError('');
    setGalUploadingPhoto(true);
    try {
      if (isGalleryVideoFile(file)) {
        const [videoRes, posterUrl] = await Promise.all([
          readVideoAsGalleryPayload(file),
          captureVideoPosterDataUrl(file),
        ]);
        revokeLocalGalBlob();
        galLocalBlobRef.current = videoRes.previewObjectUrl;
        setGalMediaType('video');
        setGalVideoUrl(videoRes.inlineDataUrl);
        setGalVideoChunks(videoRes.chunks);
        setGalVideoMimeType(videoRes.mimeType);
        setGalVideoFileName(file.name.slice(0, 200));
        setGalVideoPreviewUrl(videoRes.previewObjectUrl);
        setGalExistingChunkCount(videoRes.chunks ? videoRes.chunks.length : 0);
        if (posterUrl) {
          setGalImage(posterUrl);
        }
      } else if (isGalleryImageFile(file)) {
        const compressed = await compressGalleryPhotoToDataUrl(file);
        revokeLocalGalBlob();
        setGalMediaType('image');
        setGalImage(compressed);
        setGalVideoUrl('');
        setGalVideoMimeType('');
        setGalVideoFileName('');
        setGalVideoChunks(null);
        setGalVideoPreviewUrl('');
        setGalExistingChunkCount(0);
      } else {
        throw new Error(
          'Format file tidak didukung. Pilih foto (JPG, PNG, WebP, GIF) atau video (MP4, WebM, MOV, M4V, OGG).'
        );
      }
    } catch (err) {
      setGalPhotoError(
        err instanceof Error ? err.message : 'Gagal memproses file foto atau video kegiatan.'
      );
    } finally {
      setGalUploadingPhoto(false);
      if (galPhotoInputRef.current) {
        galPhotoInputRef.current.value = '';
      }
    }
  };

  const handleGallerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (galSaving) return;

    const trimmedPhotoUrl = galImage.trim() || SCHOOL_IMAGES.kbm;
    if (trimmedPhotoUrl.length > MAX_JB_PHOTO_URL_LENGTH) {
      setGalPhotoError('Ukuran gambar sampul terlalu besar. Gunakan foto bawaan atau unggah ulang.');
      return;
    }

    if (galMediaType === 'video') {
      const hasInlineOrUrlVideo = Boolean(galVideoUrl.trim());
      const hasNewVideoChunks = Array.isArray(galVideoChunks) && galVideoChunks.length > 0;
      const hasExistingChunks =
        galVideoChunks === undefined && Boolean(galEditId) && galExistingChunkCount > 0;

      if (!hasInlineOrUrlVideo && !hasNewVideoChunks && !hasExistingChunks) {
        setGalPhotoError(
          'Harap unggah file video (MP4, WebM, MOV, M4V, OGG) atau tempel tautan URL video terlebih dahulu.'
        );
        return;
      }
      if (galVideoUrl.trim().length > MAX_GALLERY_VIDEO_INLINE_LEN) {
        setGalPhotoError('Ukuran video inline melebihi batas. Unggah ulang file video.');
        return;
      }
    }

    setGalSaving(true);
    try {
      await saveGalleryItem(
        {
          title: galTitle.trim(),
          category: galCat,
          caption: galCaption.trim(),
          mediaType: galMediaType,
          imageUrl: trimmedPhotoUrl,
          videoUrl: galMediaType === 'video' ? galVideoUrl.trim() : '',
          videoMimeType: galMediaType === 'video' ? galVideoMimeType || 'video/mp4' : '',
          videoFileName:
            galMediaType === 'video' ? galVideoFileName.trim() || 'video-kegiatan' : '',
          videoChunkCount:
            galMediaType === 'video'
              ? Array.isArray(galVideoChunks)
                ? galVideoChunks.length
                : galVideoChunks === undefined
                ? galExistingChunkCount
                : 0
              : 0,
          videoChunks: galMediaType === 'video' ? galVideoChunks : null,
          takenDate: galTakenDate.trim() || 'November 2026',
        },
        galEditId
      );
      const itemLabel = galMediaType === 'video' ? 'Video kegiatan' : 'Foto kegiatan';
      const msg = galEditId
        ? `${itemLabel} "${galTitle.trim()}" di galeri sekolah berhasil diperbarui.`
        : `${itemLabel} "${galTitle.trim()}" berhasil ditambahkan ke galeri sekolah.`;
      resetGalForm();
      notifySaved(msg);
    } finally {
      setGalSaving(false);
    }
  };

  const resetSilokaForm = () => {
    setSilokaEditId(undefined);
    setSilokaTitle('');
    setSilokaPillar('Perencanaan');
    setSilokaCoordinator('Neng Linlin Irmawati, S.Pd.');
    setSilokaPeriodDate('Tahun Ajaran 2026/2027');
    setSilokaTargetGroup('184 Siswa & 10 GTK');
    setSilokaOutcome('');
    setSilokaDesc('');
    setSilokaStatus('terpublikasi');
    setSilokaImage(SCHOOL_IMAGES.hero);
    setSilokaPhotoError('');
    if (silokaPhotoInputRef.current) {
      silokaPhotoInputRef.current.value = '';
    }
    setSilokaFileName('');
    setSilokaFileUrl('');
    setSilokaFileSize('');
    setSilokaFileError('');
    if (silokaFileInputRef.current) {
      silokaFileInputRef.current.value = '';
    }
  };

  const handleSilokaPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSilokaPhotoError('');
    setSilokaUploadingPhoto(true);
    try {
      const compressed = await compressCoverPhotoToDataUrl(file);
      setSilokaImage(compressed);
    } catch (err) {
      setSilokaPhotoError(err instanceof Error ? err.message : 'Gagal memproses foto SILOKA.');
    } finally {
      setSilokaUploadingPhoto(false);
      if (silokaPhotoInputRef.current) {
        silokaPhotoInputRef.current.value = '';
      }
    }
  };

  const handleSilokaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSilokaFileError('');
    setSilokaUploadingFile(true);
    try {
      const res = await readSchoolDocumentAsDataUrl(file);
      setSilokaFileName(file.name.slice(0, 200));
      setSilokaFileUrl(res.dataUrl);
      setSilokaFileSize(res.fileSize);
    } catch (err) {
      setSilokaFileError(err instanceof Error ? err.message : 'Gagal memproses file.');
    } finally {
      setSilokaUploadingFile(false);
      if (silokaFileInputRef.current) {
        silokaFileInputRef.current.value = '';
      }
    }
  };

  const handleSilokaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhotoUrl = silokaImage.trim();
    if (trimmedPhotoUrl.length > MAX_JB_PHOTO_URL_LENGTH) {
      setSilokaPhotoError('Ukuran foto terlalu besar. Unggah ulang atau gunakan foto bawaan sekolah.');
      return;
    }
    const trimmedFileUrl = silokaFileUrl.trim();
    if (trimmedFileUrl.length > MAX_DOC_DATA_URL_LENGTH) {
      setSilokaFileError('Ukuran file lampiran melebihi batas. Gunakan tautan Google Drive / Belajar.id.');
      return;
    }
    const cleanFileName =
      silokaFileName.trim() || (trimmedFileUrl ? 'Dokumen_Program_SILOKA' : '');
    const cleanFileSize =
      silokaFileSize.trim() || (trimmedFileUrl.startsWith('http') ? 'Tautan Dokumen' : '');

    setSilokaSaving(true);
    try {
      await saveSilokaItem(
        {
          title: silokaTitle.trim(),
          pillar: silokaPillar,
          coordinator: silokaCoordinator.trim(),
          periodDate: silokaPeriodDate.trim(),
          targetGroup: silokaTargetGroup.trim(),
          outcome: silokaOutcome.trim(),
          description: silokaDesc.trim(),
          imageUrl: trimmedPhotoUrl || SCHOOL_IMAGES.hero,
          fileName: cleanFileName,
          fileUrl: trimmedFileUrl,
          fileSize: cleanFileSize,
          status: silokaStatus,
        },
        silokaEditId
      );
      const msg = silokaEditId
        ? 'Program & dokumen SILOKA berhasil diperbarui.'
        : 'Program & dokumen SILOKA berhasil ditambahkan.';
      resetSilokaForm();
      notifySaved(msg);
    } finally {
      setSilokaSaving(false);
    }
  };

  const SIDEBAR_ITEMS: Array<{
    id: AdminPanelTab;
    label: string;
    iconName: Icon3DName;
    tone: Icon3DTone;
    activeClass: string;
  }> = [
    {
      id: 'overview',
      label: 'Ringkasan',
      iconName: 'dashboard',
      tone: 'emerald',
      activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md',
    },
    {
      id: 'staff',
      label: 'Guru & Tendik',
      iconName: 'users',
      tone: 'teal',
      activeClass: 'bg-gradient-to-r from-teal-500 to-sky-600 text-white shadow-md',
    },
    {
      id: 'news',
      label: 'Berita Terbaru',
      iconName: 'newspaper',
      tone: 'indigo',
      activeClass: 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md',
    },
    {
      id: 'announcements',
      label: 'Notifikasi Otomatis',
      iconName: 'bell-ring',
      tone: 'rose',
      activeClass: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md',
    },
    {
      id: 'students',
      label: 'Data Siswa Real-Time',
      iconName: 'graduation',
      tone: 'sky',
      activeClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md',
    },
    {
      id: 'pkks',
      label: 'Manajemen PKKS',
      iconName: 'file-check',
      tone: 'emerald',
      activeClass: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md',
    },
    {
      id: 'jabar-beraksi',
      label: 'Jabar Beraksi & File',
      iconName: 'folder-up',
      tone: 'amber',
      activeClass: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md',
    },
    {
      id: 'siloka',
      label: 'Manajemen Siloka',
      iconName: 'siloka',
      tone: 'violet',
      activeClass: 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md',
    },
    {
      id: 'gallery',
      label: 'Galeri Sekolah',
      iconName: 'image',
      tone: 'orange',
      activeClass: 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md',
    },
  ];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar */}
        <aside className="w-full lg:w-68 shrink-0 bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-sky-400 via-amber-400 to-violet-500" />
          <div className="p-4 space-y-4">
            <div className="pb-3 border-b border-emerald-100 flex items-center gap-3">
              <Icon3D name="shield" tone="emerald" size="md" variant="tile" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Admin Kepala Sekolah
                </p>
                <p className="text-sm font-semibold text-[#132A2E] truncate mt-0.5">
                  {SCHOOL_IDENTITY.principal.name}
                </p>
                <p className="text-[11px] font-mono text-sky-700 tabular-nums font-medium">
                  NIP. {SCHOOL_IDENTITY.principal.nip}
                </p>
              </div>
            </div>

            <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {SIDEBAR_ITEMS.map((item) => {
                const active = panel === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPanel(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      active
                        ? item.activeClass
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-sky-50 hover:text-emerald-900'
                    }`}
                  >
                    <Icon3D
                      name={item.iconName}
                      tone={active ? 'white' : item.tone}
                      size="xs"
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Admin Workspace */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {statusFeedback && (
            <div className="flex items-center gap-3 text-xs font-semibold text-emerald-900 bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-2 border-emerald-300 rounded-2xl px-4 py-3 shadow-xs">
              <Icon3D name="check-circle" tone="emerald" size="sm" variant="tile" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {panel === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-emerald-100/80 via-sky-50/75 to-amber-100/75 border-2 border-emerald-300 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <Icon3D name="dashboard" tone="emerald" size="lg" variant="tile" />
                  <div>
                    <h1 className="font-editorial text-2xl font-semibold text-[#132A2E]">
                      Dashboard Tata Kelola SDN Cikawao
                    </h1>
                    <p className="text-xs text-slate-700 mt-1">
                      Kelola berita sekolah, siaran pengumuman otomatis, nilai siswa real-time, berkas PKKS, laporan Jabar Beraksi, dan tiket pengaduan SILOKA.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={seeding}
                  onClick={async () => {
                    await seedAllInitialData();
                    notifySaved('Data awal SDN Cikawao berhasil disinkronkan ke Firestore.');
                  }}
                  className="btn-3d inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  <Icon3D name="database" tone="white" size="xs" />
                  {seeding
                    ? 'Menyinkronkan...'
                    : usingFallbackData
                    ? 'Simpan Data Awal ke Firestore'
                    : 'Reset / Sinkronkan Data Contoh'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <button
                  type="button"
                  onClick={() => setPanel('staff')}
                  className="card-interactive text-left bg-gradient-to-br from-teal-100/90 via-white to-emerald-100/70 border-2 border-teal-300 rounded-2xl p-4 space-y-2"
                >
                  <Icon3D name="users" tone="teal" size="md" variant="tile" />
                  <div>
                    <p className="text-xs font-bold text-teal-900">Guru &amp; Tendik</p>
                    <p className="font-mono text-2xl font-bold text-teal-700 tabular-nums mt-0.5">
                      {staffMembers.length}
                    </p>
                    <p className="text-[11px] text-teal-800/80 mt-0.5 tabular-nums">
                      {guruCount} Guru · {tendikCount} Tendik
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPanel('news')}
                  className="card-interactive text-left bg-gradient-to-br from-sky-100/90 via-white to-indigo-100/70 border-2 border-sky-300 rounded-2xl p-4 space-y-2"
                >
                  <Icon3D name="newspaper" tone="sky" size="md" variant="tile" />
                  <div>
                    <p className="text-xs font-bold text-sky-900">Berita Diterbitkan</p>
                    <p className="font-mono text-2xl font-bold text-sky-700 tabular-nums mt-0.5">
                      {news.length}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPanel('announcements')}
                  className="card-interactive text-left bg-gradient-to-br from-rose-100/85 via-white to-orange-100/70 border-2 border-rose-300 rounded-2xl p-4 space-y-2"
                >
                  <Icon3D name="bell-ring" tone="rose" size="md" variant="tile" />
                  <div>
                    <p className="text-xs font-bold text-rose-900">Orang Tua Berlangganan</p>
                    <p className="font-mono text-2xl font-bold text-rose-700 tabular-nums mt-0.5">
                      {allSubscriptionsCount}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPanel('pkks')}
                  className="card-interactive text-left bg-gradient-to-br from-amber-100/90 via-white to-orange-100/70 border-2 border-amber-300 rounded-2xl p-4 space-y-2"
                >
                  <Icon3D name="file-check" tone="amber" size="md" variant="tile" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">Indikator PKKS</p>
                    <p className="font-mono text-2xl font-bold text-amber-700 tabular-nums mt-0.5">
                      {pkksItems.length}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPanel('siloka')}
                  className="card-interactive text-left bg-gradient-to-br from-violet-100/90 via-white to-indigo-100/70 border-2 border-violet-300 rounded-2xl p-4 space-y-2"
                >
                  <Icon3D name="siloka" tone="violet" size="md" variant="tile" />
                  <div>
                    <p className="text-xs font-bold text-violet-900">Program Siloka</p>
                    <p className="font-mono text-2xl font-bold text-violet-700 tabular-nums mt-0.5">
                      {silokaItems.length}
                    </p>
                    <p className="text-[11px] text-violet-800/80 mt-0.5 tabular-nums">
                      5 Pilar · {silokaComplaints.length} Aduan
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Panel: Guru & Tenaga Kependidikan (GTK) */}
          {panel === 'staff' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-interactive bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-emerald-800">Total GTK Terdaftar</p>
                  <p className="font-mono text-2xl font-bold text-emerald-700 tabular-nums mt-1">
                    {staffMembers.length}
                  </p>
                </div>
                <div className="card-interactive bg-sky-50/90 border border-sky-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-sky-800">Tenaga Pendidik (Guru)</p>
                  <p className="font-mono text-2xl font-bold text-sky-700 tabular-nums mt-1">
                    {guruCount}
                  </p>
                </div>
                <div className="card-interactive bg-amber-50/90 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-amber-800">Tenaga Kependidikan</p>
                  <p className="font-mono text-2xl font-bold text-amber-700 tabular-nums mt-1">
                    {tendikCount}
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleStaffSubmit}
                className="bg-white border border-sky-200 rounded-2xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-editorial text-xl font-semibold text-[#132A2E]">
                      {staffEditId
                        ? 'Sunting Data Guru / Tenaga Kependidikan'
                        : 'Tambah Data Guru atau Tenaga Kependidikan'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Perubahan langsung tersimpan ke Firestore dan tampil otomatis di direktori publik profil SDN Cikawao.
                    </p>
                  </div>
                  {staffEditId && (
                    <button
                      type="button"
                      onClick={resetStaffForm}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Icon3D name="close" tone="rose" size="xs" />
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Lengkap &amp; Gelar
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={120}
                      value={staffFullName}
                      onChange={(e) => setStaffFullName(e.target.value)}
                      placeholder="Contoh: Asep Suryana, S.Pd."
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-sky-500 focus:outline-none rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kategori GTK
                    </label>
                    <select
                      value={staffCategory}
                      onChange={(e) => setStaffCategory(e.target.value as StaffCategory)}
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-sky-500 focus:outline-none rounded-xl"
                    >
                      <option value="Guru">Guru</option>
                      <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Status
                    </label>
                    <select
                      value={staffEmpStatus}
                      onChange={(e) => {
                        const nextStatus = e.target.value as EmploymentStatus;
                        setStaffEmpStatus(nextStatus);
                        if (!GTK_RANK_OPTIONS[nextStatus].includes(staffRank)) {
                          setStaffRank('');
                          setStaffRankCustomMode(false);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-sky-500 focus:outline-none rounded-xl"
                    >
                      {GTK_EMPLOYMENT_STATUSES.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      No. Urut
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      required
                      value={staffSortOrder}
                      onChange={(e) => setStaffSortOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FFFDF7] border border-slate-200 focus:border-sky-500 focus:outline-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      NIP / NUPTK
                    </label>
                    <input
                      type="text"
                      maxLength={30}
                      value={staffNip}
                      onChange={(e) => setStaffNip(e.target.value)}
                      placeholder="Contoh: 198603272010012011 atau -"
                      className="w-full px-3 py-2 text-sm font-mono bg-[#FFFDF7] border border-slate-200 focus:border-sky-500 focus:outline-none rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={120}
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      placeholder="Contoh: Guru Kelas IV / Operator Sekolah"
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-sky-500 focus:outline-none rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pangkat / Golongan
                    </label>
                    {(() => {
                      const rankPresets = GTK_RANK_OPTIONS[staffEmpStatus];
                      const rankMatchesPreset = Boolean(
                        staffRank && rankPresets.includes(staffRank)
                      );
                      const showCustomInput =
                        staffRankCustomMode || Boolean(staffRank && !rankMatchesPreset);

                      return (
                        <div className="space-y-2">
                          <select
                            value={showCustomInput ? '__custom__' : staffRank}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '__custom__') {
                                setStaffRankCustomMode(true);
                                if (rankMatchesPreset) {
                                  setStaffRank('');
                                }
                              } else {
                                setStaffRankCustomMode(false);
                                setStaffRank(val);
                              }
                            }}
                            className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-sky-500 focus:outline-none rounded-xl"
                          >
                            <option value="">
                              Pilih pangkat / golongan ({staffEmpStatus})...
                            </option>
                            {rankPresets.map((rankOption) => (
                              <option key={rankOption} value={rankOption}>
                                {rankOption}
                              </option>
                            ))}
                            <option value="__custom__">Lainnya (Ketik Manual)...</option>
                          </select>
                          {showCustomInput && (
                            <input
                              type="text"
                              maxLength={80}
                              value={staffRank}
                              onChange={(e) => setStaffRank(e.target.value)}
                              placeholder="Ketik pangkat / golongan atau keterangan..."
                              className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-sky-300 focus:border-sky-500 focus:outline-none rounded-xl"
                            />
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tugas Tambahan &amp; Pembinaan
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={staffAssignment}
                    onChange={(e) => setStaffAssignment(e.target.value)}
                    placeholder="Contoh: Wali Kelas 4 · Pembina Pramuka / Pengelola Dapodik & ARKAS"
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-sky-500 focus:outline-none rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                  <div className="lg:col-span-6 p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-white border border-sky-200 flex items-center justify-center shadow-xs">
                        {staffPhotoUrl ? (
                          <img
                            src={staffPhotoUrl}
                            alt={staffFullName || 'Pratinjau foto GTK'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-editorial text-lg font-bold text-sky-700">
                            {getStaffInitials(staffFullName || 'GTK')}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Foto Guru / Tenaga Kependidikan
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={staffPhotoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleStaffPhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={staffUploadingPhoto}
                            onClick={() => staffPhotoInputRef.current?.click()}
                            className="btn-3d inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg whitespace-nowrap shrink-0 disabled:opacity-60"
                          >
                            <Icon3D name="upload" tone="white" size="xs" />
                            {staffUploadingPhoto ? 'Memproses...' : 'Unggah Foto'}
                          </button>
                          {staffPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setStaffPhotoUrl('');
                                setStaffPhotoError('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                            >
                              <Icon3D name="close" tone="rose" size="xs" />
                              Hapus Foto
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Foto otomatis disesuaikan ke rasio 1:1 atau pilih potret bawaan di bawah.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={
                          GTK_PORTRAIT_PRESETS.some((p) => p.url === staffPhotoUrl)
                            ? staffPhotoUrl
                            : ''
                        }
                        onChange={(e) => {
                          setStaffPhotoUrl(e.target.value);
                          setStaffPhotoError('');
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg"
                      >
                        <option value="">Pilih potret bawaan sekolah...</option>
                        {GTK_PORTRAIT_PRESETS.map((preset) => (
                          <option key={preset.url} value={preset.url}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={staffPhotoUrl.startsWith('data:') ? '' : staffPhotoUrl}
                        onChange={(e) => {
                          setStaffPhotoUrl(e.target.value);
                          setStaffPhotoError('');
                        }}
                        placeholder={
                          staffPhotoUrl.startsWith('data:')
                            ? 'Foto hasil unggahan aktif'
                            : 'Atau tempel URL foto (https://...)'
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 focus:border-sky-500 focus:outline-none rounded-lg"
                      />
                    </div>

                    {staffPhotoError && (
                      <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                        {staffPhotoError}
                      </p>
                    )}
                  </div>

                  <div className="lg:col-span-6 p-4 rounded-xl bg-amber-50/50 border border-amber-200 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                          <Icon3D name="quote" tone="amber" size="xs" />
                          Kata-kata Mutiara / Motto Pendidik
                        </label>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500">
                          {staffMotto.length}/280
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={280}
                        value={staffMotto}
                        onChange={(e) => setStaffMotto(e.target.value)}
                        placeholder="Contoh: Mendidik dengan keteladanan, menumbuhkan rasa ingin tahu, dan menyalakan semangat belajar setiap anak."
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl resize-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Ditampilkan bersama potret guru/tendik di halaman Beranda dan Profil Sekolah.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={staffSaving}
                    className="btn-3d inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl whitespace-nowrap shrink-0 disabled:opacity-60"
                  >
                    <Icon3D name={staffEditId ? 'check' : 'plus'} tone="white" size="xs" />
                    {staffSaving
                      ? 'Menyimpan...'
                      : staffEditId
                      ? 'Perbarui Data GTK'
                      : 'Tambahkan Data GTK'}
                  </button>
                  {staffEditId && (
                    <button
                      type="button"
                      onClick={resetStaffForm}
                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="bg-white border border-sky-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#132A2E] tabular-nums">
                      Daftar Guru &amp; Tenaga Kependidikan ({filteredStaff.length} dari{' '}
                      {staffMembers.length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Klik Edit untuk memperbarui data atau Hapus untuk menghapus dari direktori sekolah.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1 p-1 bg-sky-50 border border-sky-200 rounded-xl">
                      {(['Semua', 'Guru', 'Tenaga Kependidikan'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setStaffCatFilter(cat)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                            staffCatFilter === cat
                              ? 'bg-sky-600 text-white shadow-sm'
                              : 'text-sky-800 hover:bg-sky-100'
                          }`}
                        >
                          {cat === 'Tenaga Kependidikan' ? 'Tendik' : cat}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                        <Icon3D name="search" tone="sky" size="xs" />
                      </span>
                      <input
                        type="text"
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        placeholder="Cari nama / NIP / jabatan..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-[#FFFDF7] border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

                {filteredStaff.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Tidak ada data Guru atau Tenaga Kependidikan yang sesuai filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-sky-200 bg-sky-50/70 text-sky-900">
                          <th className="py-3 px-4 font-semibold">No</th>
                          <th className="py-3 px-4 font-semibold">Nama &amp; Pangkat</th>
                          <th className="py-3 px-4 font-semibold">Kategori &amp; Status</th>
                          <th className="py-3 px-4 font-semibold">Jabatan</th>
                          <th className="py-3 px-4 font-semibold">Tugas &amp; Pembinaan</th>
                          <th className="py-3 px-4 font-semibold">NIP / NUPTK</th>
                          <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredStaff.map((member) => (
                          <tr
                            key={member.id}
                            className={`transition-colors ${
                              staffEditId === member.id
                                ? 'bg-amber-50/70'
                                : 'hover:bg-sky-50/40'
                            }`}
                          >
                            <td className="py-3 px-4 font-mono tabular-nums font-semibold text-sky-700">
                              {String(member.sortOrder).padStart(2, '0')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-sky-100 border border-sky-200 flex items-center justify-center">
                                  {member.photoUrl ? (
                                    <img
                                      src={member.photoUrl}
                                      alt={member.fullName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-sky-700">
                                      {getStaffInitials(member.fullName)}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#132A2E]">{member.fullName}</p>
                                  {member.rank && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">{member.rank}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`font-semibold ${
                                  member.category === 'Guru'
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {member.category === 'Tenaga Kependidikan' ? 'Tendik' : 'Guru'}
                              </span>
                              <span className="text-slate-400 mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              <span className="font-mono text-[11px] text-slate-600">
                                {member.employmentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-700 font-medium">{member.role}</td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs">
                              <p>{member.assignment || '-'}</p>
                              {member.motto && (
                                <p className="text-[11px] italic text-emerald-800/90 mt-1 line-clamp-2">
                                  “{member.motto}”
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                              {member.nip || '-'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {confirmDeleteStaffId === member.id ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await removeStaffMember(member.id);
                                      if (staffEditId === member.id) resetStaffForm();
                                      setConfirmDeleteStaffId(null);
                                      notifySaved(
                                        `Data GTK "${member.fullName}" berhasil dihapus.`
                                      );
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                  >
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteStaffId(null)}
                                    className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const isPresetRank =
                                        !member.rank ||
                                        GTK_RANK_OPTIONS[member.employmentStatus].includes(
                                          member.rank
                                        );
                                      setStaffEditId(member.id);
                                      setStaffFullName(member.fullName);
                                      setStaffNip(member.nip === '-' ? '' : member.nip);
                                      setStaffCategory(member.category);
                                      setStaffEmpStatus(member.employmentStatus);
                                      setStaffRole(member.role);
                                      setStaffRank(member.rank);
                                      setStaffRankCustomMode(!isPresetRank);
                                      setStaffAssignment(member.assignment);
                                      setStaffPhotoUrl(member.photoUrl || '');
                                      setStaffMotto(member.motto || '');
                                      setStaffPhotoError('');
                                      setStaffSortOrder(member.sortOrder);
                                      setConfirmDeleteStaffId(null);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                                  >
                                    <Icon3D name="pencil" tone="sky" size="xs" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteStaffId(member.id)}
                                    aria-label={`Hapus ${member.fullName}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Icon3D name="trash" tone="rose" size="xs" />
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Panel: News Management */}
          {panel === 'news' && (
            <div className="space-y-6">
              <form
                onSubmit={handleNewsSubmit}
                className="bg-white border-2 border-indigo-200 rounded-2xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Icon3D name="newspaper" tone="indigo" size="md" variant="tile" />
                  <h2 className="font-editorial text-xl font-semibold text-[#132A2E]">
                    {newsIdEdit ? 'Sunting Berita Sekolah' : 'Terbitkan Berita Terbaru'}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={160}
                    value={newsTitle}
                    onChange={(e) => setNewsTitle(e.target.value)}
                    placeholder="Judul berita..."
                    className="px-3 py-2 text-sm bg-[#FFFDF7] border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-xl"
                  />
                  <select
                    value={newsCat}
                    onChange={(e) => setNewsCat(e.target.value as NewsCategory)}
                    className="px-3 py-2 text-sm bg-[#FFFDF7] border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-xl"
                  >
                    <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Prestasi">Prestasi</option>
                    <option value="Kegiatan">Kegiatan</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={newsImage}
                    onChange={(e) => setNewsImage(e.target.value)}
                    className="px-3 py-2 text-sm bg-[#FFFDF7] border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-xl"
                  >
                    {IMAGE_PRESETS.map((p) => (
                      <option key={p.url} value={p.url}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newsStatus}
                    onChange={(e) => setNewsStatus(e.target.value as NewsStatus)}
                    className="px-3 py-2 text-sm bg-[#FFFDF7] border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-xl"
                  >
                    <option value="published">Terbitkan Langsung (Published)</option>
                    <option value="draft">Simpan Draf</option>
                  </select>
                </div>
                <input
                  type="text"
                  required
                  minLength={10}
                  maxLength={360}
                  value={newsSummary}
                  onChange={(e) => setNewsSummary(e.target.value)}
                  placeholder="Ringkasan singkat berita (1–2 kalimat)..."
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-xl"
                />
                <textarea
                  required
                  minLength={20}
                  maxLength={8000}
                  rows={4}
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  placeholder="Isi berita lengkap..."
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-indigo-200 focus:border-indigo-500 focus:outline-none rounded-xl"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="btn-3d inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl"
                  >
                    <Icon3D name={newsIdEdit ? 'check' : 'plus'} tone="white" size="xs" />
                    {newsIdEdit ? 'Simpan Perubahan' : 'Terbitkan Berita'}
                  </button>
                  {newsIdEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewsIdEdit(undefined);
                        setNewsTitle('');
                        setNewsSummary('');
                        setNewsContent('');
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Batal Sunting
                    </button>
                  )}
                </div>
              </form>

              <div className="bg-white border-2 border-indigo-200 rounded-2xl divide-y divide-slate-200 overflow-hidden shadow-xs">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/35 transition-colors"
                  >
                    <div>
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-indigo-700">{item.category}</span> ·{' '}
                        {item.publishedDate} ·{' '}
                        <span className="font-semibold text-emerald-700">{item.status}</span>
                      </p>
                      <h3 className="text-sm font-semibold text-[#132A2E] mt-0.5">{item.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setNewsIdEdit(item.id);
                          setNewsTitle(item.title);
                          setNewsCat(item.category);
                          setNewsSummary(item.summary);
                          setNewsContent(item.content);
                          setNewsImage(item.imageUrl);
                          setNewsStatus(item.status);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                      >
                        <Icon3D name="pencil" tone="sky" size="xs" />
                        Sunting
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeNews(item.id)}
                        aria-label={`Hapus ${item.title}`}
                        className="p-1.5 text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Icon3D name="trash" tone="rose" size="xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel: Auto Announcements */}
          {panel === 'announcements' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAnnSubmit}
                className="bg-white border-2 border-rose-200 rounded-2xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Icon3D name="bell-ring" tone="rose" size="md" variant="tile" />
                  <h2 className="font-editorial text-xl font-semibold text-[#132A2E]">
                    Kirim Pengumuman &amp; Notifikasi Otomatis Orang Tua
                  </h2>
                </div>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={160}
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Judul pengumuman penting..."
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-rose-200 focus:border-rose-500 focus:outline-none rounded-xl"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value as AnnouncementPriority)}
                    className="px-3 py-2 text-sm bg-[#FFFDF7] border border-rose-200 focus:border-rose-500 focus:outline-none rounded-xl"
                  >
                    <option value="mendesak">Prioritas: Mendesak</option>
                    <option value="penting">Prioritas: Penting</option>
                    <option value="info">Prioritas: Informasi</option>
                  </select>
                  <select
                    value={annAudience}
                    onChange={(e) => setAnnAudience(e.target.value as TargetAudience)}
                    className="px-3 py-2 text-sm bg-[#FFFDF7] border border-rose-200 focus:border-rose-500 focus:outline-none rounded-xl"
                  >
                    <option value="Semua Orang Tua">Semua Orang Tua</option>
                    <option value="Fase A (Kelas 1-2)">Fase A (Kelas 1-2)</option>
                    <option value="Fase B (Kelas 3-4)">Fase B (Kelas 3-4)</option>
                    <option value="Fase C (Kelas 5-6)">Fase C (Kelas 5-6)</option>
                  </select>
                </div>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={3}
                  value={annMsg}
                  onChange={(e) => setAnnMsg(e.target.value)}
                  placeholder="Isi pesan pengumuman untuk seluruh orang tua murid..."
                  className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-rose-200 focus:border-rose-500 focus:outline-none rounded-xl"
                />
                <label className="flex items-center gap-2 text-xs text-[#132A2E]">
                  <input
                    type="checkbox"
                    checked={annAutoNotify}
                    onChange={(e) => setAnnAutoNotify(e.target.checked)}
                    className="accent-rose-600 w-4 h-4"
                  />
                  <span>Kirim siaran notifikasi otomatis real-time ke seluruh orang tua</span>
                </label>
                <button
                  type="submit"
                  className="btn-3d inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-orange-500 rounded-xl"
                >
                  <Icon3D name="bell-ring" tone="white" size="xs" />
                  Siarkan Pengumuman Sekarang
                </button>
              </form>

              <div className="bg-white border-2 border-rose-200 rounded-2xl divide-y divide-slate-200 overflow-hidden shadow-xs">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 flex items-start justify-between gap-4 hover:bg-rose-50/35 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-rose-700">
                        {ann.priority.toUpperCase()} · <span className="text-slate-600 font-medium">{ann.targetAudience}</span>
                      </p>
                      <h3 className="text-sm font-semibold text-[#132A2E] mt-0.5">{ann.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">{ann.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeAnnouncement(ann.id)}
                      className="p-1.5 text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-lg shrink-0 transition-colors"
                    >
                      <Icon3D name="trash" tone="rose" size="xs" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Panel: Students & Link Requests */}
          {panel === 'students' && (
            <div className="space-y-6">
              {linkRequests.filter((r) => r.status === 'pending').length > 0 && (
                <div className="bg-white border border-[#E4E6E1] rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-[#18221D]">
                    Permohonan Penautan Akun Orang Tua
                  </h2>
                  {linkRequests
                    .filter((r) => r.status === 'pending')
                    .map((req) => (
                      <div
                        key={req.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-2 border-t border-[#E4E6E1] text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#18221D]">{req.requesterName}</span> (
                          {req.requesterEmail}) meminta akses siswa{' '}
                          <span className="font-semibold">{req.studentName}</span> · NISN{' '}
                          <span className="font-mono">{req.nisn}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void resolveStudentLinkRequest(req, 'approved')}
                            className="px-3 py-1 bg-[#166534] text-white rounded-md font-semibold"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => void resolveStudentLinkRequest(req, 'rejected')}
                            className="px-3 py-1 bg-red-50 text-red-700 rounded-md font-semibold"
                          >
                            Tolak
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Import Excel (File Daftar PD) */}
              <div className="bg-white border-2 border-sky-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <Icon3D name="spreadsheet" tone="emerald" size="sm" variant="tile" />
                      <span>Import Masal Excel Dapodik / Sekolah</span>
                    </div>
                    <h2 className="font-editorial text-xl font-semibold text-[#132A2E] mt-1.5">
                      Impor Data Peserta Didik (File Daftar PD)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Unggah file <span className="font-mono">.xlsx</span>,{' '}
                      <span className="font-mono">.xls</span>, atau{' '}
                      <span className="font-mono">.csv</span> hasil unduhan Daftar PD Dapodik maupun template SDN Cikawao. Sistem otomatis mengenali kolom Nama, NISN, NIK, JK, Rombel Saat Ini, Nama Wali, dan nilai jika tersedia.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadDaftarPdTemplate}
                    className="btn-3d inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-sky-800 bg-sky-50 border-2 border-sky-200 rounded-xl hover:bg-sky-100 whitespace-nowrap shrink-0 self-start"
                  >
                    <Icon3D name="download" tone="sky" size="xs" />
                    Unduh Template Daftar PD (.xlsx)
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setExcelFileName(file.name);
                      setExcelParseError('');
                      setExcelParseResult(null);
                      try {
                        const result = await parseDaftarPdExcel(file);
                        setExcelParseResult(result);
                      } catch (err) {
                        setExcelParseError(
                          err instanceof Error ? err.message : 'Gagal membaca file Excel.'
                        );
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => excelInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#132A2E] bg-gradient-to-r from-emerald-50 to-sky-50 border-2 border-dashed border-emerald-400 rounded-xl hover:from-emerald-100 hover:to-sky-100 transition-colors"
                  >
                    <Icon3D name="upload" tone="emerald" size="sm" />
                    <span>{excelFileName ? `File dipilih: ${excelFileName}` : 'Pilih File Excel Daftar PD (.xlsx / .xls)'}</span>
                  </button>

                  {excelParseResult && excelParseResult.validCount > 0 && (
                    <button
                      type="button"
                      disabled={importingExcel}
                      onClick={async () => {
                        setImportingExcel(true);
                        try {
                          const res = await importStudentsBulk(excelParseResult.rows);
                          notifySaved(
                            `Impor Daftar PD berhasil: ${res.created} siswa baru ditambahkan, ${res.updated} siswa diperbarui.`
                          );
                          setExcelParseResult(null);
                          setExcelFileName('');
                          if (excelInputRef.current) excelInputRef.current.value = '';
                        } finally {
                          setImportingExcel(false);
                        }
                      }}
                      className="btn-3d inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl whitespace-nowrap shrink-0 disabled:opacity-60"
                    >
                      <Icon3D name="check" tone="white" size="xs" />
                      {importingExcel
                        ? 'Mengimpor ke Database...'
                        : `Impor ${excelParseResult.validCount} Data Siswa`}
                    </button>
                  )}

                  {excelParseResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setExcelParseResult(null);
                        setExcelFileName('');
                        setExcelParseError('');
                        if (excelInputRef.current) excelInputRef.current.value = '';
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2"
                    >
                      Batalkan
                    </button>
                  )}
                </div>

                {excelParseError && (
                  <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <Icon3D name="alert" tone="rose" size="xs" className="mt-0.5" />
                    <span>{excelParseError}</span>
                  </div>
                )}

                {excelParseResult && (
                  <div className="space-y-3 pt-2 border-t border-[#E4E6E1]">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4A5550]">
                      <span>
                        Sheet: <strong className="text-[#18221D]">{excelParseResult.sheetName}</strong>
                      </span>
                      <div className="flex items-center gap-4 font-mono tabular-nums">
                        <span className="text-[#166534] font-semibold">
                          Siap Impor: {excelParseResult.validCount}
                        </span>
                        {excelParseResult.invalidCount > 0 && (
                          <span className="text-amber-700 font-semibold">
                            Dilewati (Tidak Valid): {excelParseResult.invalidCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-[#E4E6E1] rounded-lg">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-[#FAF9F6] border-b border-[#E4E6E1] text-[#4A5550]">
                          <tr>
                            <th className="py-2 px-3 font-medium">Baris</th>
                            <th className="py-2 px-3 font-medium">NISN</th>
                            <th className="py-2 px-3 font-medium">NIK</th>
                            <th className="py-2 px-3 font-medium">Nama Peserta Didik</th>
                            <th className="py-2 px-3 font-medium">JK</th>
                            <th className="py-2 px-3 font-medium">Rombel</th>
                            <th className="py-2 px-3 font-medium">Orang Tua / Wali</th>
                            <th className="py-2 px-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4E6E1]">
                          {excelParseResult.rows.slice(0, 200).map((row) => (
                            <tr
                              key={`${row.rowNumber}-${row.nisn}`}
                              className={row.isValid ? 'bg-white' : 'bg-amber-50/60'}
                            >
                              <td className="py-2 px-3 font-mono tabular-nums text-[#4A5550]">
                                {row.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums text-[#18221D]">
                                {row.nisn || '-'}
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums text-[#4A5550]">
                                {row.nik || '-'}
                              </td>
                              <td className="py-2 px-3 font-medium text-[#18221D]">
                                {row.fullName || '-'}
                              </td>
                              <td className="py-2 px-3">{row.gender}</td>
                              <td className="py-2 px-3">{row.rombel}</td>
                              <td className="py-2 px-3 text-[#4A5550]">
                                {row.parentName || '-'}
                              </td>
                              <td className="py-2 px-3">
                                {row.isValid ? (
                                  <span className="font-semibold text-[#166534]">Siap Impor</span>
                                ) : (
                                  <span className="font-semibold text-amber-700">
                                    {row.errorReason}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleStudentSubmit}
                className="bg-white border border-[#E4E6E1] rounded-xl p-6 space-y-4"
              >
                <h2 className="font-editorial text-xl font-semibold text-[#18221D]">
                  {stuEditId ? 'Perbarui Data, NIK & Nilai Siswa' : 'Tambah Data & NISN Siswa'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <input
                    type="text"
                    required
                    minLength={6}
                    maxLength={20}
                    value={stuNisn}
                    onChange={(e) => setStuNisn(e.target.value.replace(/\D/g, ''))}
                    placeholder="NISN (Angka)"
                    className="px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  />
                  <input
                    type="text"
                    maxLength={20}
                    value={stuNik}
                    onChange={(e) => setStuNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="NIK 16 Digit (opsional)"
                    className="px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  />
                  <input
                    type="text"
                    required
                    value={stuName}
                    onChange={(e) => setStuName(e.target.value)}
                    placeholder="Nama Lengkap Siswa"
                    className="sm:col-span-2 px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  />
                  <select
                    value={stuRombel}
                    onChange={(e) => setStuRombel(e.target.value as RombelName)}
                    className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  >
                    {(['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'] as const).map(
                      (r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={stuParentName}
                    onChange={(e) => setStuParentName(e.target.value)}
                    placeholder="Nama Wali Murid"
                    className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  />
                  <input
                    type="email"
                    value={stuParentEmail}
                    onChange={(e) => setStuParentEmail(e.target.value)}
                    placeholder="Email Google Wali Murid (opsional)"
                    className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  />
                  <select
                    value={stuGender}
                    onChange={(e) => setStuGender(e.target.value as 'L' | 'P')}
                    className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {[
                    { label: 'Hadir (%)', val: stuAttendance, set: setStuAttendance },
                    { label: 'MTK', val: stuMath, set: setStuMath },
                    { label: 'B. Indo', val: stuIndo, set: setStuIndo },
                    { label: 'IPAS', val: stuIpas, set: setStuIpas },
                    { label: 'Pancasila', val: stuPancasila, set: setStuPancasila },
                    { label: 'B. Sunda', val: stuSunda, set: setStuSunda },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-[11px] font-medium text-[#4A5550] mb-1">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={field.val}
                        onChange={(e) => field.set(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm font-mono bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={stuP5Title}
                    onChange={(e) => setStuP5Title(e.target.value)}
                    placeholder="Judul Proyek P5"
                    className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  />
                  <select
                    value={stuP5Status}
                    onChange={(e) => setStuP5Status(e.target.value as P5Status)}
                    className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                  >
                    <option value="Sangat Berkembang">Sangat Berkembang</option>
                    <option value="Berkembang Sesuai Harapan">Berkembang Sesuai Harapan</option>
                    <option value="Mulai Berkembang">Mulai Berkembang</option>
                  </select>
                </div>

                <input
                  type="text"
                  value={stuNote}
                  onChange={(e) => setStuNote(e.target.value)}
                  placeholder="Catatan perkembangan dari Wali Kelas..."
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                />

                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#166534] rounded-lg hover:bg-[#14532D]"
                >
                  {stuEditId ? 'Simpan Nilai Siswa' : 'Tambahkan Data Siswa'}
                </button>
              </form>

              <div className="bg-white border border-[#E4E6E1] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#E4E6E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-[#18221D] tabular-nums">
                    Daftar Siswa Terdaftar ({filteredStudents.length} dari {students.length})
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                        <Icon3D name="search" tone="sky" size="xs" />
                      </span>
                      <input
                        type="text"
                        value={stuSearch}
                        onChange={(e) => setStuSearch(e.target.value)}
                        placeholder="Cari nama / NISN / NIK..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-[#FFFDF7] border border-sky-200 rounded-xl focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <select
                      value={stuFilterRombel}
                      onChange={(e) => setStuFilterRombel(e.target.value as 'Semua' | RombelName)}
                      className="px-2.5 py-1.5 text-xs bg-[#FAF9F6] border border-[#E4E6E1] rounded-lg"
                    >
                      <option value="Semua">Semua Rombel</option>
                      {(['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'] as const).map(
                        (r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E4E6E1] bg-[#FAF9F6] text-[#4A5550]">
                      <th className="py-3 px-4 font-medium">NISN</th>
                      <th className="py-3 px-4 font-medium">NIK</th>
                      <th className="py-3 px-4 font-medium">Nama Siswa</th>
                      <th className="py-3 px-4 font-medium">Rombel</th>
                      <th className="py-3 px-4 font-medium text-right">Hadir</th>
                      <th className="py-3 px-4 font-medium text-right">MTK</th>
                      <th className="py-3 px-4 font-medium text-right">B.Indo</th>
                      <th className="py-3 px-4 font-medium text-right">IPAS</th>
                      <th className="py-3 px-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E6E1]">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-[#FAF9F6]">
                        <td className="py-3 px-4 font-mono tabular-nums">{s.nisn}</td>
                        <td className="py-3 px-4 font-mono tabular-nums text-[#4A5550]">
                          {s.nik || '-'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#18221D]">{s.fullName}</td>
                        <td className="py-3 px-4">{s.rombel}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {s.attendancePercent}%
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{s.mathScore}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{s.indoScore}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{s.ipasScore}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setStuEditId(s.id);
                              setStuNisn(s.nisn);
                              setStuNik(s.nik || '');
                              setStuName(s.fullName);
                              setStuRombel(s.rombel);
                              setStuGender(s.gender);
                              setStuParentName(s.parentName);
                              setStuParentEmail(s.parentEmail);
                              setStuAttendance(s.attendancePercent);
                              setStuP5Title(s.p5ProjectTitle);
                              setStuP5Status(s.p5Status);
                              setStuMath(s.mathScore);
                              setStuIndo(s.indoScore);
                              setStuIpas(s.ipasScore);
                              setStuPancasila(s.pancasilaScore);
                              setStuSunda(s.sundaScore);
                              setStuNote(s.teacherNote);
                            }}
                            className="font-semibold text-[#166534] hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeStudent(s.id)}
                            className="font-semibold text-red-700 hover:underline"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* Panel: PKKS */}
          {panel === 'pkks' && (
            <div className="space-y-6">
              <form
                ref={pkksFormRef}
                onSubmit={handlePkksSubmit}
                className="bg-white border-2 border-emerald-200 rounded-2xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-editorial text-xl font-semibold text-[#18221D]">
                      {pkksEditId ? `Sunting Indikator PKKS (${pkksCode})` : 'Tambah Indikator & Bukti PKKS'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Perubahan indikator, status berkas, tautan dokumen, dan skor langsung tersinkronisasi ke halaman publik PKKS.
                    </p>
                  </div>
                  {pkksEditId && (
                    <button
                      type="button"
                      onClick={resetPkksForm}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Icon3D name="close" tone="rose" size="xs" />
                      Batal Edit
                    </button>
                  )}
                </div>

                {pkksError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5"
                  >
                    <Icon3D name="alert" tone="rose" size="xs" />
                    <span>{pkksError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kode Indikator
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={24}
                      value={pkksCode}
                      onChange={(e) => setPkksCode(e.target.value)}
                      placeholder="Kode (mis. PKKS-M.07)"
                      className="w-full px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#E4E6E1] focus:border-emerald-500 focus:outline-none rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Komponen PKKS
                    </label>
                    <select
                      value={pkksComp}
                      onChange={(e) => setPkksComp(e.target.value as PkksComponent)}
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] focus:border-emerald-500 focus:outline-none rounded-lg"
                    >
                      <option value="Manajerial">Manajerial</option>
                      <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                      <option value="Supervisi">Supervisi</option>
                      <option value="Kewirausahaan">Kewirausahaan</option>
                      <option value="Pengembangan Diri">Pengembangan Diri</option>
                      <option value="Kemitraan">Kemitraan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Status Kelengkapan Berkas
                    </label>
                    <select
                      value={pkksStatus}
                      onChange={(e) => setPkksStatus(e.target.value as PkksStatus)}
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] focus:border-emerald-500 focus:outline-none rounded-lg"
                    >
                      <option value="Lengkap">Lengkap</option>
                      <option value="Dalam Proses">Dalam Proses</option>
                      <option value="Perlu Dilengkapi">Perlu Dilengkapi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nama Indikator Kinerja PKKS (minimal 5 karakter)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={220}
                    value={pkksTitle}
                    onChange={(e) => setPkksTitle(e.target.value)}
                    placeholder="Nama indikator kinerja PKKS..."
                    className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] focus:border-emerald-500 focus:outline-none rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Ringkasan Dokumen Bukti Fisik (minimal 5 karakter)
                  </label>
                  <textarea
                    required
                    minLength={5}
                    maxLength={600}
                    rows={2}
                    value={pkksSummary}
                    onChange={(e) => setPkksSummary(e.target.value)}
                    placeholder="Ringkasan dokumen bukti fisik..."
                    className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] focus:border-emerald-500 focus:outline-none rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tautan Dokumen / Keterangan Arsip
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={pkksUrl}
                      onChange={(e) => setPkksUrl(e.target.value)}
                      placeholder="https://drive.google.com/... atau Arsip Sekolah"
                      className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E4E6E1] focus:border-emerald-500 focus:outline-none rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Skor Kinerja (0 – 4)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={pkksScore}
                      onChange={(e) => setPkksScore(e.target.value)}
                      placeholder="Contoh: 4 atau 3.8"
                      className="w-full px-3 py-2 text-sm font-mono bg-[#FAF9F6] border border-[#E4E6E1] focus:border-emerald-500 focus:outline-none rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={pkksSaving}
                    className="btn-3d inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl disabled:opacity-60"
                  >
                    <Icon3D
                      name={pkksSaving ? 'loader' : pkksEditId ? 'check' : 'plus'}
                      tone="white"
                      size="xs"
                      className={pkksSaving ? 'animate-spin' : ''}
                    />
                    {pkksSaving
                      ? 'Menyimpan...'
                      : pkksEditId
                      ? 'Simpan Perubahan PKKS'
                      : 'Simpan Indikator PKKS'}
                  </button>
                  {pkksEditId && (
                    <button
                      type="button"
                      onClick={resetPkksForm}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="bg-white border-2 border-emerald-200 rounded-2xl divide-y divide-slate-200 overflow-hidden shadow-xs">
                {pkksItems.map((p) => {
                  const isEditingThis = pkksEditId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                        isEditingThis ? 'bg-emerald-50/75 ring-1 ring-inset ring-emerald-300' : 'hover:bg-emerald-50/35'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-mono font-semibold text-emerald-700">
                          {p.code} · {p.component} · Skor {Number(p.score ?? 0).toFixed(1)} · {p.status}
                        </p>
                        <h3 className="text-sm font-semibold text-[#132A2E] mt-0.5">
                          {p.indicatorTitle}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">{p.evidenceSummary}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPkksError('');
                            setPkksEditId(p.id);
                            setPkksCode(p.code);
                            setPkksComp(p.component);
                            setPkksTitle(p.indicatorTitle);
                            setPkksSummary(p.evidenceSummary);
                            setPkksUrl(p.evidenceUrl || '');
                            setPkksStatus(p.status);
                            setPkksScore(String(p.score ?? 4));
                            pkksFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                        >
                          <Icon3D name="pencil" tone="sky" size="xs" />
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (pkksEditId === p.id) {
                              resetPkksForm();
                            }
                            void removePkksItem(p.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Icon3D name="trash" tone="rose" size="xs" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Panel: Jabar Beraksi & File */}
          {panel === 'jabar-beraksi' && (
            <div className="space-y-6">
              <form
                ref={jbFormRef}
                onSubmit={handleJbSubmit}
                className="bg-white border border-amber-200 rounded-2xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-editorial text-xl font-semibold text-[#132A2E]">
                      {jbEditId
                        ? 'Edit Program, Foto & Lampiran Jabar Beraksi'
                        : 'Tambah Program, Unggah Foto & File Jabar Beraksi'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Kelola foto dokumentasi, laporan, dan berkas untuk Pendidikan Karakter, Digitalisasi Pembelajaran, Kualitas Dapodik, SPMI, dan Analisis Daya Tampung.
                    </p>
                  </div>
                  {jbEditId && (
                    <button
                      type="button"
                      onClick={resetJbForm}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Icon3D name="close" tone="rose" size="xs" />
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Judul Program / Dokumen
                    </label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={160}
                      value={jbTitle}
                      onChange={(e) => setJbTitle(e.target.value)}
                      placeholder="Contoh: Analisis Daya Tampung Rombel TA 2026/2027"
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kategori Pilar Jabar Beraksi
                    </label>
                    <select
                      value={jbType}
                      onChange={(e) => setJbType(e.target.value as EkskulType)}
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                    >
                      {JABAR_BERAKSI_PILLARS.map((pillar) => (
                        <option key={pillar} value={pillar}>
                          {pillar}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Status Publikasi
                    </label>
                    <select
                      value={jbStatus}
                      onChange={(e) =>
                        setJbStatus(e.target.value as 'terverifikasi' | 'menunggu')
                      }
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                    >
                      <option value="terverifikasi">Terverifikasi (Tampil Publik)</option>
                      <option value="menunggu">Menunggu Verifikasi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={jbCoach}
                      onChange={(e) => setJbCoach(e.target.value)}
                      placeholder="Nama Penanggung Jawab"
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={jbDate}
                      onChange={(e) => setJbDate(e.target.value)}
                      placeholder="Tanggal"
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jumlah Sasaran / Peserta
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      required
                      value={jbCount}
                      onChange={(e) => setJbCount(Number(e.target.value))}
                      placeholder="Jumlah Sasaran"
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#FFFDF7] border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Capaian / Hasil Utama
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={300}
                    value={jbOutcome}
                    onChange={(e) => setJbOutcome(e.target.value)}
                    placeholder="Contoh: Seluruh data rombel, GTK, dan daya tampung tervalidasi 100%"
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Uraian Singkat Pelaksanaan
                  </label>
                  <textarea
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={3}
                    value={jbDesc}
                    onChange={(e) => setJbDesc(e.target.value)}
                    placeholder="Jelaskan rincian kegiatan, indikator mutu, atau isi berkas lampiran..."
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-amber-500 focus:outline-none rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Photo Upload & Preview Box */}
                  <div className="lg:col-span-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-28 h-[70px] rounded-xl overflow-hidden shrink-0 bg-white border border-amber-200 shadow-2xs">
                        <SafeImage
                          src={jbImage}
                          alt={jbTitle || 'Pratinjau foto Jabar Beraksi'}
                          fallbackTitle="Foto Program"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <label className="block text-xs font-semibold text-amber-900">
                          Foto Dokumentasi / Sampul Program
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            ref={jbPhotoInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleJbPhotoUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={jbUploadingPhoto}
                            onClick={() => jbPhotoInputRef.current?.click()}
                            className="btn-3d inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg whitespace-nowrap shrink-0 disabled:opacity-60"
                          >
                            <Icon3D name="upload" tone="white" size="xs" />
                            {jbUploadingPhoto ? 'Memproses Foto...' : 'Unggah Foto'}
                          </button>
                          {jbImage !== SCHOOL_IMAGES.ekskul && (
                            <button
                              type="button"
                              onClick={() => {
                                setJbImage(SCHOOL_IMAGES.ekskul);
                                setJbPhotoError('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                            >
                              <Icon3D name="close" tone="rose" size="xs" />
                              Reset Foto
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Foto otomatis dikompresi ke rasio 16:10 (JPG, PNG, WebP) atau pilih foto bawaan sekolah.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={
                          IMAGE_PRESETS.some((p) => p.url === jbImage) ? jbImage : ''
                        }
                        onChange={(e) => {
                          if (e.target.value) {
                            setJbImage(e.target.value);
                            setJbPhotoError('');
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 focus:border-amber-500 focus:outline-none rounded-lg"
                      >
                        <option value="">Pilih foto bawaan sekolah...</option>
                        {IMAGE_PRESETS.map((p) => (
                          <option key={p.url} value={p.url}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={jbImage.startsWith('data:') ? '' : jbImage}
                        onChange={(e) => {
                          setJbImage(e.target.value);
                          setJbPhotoError('');
                        }}
                        placeholder={
                          jbImage.startsWith('data:')
                            ? 'Foto hasil unggahan aktif'
                            : 'Atau tempel URL foto (https://...)'
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 focus:border-amber-500 focus:outline-none rounded-lg"
                      />
                    </div>

                    {jbPhotoError && (
                      <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                        {jbPhotoError}
                      </p>
                    )}
                  </div>

                  {/* File Attachment Box */}
                  <div className="lg:col-span-6 p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-3 flex flex-col justify-between">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-sky-900">
                          File Lampiran (PDF, Excel, Word, PPT, CSV, Gambar)
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Unggah berkas langsung (maks. 450 KB) atau tempel tautan Google Drive / Belajar.id.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          ref={jbFileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.jpg,.jpeg,.png,.webp"
                          onChange={handleJbFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={jbUploadingFile}
                          onClick={() => jbFileInputRef.current?.click()}
                          className="btn-3d inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg whitespace-nowrap shrink-0 disabled:opacity-60"
                        >
                          <Icon3D name="upload" tone="white" size="xs" />
                          {jbUploadingFile ? 'Memproses...' : 'Unggah File'}
                        </button>
                        {jbFileUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setJbFileName('');
                              setJbFileUrl('');
                              setJbFileSize('');
                              setJbFileError('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="close" tone="rose" size="xs" />
                            Hapus File
                          </button>
                        )}
                      </div>
                    </div>

                    {jbFileUrl && (
                      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon3D name="file-text" tone="emerald" size="xs" />
                          <span className="font-semibold text-emerald-900 truncate">
                            {jbFileName || 'Dokumen terlampir'}
                          </span>
                          {jbFileSize && (
                            <span className="font-mono text-[11px] text-emerald-700 shrink-0">
                              ({jbFileSize})
                            </span>
                          )}
                        </div>
                        {jbFileUrl.startsWith('data:') ? (
                          <a
                            href={jbFileUrl}
                            download={jbFileName || 'dokumen-jabar-beraksi'}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="download" tone="sky" size="xs" />
                            Pratinjau
                          </a>
                        ) : (
                          <a
                            href={jbFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="external" tone="sky" size="xs" />
                            Buka Tautan
                          </a>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        maxLength={200}
                        value={jbFileName}
                        onChange={(e) => setJbFileName(e.target.value)}
                        placeholder="Nama dokumen tampil (mis. SK_SPMI_2026.pdf)"
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                      />
                      <input
                        type="text"
                        value={jbFileUrl.startsWith('data:') ? '' : jbFileUrl}
                        onChange={(e) => {
                          setJbFileUrl(e.target.value);
                          if (!jbFileName && e.target.value.trim()) {
                            setJbFileName('Dokumen_Jabar_Beraksi');
                          }
                          if (!jbFileSize && e.target.value.trim()) {
                            setJbFileSize('Tautan Dokumen');
                          }
                          setJbFileError('');
                        }}
                        placeholder={
                          jbFileUrl.startsWith('data:')
                            ? 'File unggahan langsung tersimpan'
                            : 'Atau tempel tautan file (https://drive.google.com/...)'
                        }
                        className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {jbFileError && (
                      <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                        {jbFileError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={jbSaving || jbUploadingPhoto || jbUploadingFile}
                    className="btn-3d inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl whitespace-nowrap shrink-0 disabled:opacity-60"
                  >
                    <Icon3D name={jbEditId ? 'check' : 'plus'} tone="white" size="xs" />
                    {jbSaving
                      ? 'Menyimpan...'
                      : jbEditId
                      ? 'Perbarui Program, Foto & File'
                      : 'Terbitkan ke Jabar Beraksi'}
                  </button>
                  {jbEditId && (
                    <button
                      type="button"
                      onClick={resetJbForm}
                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#132A2E] tabular-nums">
                      Daftar Program, Foto &amp; File Jabar Beraksi (
                      {jbFilterCategory === 'Semua'
                        ? jabarBeraksi.length
                        : jabarBeraksi.filter((r) => r.ekskulType === jbFilterCategory).length}
                      )
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Klik Edit untuk mengubah data, foto kegiatan, atau lampiran file; klik Hapus untuk menghapus program.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-amber-50 border border-amber-200 rounded-xl">
                    {(['Semua', ...JABAR_BERAKSI_PILLARS] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setJbFilterCategory(cat)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          jbFilterCategory === cat
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-900/80 hover:bg-amber-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  {jabarBeraksi
                    .filter((r) => jbFilterCategory === 'Semua' || r.ekskulType === jbFilterCategory)
                    .map((r) => (
                      <div
                        key={r.id}
                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                          jbEditId === r.id ? 'bg-amber-50/70' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-amber-200 bg-amber-50">
                            <SafeImage
                              src={r.imageUrl}
                              alt={r.title}
                              fallbackTitle={r.ekskulType}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="text-xs text-slate-500">
                              <span className="font-semibold text-amber-700">{r.ekskulType}</span> ·{' '}
                              {r.activityDate} ·{' '}
                              <span
                                className={`font-semibold ${
                                  r.status === 'terverifikasi'
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {r.status === 'terverifikasi' ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                              </span>
                            </p>
                            <h3 className="text-sm font-semibold text-[#132A2E]">{r.title}</h3>
                            <p className="text-[11px] text-slate-500">
                              PJ: {r.coachName} · {r.participantCount} Sasaran
                            </p>
                            {r.fileUrl ? (
                              <div className="inline-flex items-center gap-2 text-[11px] text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1">
                                <Icon3D name="file-text" tone="sky" size="xs" />
                                <span className="font-medium truncate max-w-[240px]">
                                  {r.fileName || 'Dokumen Lampiran'}
                                </span>
                                {r.fileSize && (
                                  <span className="font-mono text-slate-500">({r.fileSize})</span>
                                )}
                                {r.fileUrl.startsWith('data:') ? (
                                  <a
                                    href={r.fileUrl}
                                    download={r.fileName || 'dokumen-jabar-beraksi'}
                                    className="font-semibold text-sky-700 hover:underline ml-1"
                                  >
                                    Unduh
                                  </a>
                                ) : (
                                  <a
                                    href={r.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-sky-700 hover:underline ml-1"
                                  >
                                    Buka
                                  </a>
                                )}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400">Belum ada lampiran file</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {r.status !== 'terverifikasi' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await verifyJabarBeraksi(r.id, 'terverifikasi');
                                notifySaved(`Program "${r.title}" berhasil diverifikasi.`);
                              }}
                              className="btn-3d inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg whitespace-nowrap shrink-0"
                            >
                              <Icon3D name="check" tone="white" size="xs" />
                              Verifikasi
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setJbEditId(r.id);
                              setJbTitle(r.title);
                              setJbType(r.ekskulType);
                              setJbCoach(r.coachName);
                              setJbDate(r.activityDate);
                              setJbCount(r.participantCount);
                              setJbOutcome(r.characterOutcome);
                              setJbDesc(r.description);
                              setJbStatus(r.status);
                              setJbImage(r.imageUrl || SCHOOL_IMAGES.ekskul);
                              setJbPhotoError('');
                              setJbFileName(r.fileName || '');
                              setJbFileUrl(r.fileUrl || '');
                              setJbFileSize(r.fileSize || '');
                              setJbFileError('');
                              setConfirmDeleteJbId(null);
                              jbFormRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="pencil" tone="sky" size="xs" />
                            Edit
                          </button>

                          {confirmDeleteJbId === r.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (jbEditId === r.id) resetJbForm();
                                  await removeJabarBeraksi(r.id);
                                  setConfirmDeleteJbId(null);
                                  notifySaved(`Program "${r.title}" berhasil dihapus.`);
                                }}
                                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteJbId(null)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteJbId(r.id)}
                              aria-label={`Hapus ${r.title}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                            >
                              <Icon3D name="trash" tone="rose" size="xs" />
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Panel: Manajemen SILOKA (5 Pilar + Kotak Masuk Pengaduan) */}
          {panel === 'siloka' && (
            <div className="space-y-6">
              {/* Sub-navigation switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-violet-200 rounded-2xl p-4 shadow-xs">
                <div>
                  <h2 className="font-editorial text-lg font-semibold text-[#132A2E]">
                    Dashboard Manajemen SILOKA SDN Cikawao
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Kelola 5 pilar SILOKA (Perencanaan, Pengorganisasian, Pelaksana, Program Unggulan, Evaluasi) serta kotak masuk pengaduan masyarakat.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 p-1 bg-violet-50 border border-violet-200 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSilokaAdminView('pillars')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      silokaAdminView === 'pillars'
                        ? 'bg-violet-600 text-white shadow-2xs'
                        : 'text-violet-900/80 hover:bg-violet-100'
                    }`}
                  >
                    5 Pilar SILOKA ({silokaItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSilokaAdminView('complaints')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      silokaAdminView === 'complaints'
                        ? 'bg-violet-600 text-white shadow-2xs'
                        : 'text-violet-900/80 hover:bg-violet-100'
                    }`}
                  >
                    Pengaduan ({silokaComplaints.length})
                  </button>
                </div>
              </div>

              {silokaAdminView === 'pillars' ? (
                <>
                  <form
                    ref={silokaFormRef}
                    onSubmit={handleSilokaSubmit}
                    className="bg-white border border-violet-200 rounded-2xl p-6 space-y-4 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-editorial text-xl font-semibold text-[#132A2E]">
                          {silokaEditId
                            ? 'Edit Program, Foto & File SILOKA'
                            : 'Tambah Program, Foto & File SILOKA'}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Isi dokumen dan kegiatan pada pilar Perencanaan, Pengorganisasian, Pelaksana, Program Unggulan, atau Evaluasi.
                        </p>
                      </div>
                      {silokaEditId && (
                        <button
                          type="button"
                          onClick={resetSilokaForm}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                        >
                          <Icon3D name="close" tone="rose" size="xs" />
                          Batal Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Judul Program / Dokumen SILOKA
                        </label>
                        <input
                          type="text"
                          required
                          minLength={5}
                          maxLength={160}
                          value={silokaTitle}
                          onChange={(e) => setSilokaTitle(e.target.value)}
                          placeholder="Contoh: Penyusunan RKT & RKAS Tahun 2026"
                          className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Pilar SILOKA
                        </label>
                        <select
                          value={silokaPillar}
                          onChange={(e) => setSilokaPillar(e.target.value as SilokaPillar)}
                          className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl"
                        >
                          {SILOKA_PILLARS.map((pillar) => (
                            <option key={pillar} value={pillar}>
                              {pillar}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Status Publikasi
                        </label>
                        <select
                          value={silokaStatus}
                          onChange={(e) =>
                            setSilokaStatus(e.target.value as 'terpublikasi' | 'draf')
                          }
                          className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl"
                        >
                          <option value="terpublikasi">Terpublikasi (Tampil Publik)</option>
                          <option value="draf">Draf Internal</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Koordinator / Penanggung Jawab
                        </label>
                        <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={120}
                          value={silokaCoordinator}
                          onChange={(e) => setSilokaCoordinator(e.target.value)}
                          placeholder="Nama Koordinator"
                          className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Periode / Tanggal Pelaksanaan
                        </label>
                        <input
                          type="text"
                          required
                          minLength={4}
                          maxLength={40}
                          value={silokaPeriodDate}
                          onChange={(e) => setSilokaPeriodDate(e.target.value)}
                          placeholder="Contoh: Semester Ganjil 2026"
                          className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Sasaran Program
                        </label>
                        <input
                          type="text"
                          maxLength={120}
                          value={silokaTargetGroup}
                          onChange={(e) => setSilokaTargetGroup(e.target.value)}
                          placeholder="Contoh: 184 Siswa & 10 GTK"
                          className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Indikator / Capaian Utama
                      </label>
                      <input
                        type="text"
                        required
                        minLength={5}
                        maxLength={300}
                        value={silokaOutcome}
                        onChange={(e) => setSilokaOutcome(e.target.value)}
                        placeholder="Contoh: Tersusunnya rencana program kerja dan pengawasan mutu secara terukur"
                        className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Uraian Lengkap Program
                      </label>
                      <textarea
                        required
                        minLength={10}
                        maxLength={2000}
                        rows={3}
                        value={silokaDesc}
                        onChange={(e) => setSilokaDesc(e.target.value)}
                        placeholder="Jelaskan langkah pelaksanaan, pembagian peran, atau hasil evaluasi..."
                        className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-violet-500 focus:outline-none rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Photo Upload & Preview Box */}
                      <div className="lg:col-span-6 p-4 rounded-xl bg-violet-50/60 border border-violet-200 space-y-3">
                        <div className="flex items-start gap-3.5">
                          <div className="w-28 h-[70px] rounded-xl overflow-hidden shrink-0 bg-white border border-violet-200 shadow-2xs">
                            <SafeImage
                              src={silokaImage}
                              alt={silokaTitle || 'Pratinjau foto SILOKA'}
                              fallbackTitle="Foto SILOKA"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <label className="block text-xs font-semibold text-violet-900">
                              Foto Dokumentasi Program
                            </label>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                ref={silokaPhotoInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleSilokaPhotoUpload}
                                className="hidden"
                              />
                              <button
                                type="button"
                                disabled={silokaUploadingPhoto}
                                onClick={() => silokaPhotoInputRef.current?.click()}
                                className="btn-3d inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-indigo-600 rounded-lg whitespace-nowrap shrink-0 disabled:opacity-60"
                              >
                                <Icon3D name="upload" tone="white" size="xs" />
                                {silokaUploadingPhoto ? 'Memproses...' : 'Unggah Foto'}
                              </button>
                              {silokaImage !== SCHOOL_IMAGES.hero && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSilokaImage(SCHOOL_IMAGES.hero);
                                    setSilokaPhotoError('');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                                >
                                  <Icon3D name="close" tone="rose" size="xs" />
                                  Reset Foto
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600">
                              Foto otomatis disesuaikan ke rasio 16:10 (JPG, PNG, WebP) atau pilih foto bawaan sekolah.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <select
                            value={
                              IMAGE_PRESETS.some((p) => p.url === silokaImage)
                                ? silokaImage
                                : ''
                            }
                            onChange={(e) => {
                              if (e.target.value) {
                                setSilokaImage(e.target.value);
                                setSilokaPhotoError('');
                              }
                            }}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 focus:border-violet-500 focus:outline-none rounded-lg"
                          >
                            <option value="">Pilih foto bawaan sekolah...</option>
                            {IMAGE_PRESETS.map((p) => (
                              <option key={p.url} value={p.url}>
                                {p.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={silokaImage.startsWith('data:') ? '' : silokaImage}
                            onChange={(e) => {
                              setSilokaImage(e.target.value);
                              setSilokaPhotoError('');
                            }}
                            placeholder={
                              silokaImage.startsWith('data:')
                                ? 'Foto hasil unggahan aktif'
                                : 'Atau tempel URL foto (https://...)'
                            }
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 focus:border-violet-500 focus:outline-none rounded-lg"
                          />
                        </div>

                        {silokaPhotoError && (
                          <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                            {silokaPhotoError}
                          </p>
                        )}
                      </div>

                      {/* File Attachment Box */}
                      <div className="lg:col-span-6 p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-3 flex flex-col justify-between">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-sky-900">
                              File Lampiran (PDF, Excel, Word, PPT, CSV, Gambar)
                            </p>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Unggah berkas langsung (maks. 450 KB) atau tempel tautan Google Drive / Belajar.id.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              ref={silokaFileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.jpg,.jpeg,.png,.webp"
                              onChange={handleSilokaFileUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={silokaUploadingFile}
                              onClick={() => silokaFileInputRef.current?.click()}
                              className="btn-3d inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg whitespace-nowrap shrink-0 disabled:opacity-60"
                            >
                              <Icon3D name="upload" tone="white" size="xs" />
                              {silokaUploadingFile ? 'Memproses...' : 'Unggah File'}
                            </button>
                            {silokaFileUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSilokaFileName('');
                                  setSilokaFileUrl('');
                                  setSilokaFileSize('');
                                  setSilokaFileError('');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                              >
                                <Icon3D name="close" tone="rose" size="xs" />
                                Hapus File
                              </button>
                            )}
                          </div>
                        </div>

                        {silokaFileUrl && (
                          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon3D name="file-text" tone="emerald" size="xs" />
                              <span className="font-semibold text-emerald-900 truncate">
                                {silokaFileName || 'Dokumen terlampir'}
                              </span>
                              {silokaFileSize && (
                                <span className="font-mono text-[11px] text-emerald-700 shrink-0">
                                  ({silokaFileSize})
                                </span>
                              )}
                            </div>
                            {silokaFileUrl.startsWith('data:') ? (
                              <a
                                href={silokaFileUrl}
                                download={silokaFileName || 'dokumen-siloka'}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline whitespace-nowrap shrink-0"
                              >
                                <Icon3D name="download" tone="sky" size="xs" />
                                Pratinjau
                              </a>
                            ) : (
                              <a
                                href={silokaFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:underline whitespace-nowrap shrink-0"
                              >
                                <Icon3D name="external" tone="sky" size="xs" />
                                Buka Tautan
                              </a>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            maxLength={200}
                            value={silokaFileName}
                            onChange={(e) => setSilokaFileName(e.target.value)}
                            placeholder="Nama dokumen tampil (mis. RKT_2026.pdf)"
                            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                          />
                          <input
                            type="text"
                            value={silokaFileUrl.startsWith('data:') ? '' : silokaFileUrl}
                            onChange={(e) => {
                              setSilokaFileUrl(e.target.value);
                              if (!silokaFileName && e.target.value.trim()) {
                                setSilokaFileName('Dokumen_Program_SILOKA');
                              }
                              if (!silokaFileSize && e.target.value.trim()) {
                                setSilokaFileSize('Tautan Dokumen');
                              }
                              setSilokaFileError('');
                            }}
                            placeholder={
                              silokaFileUrl.startsWith('data:')
                                ? 'File unggahan langsung tersimpan'
                                : 'Atau tempel tautan file (https://drive.google.com/...)'
                            }
                            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        {silokaFileError && (
                          <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                            {silokaFileError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={silokaSaving || silokaUploadingPhoto || silokaUploadingFile}
                        className="btn-3d inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl whitespace-nowrap shrink-0 disabled:opacity-60"
                      >
                        <Icon3D name={silokaEditId ? 'check' : 'plus'} tone="white" size="xs" />
                        {silokaSaving
                          ? 'Menyimpan...'
                          : silokaEditId
                          ? 'Perbarui Program SILOKA'
                          : 'Tambahkan ke SILOKA'}
                      </button>
                      {silokaEditId && (
                        <button
                          type="button"
                          onClick={resetSilokaForm}
                          className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="bg-white border border-violet-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-[#132A2E] tabular-nums">
                          Daftar Program &amp; Dokumen SILOKA (
                          {silokaFilterPillar === 'Semua'
                            ? silokaItems.length
                            : silokaItems.filter((item) => item.pillar === silokaFilterPillar)
                                .length}
                          )
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Klik Edit untuk menyunting data, foto, atau lampiran; klik Hapus untuk menghapus item.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 p-1 bg-violet-50 border border-violet-200 rounded-xl">
                        {(['Semua', ...SILOKA_PILLARS] as const).map((pillar) => (
                          <button
                            key={pillar}
                            type="button"
                            onClick={() => setSilokaFilterPillar(pillar)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                              silokaFilterPillar === pillar
                                ? 'bg-violet-600 text-white shadow-2xs'
                                : 'text-violet-900/80 hover:bg-violet-100'
                            }`}
                          >
                            {pillar}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {silokaItems
                        .filter(
                          (item) =>
                            silokaFilterPillar === 'Semua' || item.pillar === silokaFilterPillar
                        )
                        .map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                              silokaEditId === item.id ? 'bg-violet-50/70' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            <div className="flex items-start gap-3.5 min-w-0">
                              <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 border border-violet-200 bg-violet-50">
                                <SafeImage
                                  src={item.imageUrl}
                                  alt={item.title}
                                  fallbackTitle={item.pillar}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <p className="text-xs text-slate-500">
                                  <span className="font-semibold text-violet-700">
                                    {item.pillar}
                                  </span>{' '}
                                  · {item.periodDate} ·{' '}
                                  <span
                                    className={`font-semibold ${
                                      item.status === 'terpublikasi'
                                        ? 'text-emerald-700'
                                        : 'text-amber-700'
                                    }`}
                                  >
                                    {item.status === 'terpublikasi' ? 'Terpublikasi' : 'Draf'}
                                  </span>
                                </p>
                                <h4 className="text-sm font-semibold text-[#132A2E]">
                                  {item.title}
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Koordinator: {item.coordinator}
                                  {item.targetGroup ? ` · ${item.targetGroup}` : ''}
                                </p>
                                {item.fileUrl ? (
                                  <div className="inline-flex items-center gap-2 text-[11px] text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1">
                                    <Icon3D name="file-text" tone="sky" size="xs" />
                                    <span className="font-medium truncate max-w-[240px]">
                                      {item.fileName || 'Dokumen Lampiran'}
                                    </span>
                                    {item.fileSize && (
                                      <span className="font-mono text-slate-500">
                                        ({item.fileSize})
                                      </span>
                                    )}
                                    {item.fileUrl.startsWith('data:') ? (
                                      <a
                                        href={item.fileUrl}
                                        download={item.fileName || 'dokumen-siloka'}
                                        className="font-semibold text-sky-700 hover:underline ml-1"
                                      >
                                        Unduh
                                      </a>
                                    ) : (
                                      <a
                                        href={item.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-sky-700 hover:underline ml-1"
                                      >
                                        Buka
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-slate-400">
                                    Belum ada lampiran file
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSilokaEditId(item.id);
                                  setSilokaTitle(item.title);
                                  setSilokaPillar(item.pillar);
                                  setSilokaCoordinator(item.coordinator);
                                  setSilokaPeriodDate(item.periodDate);
                                  setSilokaTargetGroup(item.targetGroup || '');
                                  setSilokaOutcome(item.outcome);
                                  setSilokaDesc(item.description);
                                  setSilokaStatus(item.status);
                                  setSilokaImage(item.imageUrl || SCHOOL_IMAGES.hero);
                                  setSilokaPhotoError('');
                                  setSilokaFileName(item.fileName || '');
                                  setSilokaFileUrl(item.fileUrl || '');
                                  setSilokaFileSize(item.fileSize || '');
                                  setSilokaFileError('');
                                  setConfirmDeleteSilokaId(null);
                                  silokaFormRef.current?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                              >
                                <Icon3D name="pencil" tone="sky" size="xs" />
                                Edit
                              </button>

                              {confirmDeleteSilokaId === item.id ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (silokaEditId === item.id) resetSilokaForm();
                                      await removeSilokaItem(item.id);
                                      setConfirmDeleteSilokaId(null);
                                      notifySaved(`Program SILOKA "${item.title}" berhasil dihapus.`);
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                                  >
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteSilokaId(null)}
                                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSilokaId(item.id)}
                                  aria-label={`Hapus ${item.title}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                                >
                                  <Icon3D name="trash" tone="rose" size="xs" />
                                  Hapus
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border border-violet-200 rounded-2xl p-6">
                    <h3 className="font-editorial text-xl font-semibold text-[#132A2E]">
                      Kotak Masuk Pengaduan Masyarakat (SILOKA)
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Tanggapi aspirasi orang tua dan masyarakat dengan cepat agar status tiket diperbarui real-time.
                    </p>
                  </div>

                  {silokaComplaints.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-600">
                      Belum ada pengaduan masyarakat yang masuk.
                    </div>
                  ) : (
                    silokaComplaints.map((c) => {
                      const draft = silokaDrafts[c.id] || {
                        status: c.status,
                        response: c.adminResponse,
                      };
                      return (
                        <div
                          key={c.id}
                          className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-mono font-semibold text-[#132A2E]">
                              {c.ticketCode} · {c.category}
                            </span>
                            <span className="text-slate-500">
                              {c.reporterName} ({c.reporterRole})
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-[#132A2E]">{c.subject}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <select
                              value={draft.status}
                              onChange={(e) =>
                                setSilokaDrafts((prev) => ({
                                  ...prev,
                                  [c.id]: { ...draft, status: e.target.value as SilokaStatus },
                                }))
                              }
                              className="sm:col-span-3 px-3 py-2 text-xs bg-[#FFFDF7] border border-slate-200 rounded-lg"
                            >
                              <option value="Diterima">Diterima</option>
                              <option value="Diproses">Diproses</option>
                              <option value="Selesai">Selesai</option>
                            </select>
                            <input
                              type="text"
                              value={draft.response}
                              onChange={(e) =>
                                setSilokaDrafts((prev) => ({
                                  ...prev,
                                  [c.id]: { ...draft, response: e.target.value },
                                }))
                              }
                              placeholder="Tulis tanggapan resmi Kepala Sekolah..."
                              className="sm:col-span-7 px-3 py-2 text-xs bg-[#FFFDF7] border border-slate-200 rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                void respondSilokaComplaint(c.id, draft.status, draft.response);
                                notifySaved(`Tiket ${c.ticketCode} berhasil diperbarui.`);
                              }}
                              className="sm:col-span-2 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                            >
                              Kirim Respon
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* Panel: Gallery */}
          {panel === 'gallery' && (
            <div className="space-y-6">
              <form
                ref={galFormRef}
                onSubmit={handleGallerySubmit}
                className="bg-white border border-orange-200 rounded-2xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-editorial text-xl font-semibold text-[#132A2E]">
                      {galEditId
                        ? 'Edit Foto / Video Kegiatan Galeri Sekolah'
                        : 'Upload Foto & Video Kegiatan Galeri Sekolah'}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Unggah foto atau video dokumentasi kegiatan KBM, ekstrakurikuler, fasilitas, dan prestasi siswa agar pengunjung dapat melihat dan memutarnya langsung.
                    </p>
                  </div>
                  {galEditId && (
                    <button
                      type="button"
                      onClick={resetGalForm}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <Icon3D name="close" tone="rose" size="xs" />
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Judul Foto / Video Kegiatan
                    </label>
                    <input
                      type="text"
                      required
                      minLength={3}
                      maxLength={140}
                      value={galTitle}
                      onChange={(e) => setGalTitle(e.target.value)}
                      placeholder="Contoh: Pentas Seni Angklung & Gelar Karya P5"
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-orange-500 focus:outline-none rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Kategori Kegiatan
                    </label>
                    <select
                      value={galCat}
                      onChange={(e) => setGalCat(e.target.value as GalleryCategory)}
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-orange-500 focus:outline-none rounded-xl"
                    >
                      <option value="KBM">KBM</option>
                      <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                      <option value="Fasilitas">Fasilitas</option>
                      <option value="Prestasi">Prestasi</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tanggal / Bulan Kegiatan
                    </label>
                    <input
                      type="text"
                      required
                      minLength={4}
                      maxLength={40}
                      value={galTakenDate}
                      onChange={(e) => setGalTakenDate(e.target.value)}
                      placeholder="Contoh: 23 November 2026"
                      className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-orange-500 focus:outline-none rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Keterangan Singkat Kegiatan
                  </label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    maxLength={400}
                    value={galCaption}
                    onChange={(e) => setGalCaption(e.target.value)}
                    placeholder="Jelaskan kegiatan atau momen yang didokumentasikan..."
                    className="w-full px-3 py-2 text-sm bg-[#FFFDF7] border border-slate-200 focus:border-orange-500 focus:outline-none rounded-xl"
                  />
                </div>

                {/* Upload Foto / Video Kegiatan Box */}
                <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="w-44 aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-black/90 border border-orange-200 shadow-2xs relative">
                      {galMediaType === 'video' && (galVideoPreviewUrl || galVideoUrl) ? (
                        galVideoUrl.includes('youtube.com') || galVideoUrl.includes('youtu.be') ? (
                          <SafeImage
                            src={galImage}
                            alt={galTitle || 'Pratinjau video kegiatan'}
                            fallbackTitle="Video YouTube"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            key={galVideoPreviewUrl || galVideoUrl}
                            src={galVideoPreviewUrl || galVideoUrl}
                            poster={galImage}
                            controls
                            playsInline
                            className="w-full h-full object-cover bg-black"
                          />
                        )
                      ) : (
                        <SafeImage
                          src={galImage}
                          alt={galTitle || 'Pratinjau foto kegiatan galeri'}
                          fallbackTitle="Foto Kegiatan"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="block text-xs font-semibold text-orange-950">
                          Upload Foto atau Video Kegiatan
                        </label>
                        <div className="inline-flex items-center gap-1 p-0.5 bg-white border border-orange-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => {
                              revokeLocalGalBlob();
                              setGalMediaType('image');
                              setGalVideoUrl('');
                              setGalVideoPreviewUrl('');
                              setGalVideoFileName('');
                              setGalVideoChunks(null);
                              setGalExistingChunkCount(0);
                              setGalPhotoError('');
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                              galMediaType === 'image'
                                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
                                : 'text-slate-600 hover:bg-orange-50'
                            }`}
                          >
                            <Icon3D
                              name="image"
                              tone={galMediaType === 'image' ? 'white' : 'orange'}
                              size="xs"
                            />
                            Foto
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGalMediaType('video');
                              setGalPhotoError('');
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                              galMediaType === 'video'
                                ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white'
                                : 'text-slate-600 hover:bg-orange-50'
                            }`}
                          >
                            <Icon3D
                              name="video"
                              tone={galMediaType === 'video' ? 'white' : 'rose'}
                              size="xs"
                            />
                            Video
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={galPhotoInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.m4v,.ogv,.ogg,image/*,video/*"
                          onChange={handleGalMediaUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={galUploadingPhoto}
                          onClick={() => galPhotoInputRef.current?.click()}
                          className="btn-3d inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-600 rounded-lg whitespace-nowrap shrink-0 disabled:opacity-60"
                        >
                          <Icon3D name="upload" tone="white" size="xs" />
                          {galUploadingPhoto
                            ? 'Memproses Media...'
                            : 'Unggah Foto / Video Kegiatan'}
                        </button>
                        {(galMediaType === 'video' || galImage !== SCHOOL_IMAGES.kbm) && (
                          <button
                            type="button"
                            onClick={() => {
                              revokeLocalGalBlob();
                              setGalMediaType('image');
                              setGalImage(SCHOOL_IMAGES.kbm);
                              setGalVideoUrl('');
                              setGalVideoMimeType('');
                              setGalVideoFileName('');
                              setGalVideoChunks(null);
                              setGalVideoPreviewUrl('');
                              setGalExistingChunkCount(0);
                              setGalPhotoError('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="close" tone="rose" size="xs" />
                            Reset Media
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Mendukung foto (<span className="font-mono">.jpg, .png, .webp, .gif</span>) maupun ekstensi video (<span className="font-mono">.mp4, .webm, .mov, .m4v, .ogg</span> maks. 30 MB) untuk diputar langsung di website.
                      </p>
                      {galMediaType === 'video' && (galVideoFileName || galVideoUrl) && (
                        <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5">
                          <Icon3D name="play" tone="emerald" size="xs" />
                          <span>
                            Video siap diputar:{' '}
                            {galVideoFileName || 'Tautan video eksternal'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={IMAGE_PRESETS.some((p) => p.url === galImage) ? galImage : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setGalImage(e.target.value);
                          setGalPhotoError('');
                        }
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 focus:border-orange-500 focus:outline-none rounded-lg"
                    >
                      <option value="">
                        {galMediaType === 'video'
                          ? 'Pilih gambar sampul video (opsional)...'
                          : 'Atau pilih foto bawaan sekolah...'}
                      </option>
                      {IMAGE_PRESETS.map((p) => (
                        <option key={p.url} value={p.url}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={
                        galMediaType === 'video'
                          ? galVideoUrl.startsWith('data:')
                            ? ''
                            : galVideoUrl
                          : galImage.startsWith('data:')
                          ? ''
                          : galImage
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setGalPhotoError('');
                        if (galMediaType === 'video' || isLikelyVideoUrl(val)) {
                          revokeLocalGalBlob();
                          setGalMediaType('video');
                          setGalVideoUrl(val);
                          setGalVideoChunks(null);
                          setGalVideoPreviewUrl('');
                          setGalExistingChunkCount(0);
                          setGalVideoMimeType('video/mp4');
                          if (!galVideoFileName && val.trim()) {
                            setGalVideoFileName('Tautan Video Kegiatan');
                          }
                        } else {
                          setGalMediaType('image');
                          setGalImage(val);
                          setGalVideoUrl('');
                        }
                      }}
                      placeholder={
                        galMediaType === 'video'
                          ? galVideoUrl.startsWith('data:') || galExistingChunkCount > 0
                            ? 'Video hasil unggahan aktif siap diputar'
                            : 'Atau tempel URL video (.mp4, .webm, YouTube)'
                          : galImage.startsWith('data:')
                          ? 'Foto kegiatan hasil unggahan aktif'
                          : 'Atau tempel URL foto / video (https://...)'
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 focus:border-orange-500 focus:outline-none rounded-lg"
                    />
                  </div>

                  {galPhotoError && (
                    <p className="text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
                      {galPhotoError}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={galSaving || galUploadingPhoto}
                    className="btn-3d inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl whitespace-nowrap shrink-0 disabled:opacity-60"
                  >
                    <Icon3D name={galEditId ? 'check' : 'plus'} tone="white" size="xs" />
                    {galSaving
                      ? 'Menyimpan...'
                      : galEditId
                      ? 'Perbarui Galeri Sekolah'
                      : galMediaType === 'video'
                      ? 'Simpan Video ke Galeri'
                      : 'Tambahkan ke Galeri'}
                  </button>
                  {galEditId && (
                    <button
                      type="button"
                      onClick={resetGalForm}
                      className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>

              <div className="bg-white border border-orange-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#132A2E] tabular-nums">
                      Daftar Dokumentasi Galeri Sekolah (
                      {galFilterCat === 'Semua'
                        ? gallery.length
                        : gallery.filter((g) => g.category === galFilterCat).length}
                      )
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Klik Edit untuk mengganti foto, video, atau keterangan kegiatan; klik Hapus untuk menghapus dari galeri.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-orange-50 border border-orange-200 rounded-xl">
                    {(['Semua', 'KBM', 'Ekstrakurikuler', 'Fasilitas', 'Prestasi'] as const).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setGalFilterCat(cat)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                            galFilterCat === cat
                              ? 'bg-orange-600 text-white shadow-2xs'
                              : 'text-orange-900/80 hover:bg-orange-100'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  {gallery
                    .filter((g) => galFilterCat === 'Semua' || g.category === galFilterCat)
                    .map((g) => (
                      <div
                        key={g.id}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                          galEditId === g.id ? 'bg-orange-50/70' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="relative w-24 aspect-[4/3] rounded-xl overflow-hidden shrink-0 border border-orange-200 bg-orange-50">
                            <SafeImage
                              src={g.imageUrl}
                              alt={g.title}
                              fallbackTitle={g.title}
                              className="w-full h-full object-cover"
                            />
                            {g.mediaType === 'video' && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                                <Icon3D name="play" tone="white" size="md" />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs text-slate-500">
                              {g.mediaType === 'video' && (
                                <>
                                  <span className="font-semibold text-sky-700">Video</span>
                                  <span className="mx-1.5" aria-hidden="true">
                                    ·
                                  </span>
                                </>
                              )}
                              <span className="font-semibold text-orange-700">{g.category}</span>
                              <span className="mx-1.5" aria-hidden="true">
                                ·
                              </span>
                              <span>{g.takenDate}</span>
                            </p>
                            <h3 className="text-sm font-semibold text-[#132A2E]">{g.title}</h3>
                            <p className="text-xs text-slate-600 line-clamp-2">{g.caption}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              revokeLocalGalBlob();
                              const isVideo = g.mediaType === 'video';
                              setGalEditId(g.id);
                              setGalTitle(g.title);
                              setGalCat(g.category);
                              setGalTakenDate(g.takenDate || 'November 2026');
                              setGalCaption(g.caption);
                              setGalMediaType(isVideo ? 'video' : 'image');
                              setGalImage(g.imageUrl || SCHOOL_IMAGES.kbm);
                              setGalVideoUrl(isVideo ? g.videoUrl || '' : '');
                              setGalVideoMimeType(isVideo ? g.videoMimeType || 'video/mp4' : '');
                              setGalVideoFileName(isVideo ? g.videoFileName || '' : '');
                              setGalExistingChunkCount(
                                isVideo ? Number(g.videoChunkCount || 0) : 0
                              );
                              setGalVideoChunks(isVideo ? undefined : null);
                              setGalVideoPreviewUrl('');
                              setGalPhotoError('');
                              setConfirmDeleteGalId(null);
                              galFormRef.current?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              });
                              if (isVideo) {
                                try {
                                  const resolved = await resolveGalleryVideoUrl(g);
                                  if (resolved) setGalVideoPreviewUrl(resolved);
                                } catch {
                                  // Ignore preview error; user can still re-upload
                                }
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                          >
                            <Icon3D name="pencil" tone="sky" size="xs" />
                            Edit
                          </button>

                          {confirmDeleteGalId === g.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  if (galEditId === g.id) resetGalForm();
                                  await removeGalleryItem(g.id);
                                  setConfirmDeleteGalId(null);
                                  notifySaved(
                                    `${
                                      g.mediaType === 'video' ? 'Video' : 'Foto'
                                    } "${g.title}" berhasil dihapus dari galeri.`
                                  );
                                }}
                                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                              >
                                Ya, Hapus
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteGalId(null)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 whitespace-nowrap shrink-0"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteGalId(g.id)}
                              aria-label={`Hapus ${g.title}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50/70 hover:bg-rose-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
                            >
                              <Icon3D name="trash" tone="rose" size="xs" />
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
