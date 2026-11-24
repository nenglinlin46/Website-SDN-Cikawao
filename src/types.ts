export type AppTab =
  | 'beranda'
  | 'profil'
  | 'akademik'
  | 'jabar-beraksi'
  | 'pkks-galeri'
  | 'siloka'
  | 'game'
  | 'admin';

export type NewsCategory = 'Akademik' | 'Prestasi' | 'Kegiatan' | 'Kurikulum Merdeka';
export type NewsStatus = 'published' | 'draft';

export interface NewsArticle {
  id: string;
  title: string;
  category: NewsCategory;
  summary: string;
  content: string;
  imageUrl: string;
  authorName: string;
  authorUid: string;
  status: NewsStatus;
  publishedDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AnnouncementPriority = 'mendesak' | 'penting' | 'info';
export type TargetAudience =
  | 'Semua Orang Tua'
  | 'Fase A (Kelas 1-2)'
  | 'Fase B (Kelas 3-4)'
  | 'Fase C (Kelas 5-6)';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  targetAudience: TargetAudience;
  isActive: boolean;
  autoNotifyParents: boolean;
  authorUid: string;
  authorName: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type RombelName =
  | 'Kelas 1'
  | 'Kelas 2'
  | 'Kelas 3'
  | 'Kelas 4'
  | 'Kelas 5'
  | 'Kelas 6';

export interface ParentSubscription {
  uid: string;
  parentName: string;
  email: string;
  rombelFilter: 'Semua' | RombelName;
  browserPushEnabled: boolean;
  instantAlertEnabled: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type GalleryCategory = 'KBM' | 'Ekstrakurikuler' | 'Fasilitas' | 'Prestasi';
export type GalleryMediaType = 'image' | 'video';

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  caption: string;
  mediaType?: GalleryMediaType;
  imageUrl: string;
  videoUrl?: string;
  videoMimeType?: string;
  videoFileName?: string;
  videoChunkCount?: number;
  takenDate: string;
  authorUid: string;
  createdAt?: unknown;
}

export type P5Status =
  | 'Berkembang Sesuai Harapan'
  | 'Sangat Berkembang'
  | 'Mulai Berkembang';

export interface StudentRecord {
  id: string;
  nisn: string;
  nik?: string;
  fullName: string;
  rombel: RombelName;
  gender: 'L' | 'P';
  parentName: string;
  parentEmail: string;
  parentUid: string;
  attendancePercent: number;
  p5ProjectTitle: string;
  p5Status: P5Status;
  mathScore: number;
  indoScore: number;
  ipasScore: number;
  pancasilaScore: number;
  sundaScore: number;
  teacherNote: string;
  updatedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NisnDirectoryEntry {
  id: string;
  nisn: string;
  fullName: string;
  rombel: RombelName;
  gender: 'L' | 'P';
  nikHash: string;
  updatedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StudentLinkRequest {
  id: string;
  requesterUid: string;
  requesterEmail: string;
  requesterName: string;
  studentName: string;
  nisn: string;
  rombel: RombelName;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type PkksComponent =
  | 'Manajerial'
  | 'Kewirausahaan'
  | 'Supervisi'
  | 'Pengembangan Diri'
  | 'Kurikulum Merdeka'
  | 'Kemitraan';

export type PkksStatus = 'Lengkap' | 'Dalam Proses' | 'Perlu Dilengkapi';

export interface PkksItem {
  id: string;
  code: string;
  component: PkksComponent;
  indicatorTitle: string;
  evidenceSummary: string;
  evidenceUrl: string;
  status: PkksStatus;
  score: number;
  updatedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type EkskulType =
  | 'Pendidikan Karakter'
  | 'Digitalisasi Pembelajaran'
  | 'Kualitas Dapodik'
  | 'SPMI'
  | 'Analisis Daya Tampung';

export interface JabarBeraksiReport {
  id: string;
  title: string;
  ekskulType: EkskulType;
  coachName: string;
  activityDate: string;
  participantCount: number;
  description: string;
  characterOutcome: string;
  imageUrl: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  status: 'terverifikasi' | 'menunggu';
  authorUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type SilokaRole = 'Orang Tua Murid' | 'Masyarakat Sekitar' | 'Komite Sekolah';
export type SilokaCategory =
  | 'Akademik & KBM'
  | 'Sarana Prasarana'
  | 'Layanan Administrasi'
  | 'Keamanan & Lingkungan'
  | 'Saran & Masukan';
export type SilokaStatus = 'Diterima' | 'Diproses' | 'Selesai';

export interface SilokaComplaint {
  id: string;
  ticketCode: string;
  reporterUid: string;
  reporterName: string;
  reporterRole: SilokaRole;
  category: SilokaCategory;
  subject: string;
  description: string;
  status: SilokaStatus;
  adminResponse: string;
  respondedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type SilokaPillar =
  | 'Perencanaan'
  | 'Pengorganisasian'
  | 'Pelaksana'
  | 'Program Unggulan'
  | 'Evaluasi';

export interface SilokaItem {
  id: string;
  title: string;
  pillar: SilokaPillar;
  coordinator: string;
  periodDate: string;
  targetGroup: string;
  outcome: string;
  description: string;
  imageUrl: string;
  fileName: string;
  fileUrl: string;
  fileSize: string;
  status: 'terpublikasi' | 'draf';
  authorUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type StaffCategory = 'Guru' | 'Tenaga Kependidikan';
export type EmploymentStatus = 'PNS' | 'PPPK' | 'PPPK Paruh Waktu' | 'Honorer';

export interface StaffMember {
  id: string;
  fullName: string;
  nip: string;
  category: StaffCategory;
  role: string;
  assignment: string;
  rank: string;
  employmentStatus: EmploymentStatus;
  photoUrl: string;
  motto: string;
  sortOrder: number;
  updatedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}
