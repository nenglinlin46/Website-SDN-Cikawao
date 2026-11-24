import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ADMIN_EMAIL,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_GALLERY,
  INITIAL_JABAR_BERAKSI,
  INITIAL_NEWS,
  INITIAL_PKKS,
  INITIAL_SILOKA_ITEMS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  JABAR_BERAKSI_PILLARS,
  SCHOOL_IMAGES,
  SILOKA_PILLARS,
} from '../data/seedData';
import type { ParsedDaftarPdRow } from '../utils/daftarPdExcel';
import { hashNikSha256 } from '../utils/hashNik';
import type {
  Announcement,
  DelegatedAdminRole,
  GalleryItem,
  ItAdminSession,
  ItAdminStatus,
  JabarBeraksiReport,
  NewsArticle,
  NisnDirectoryEntry,
  ParentSubscription,
  PkksItem,
  RombelName,
  SilokaComplaint,
  SilokaItem,
  StaffMember,
  StudentLinkRequest,
  StudentRecord,
} from '../types';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  priority: 'mendesak' | 'penting' | 'info';
}

interface SchoolContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  isBootstrappedAdmin: boolean;
  isFirebaseAdmin: boolean;
  isItAdmin: boolean;
  itAdminSession: ItAdminSession | null;
  itAdminStatus: ItAdminStatus;
  delegatedAdmins: DelegatedAdminRole[];
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  refreshItAdminStatus: () => Promise<ItAdminStatus>;
  setupItAdmin: (phone: string, password: string) => Promise<void>;
  loginItAdmin: (phone: string, password: string) => Promise<void>;
  logoutItAdmin: () => Promise<void>;
  logout: () => Promise<void>;
  saveDelegatedAdmin: (data: {
    uid: string;
    email: string;
    name: string;
    roleLabel: string;
  }) => Promise<void>;
  removeDelegatedAdmin: (uid: string) => Promise<void>;

  news: NewsArticle[];
  announcements: Announcement[];
  gallery: GalleryItem[];
  inputtedGallery: GalleryItem[];
  pkksItems: PkksItem[];
  jabarBeraksi: JabarBeraksiReport[];
  silokaItems: SilokaItem[];
  staffMembers: StaffMember[];
  students: StudentRecord[];
  nisnDirectory: NisnDirectoryEntry[];
  linkRequests: StudentLinkRequest[];
  silokaComplaints: SilokaComplaint[];
  mySubscription: ParentSubscription | null;
  allSubscriptionsCount: number;

  usingFallbackData: boolean;
  seeding: boolean;
  seedAllInitialData: () => Promise<void>;

  activeToast: ToastNotification | null;
  dismissToast: () => void;
  unreadAnnouncementCount: number;
  markAnnouncementsRead: () => void;

  // CRUD Actions
  saveNews: (data: Omit<NewsArticle, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>, existingId?: string) => Promise<void>;
  removeNews: (id: string) => Promise<void>;

  saveAnnouncement: (
    data: Omit<Announcement, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;

  saveParentSubscription: (
    rombelFilter: 'Semua' | RombelName,
    browserPushEnabled: boolean,
    instantAlertEnabled: boolean
  ) => Promise<void>;

  saveGalleryItem: (
    data: Omit<GalleryItem, 'id' | 'authorUid' | 'createdAt'> & {
      videoChunks?: string[] | null;
    },
    existingId?: string
  ) => Promise<void>;
  removeGalleryItem: (id: string) => Promise<void>;
  resolveGalleryVideoUrl: (item: GalleryItem) => Promise<string>;

  saveStudent: (
    data: Omit<StudentRecord, 'id' | 'updatedByUid' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  importStudentsBulk: (rows: ParsedDaftarPdRow[]) => Promise<{ created: number; updated: number }>;
  removeStudent: (id: string) => Promise<void>;

  submitStudentLinkRequest: (data: {
    studentName: string;
    nisn: string;
    rombel: RombelName;
  }) => Promise<void>;
  resolveStudentLinkRequest: (req: StudentLinkRequest, action: 'approved' | 'rejected') => Promise<void>;

  savePkksItem: (
    data: Omit<PkksItem, 'id' | 'updatedByUid' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  removePkksItem: (id: string) => Promise<void>;

  saveJabarBeraksi: (
    data: Omit<JabarBeraksiReport, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  verifyJabarBeraksi: (id: string, status: 'terverifikasi' | 'menunggu') => Promise<void>;
  removeJabarBeraksi: (id: string) => Promise<void>;

  submitSilokaComplaint: (data: {
    reporterName: string;
    reporterRole: SilokaComplaint['reporterRole'];
    category: SilokaComplaint['category'];
    subject: string;
    description: string;
  }) => Promise<string>;
  respondSilokaComplaint: (
    id: string,
    status: SilokaComplaint['status'],
    adminResponse: string
  ) => Promise<void>;
  updateOwnSilokaComplaint: (id: string, subject: string, description: string) => Promise<void>;

  saveSilokaItem: (
    data: Omit<SilokaItem, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  removeSilokaItem: (id: string) => Promise<void>;

  saveStaffMember: (
    data: Omit<StaffMember, 'id' | 'updatedByUid' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => Promise<void>;
  removeStaffMember: (id: string) => Promise<void>;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`;
}

function dataUrlToBlobUrl(dataUrl: string, fallbackMime = 'video/mp4'): string {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl;
  const header = dataUrl.slice(0, commaIdx);
  const base64 = dataUrl.slice(commaIdx + 1);
  const mimeMatch = header.match(/data:([^;]+);base64/i);
  const mimeType = mimeMatch?.[1] || fallbackMime;
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

const FIRESTORE_ADMIN_LINK_REQUIRED_MSG =
  'Sesi Tim IT aktif, namun perubahan database cloud memerlukan akun Google yang terdaftar pada Admin Delegasi oleh Kepala Sekolah.';

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminDocExists, setAdminDocExists] = useState(false);
  const [delegatedAdmins, setDelegatedAdmins] = useState<DelegatedAdminRole[]>([]);
  const [itAdminSession, setItAdminSession] = useState<ItAdminSession | null>(null);
  const [itAdminStatus, setItAdminStatus] = useState<ItAdminStatus>({
    configured: false,
    mode: 'needs-setup',
    roleLabel: 'Tim IT SDN Cikawao',
  });

  const [liveNews, setLiveNews] = useState<NewsArticle[] | null>(null);
  const [liveAnnouncements, setLiveAnnouncements] = useState<Announcement[] | null>(null);
  const [liveGallery, setLiveGallery] = useState<GalleryItem[] | null>(null);
  const [livePkks, setLivePkks] = useState<PkksItem[] | null>(null);
  const [liveJabarBeraksi, setLiveJabarBeraksi] = useState<JabarBeraksiReport[] | null>(null);
  const [liveSilokaItems, setLiveSilokaItems] = useState<SilokaItem[] | null>(null);
  const [liveStaff, setLiveStaff] = useState<StaffMember[] | null>(null);

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [liveNisnDirectory, setLiveNisnDirectory] = useState<NisnDirectoryEntry[] | null>(null);
  const [fallbackNisnDirectory, setFallbackNisnDirectory] = useState<NisnDirectoryEntry[]>([]);
  const [linkRequests, setLinkRequests] = useState<StudentLinkRequest[]>([]);
  const [silokaComplaints, setSilokaComplaints] = useState<SilokaComplaint[]>([]);
  const [mySubscription, setMySubscription] = useState<ParentSubscription | null>(null);
  const [allSubscriptionsCount, setAllSubscriptionsCount] = useState(0);

  const [seeding, setSeeding] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);

  const seenAnnouncementIdsRef = useRef<Set<string>>(new Set());
  const initialAnnLoadRef = useRef(true);
  const autoSeededRef = useRef(false);
  const autoSyncedNisnIdsRef = useRef<Set<string>>(new Set());
  const resolvedVideoCacheRef = useRef<Map<string, string>>(new Map());

  const isBootstrappedAdmin = Boolean(
    user && user.emailVerified && user.email === ADMIN_EMAIL
  );
  const isFirebaseAdmin = isBootstrappedAdmin || adminDocExists;
  const isItAdmin = Boolean(itAdminSession);
  const isAdmin = isFirebaseAdmin || isItAdmin;

  const refreshItAdminStatus = useCallback(async (): Promise<ItAdminStatus> => {
    try {
      const res = await fetch('/api/it-admin/status', { cache: 'no-store' });
      if (!res.ok) {
        return itAdminStatus;
      }
      const data = (await res.json()) as Partial<ItAdminStatus>;
      const normalized: ItAdminStatus = {
        configured: Boolean(data.configured),
        mode:
          data.mode === 'env' || data.mode === 'claimed' || data.mode === 'needs-setup'
            ? data.mode
            : 'needs-setup',
        roleLabel: typeof data.roleLabel === 'string' && data.roleLabel ? data.roleLabel : 'Tim IT SDN Cikawao',
      };
      setItAdminStatus(normalized);
      return normalized;
    } catch {
      return itAdminStatus;
    }
  }, [itAdminStatus]);

  useEffect(() => {
    void refreshItAdminStatus();
    // Fetch initial Tim IT activation mode once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (!nextUser) {
        setAdminDocExists(false);
        setDelegatedAdmins([]);
        setStudents([]);
        setLinkRequests([]);
        setSilokaComplaints([]);
        setMySubscription(null);
        setAllSubscriptionsCount(0);
      }
    });
    return () => unsub();
  }, []);

  // Precompute fallback NISN directory hashes once for public view before Firestore seeding
  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      INITIAL_STUDENTS.map(async (s) => ({
        id: s.id,
        nisn: s.nisn,
        fullName: s.fullName,
        rombel: s.rombel,
        gender: s.gender,
        nikHash: await hashNikSha256(s.nik || ''),
        updatedByUid: s.updatedByUid,
      }))
    ).then((entries) => {
      if (!cancelled) {
        setFallbackNisnDirectory(entries);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Check /admins/{uid} when signed in & list delegated admins for bootstrapped principal
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setAdminDocExists(false);
      setDelegatedAdmins([]);
      return;
    }
    const adminRef = doc(db, 'admins', user.uid);
    const unsubSelf = onSnapshot(
      adminRef,
      (snap) => {
        setAdminDocExists(snap.exists());
      },
      () => {
        setAdminDocExists(false);
      }
    );

    let unsubList = () => {};
    if (isBootstrappedAdmin) {
      unsubList = onSnapshot(
        collection(db, 'admins'),
        (snap) => {
          const rows = snap.docs.map((d) => {
            const raw = d.data() as Partial<DelegatedAdminRole>;
            return {
              uid: raw.uid || d.id,
              email: raw.email || '',
              name: raw.name || '',
              roleLabel: raw.roleLabel || 'Tim IT SDN Cikawao',
              createdAt: raw.createdAt,
            };
          });
          setDelegatedAdmins(rows);
        },
        () => {
          setDelegatedAdmins([]);
        }
      );
    } else {
      setDelegatedAdmins([]);
    }

    return () => {
      unsubSelf();
      unsubList();
    };
  }, [authReady, user, isBootstrappedAdmin]);

  // Public & role-scoped listeners
  useEffect(() => {
    if (!authReady) return;

    const newsQ = isBootstrappedAdmin
      ? collection(db, 'news')
      : query(collection(db, 'news'), where('status', '==', 'published'));

    const unsubNews = onSnapshot(
      newsQ,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as NewsArticle);
        setLiveNews(items);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'news')
    );

    const annQ = isBootstrappedAdmin
      ? collection(db, 'announcements')
      : query(collection(db, 'announcements'), where('isActive', '==', true));

    const unsubAnn = onSnapshot(
      annQ,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
        setLiveAnnouncements(items);

        // Automatic notification dispatch on newly arrived active announcements
        if (initialAnnLoadRef.current) {
          items.forEach((a) => seenAnnouncementIdsRef.current.add(a.id));
          initialAnnLoadRef.current = false;
        } else {
          items.forEach((a) => {
            if (!seenAnnouncementIdsRef.current.has(a.id) && a.isActive && a.autoNotifyParents) {
              seenAnnouncementIdsRef.current.add(a.id);
              setActiveToast({
                id: a.id,
                title: a.title,
                message: a.message,
                priority: a.priority,
              });
              if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted'
              ) {
                try {
                  new Notification(`SDN Cikawao: ${a.title}`, { body: a.message });
                } catch {
                  // Ignore if browser environment blocks Notification constructor
                }
              }
            }
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'announcements')
    );

    const unsubGallery = onSnapshot(
      collection(db, 'gallery'),
      (snap) => {
        const normalized = snap.docs.map((d) => {
          const raw = d.data() as Partial<GalleryItem>;
          return {
            id: d.id,
            title: raw.title || '',
            category: raw.category || 'KBM',
            caption: raw.caption || '',
            mediaType: raw.mediaType === 'video' ? 'video' : 'image',
            imageUrl:
              d.id === 'gal-kampus-cikawao' && raw.imageUrl === SCHOOL_IMAGES.hero
                ? SCHOOL_IMAGES.campusGate
                : raw.imageUrl || '',
            videoUrl: raw.videoUrl || '',
            videoMimeType: raw.videoMimeType || '',
            videoFileName: raw.videoFileName || '',
            videoChunkCount: Number(raw.videoChunkCount || 0),
            takenDate: raw.takenDate || '',
            authorUid: raw.authorUid || 'seed-admin',
            createdAt: raw.createdAt,
          } as GalleryItem;
        });
        setLiveGallery(normalized);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'gallery')
    );

    const pkksSeedOrder = new Map(INITIAL_PKKS.map((item, idx) => [item.id, idx]));

    const unsubPkks = onSnapshot(
      collection(db, 'pkks_items'),
      (snap) => {
        const items = snap.docs.map((d) => {
          const raw = d.data() as Partial<PkksItem>;
          return {
            id: d.id,
            code: raw.code || '',
            component: raw.component || 'Manajerial',
            indicatorTitle: raw.indicatorTitle || '',
            evidenceSummary: raw.evidenceSummary || '',
            evidenceUrl: raw.evidenceUrl || '',
            status: raw.status || 'Dalam Proses',
            score: Number.isFinite(Number(raw.score)) ? Number(raw.score) : 0,
            updatedByUid: raw.updatedByUid || 'seed-admin',
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          } as PkksItem;
        });
        items.sort((a, b) => {
          const idxA = pkksSeedOrder.get(a.id);
          const idxB = pkksSeedOrder.get(b.id);
          if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
          if (idxA !== undefined) return -1;
          if (idxB !== undefined) return 1;

          const tsA =
            a.createdAt && typeof (a.createdAt as { toMillis?: () => number }).toMillis === 'function'
              ? (a.createdAt as { toMillis: () => number }).toMillis()
              : 0;
          const tsB =
            b.createdAt && typeof (b.createdAt as { toMillis?: () => number }).toMillis === 'function'
              ? (b.createdAt as { toMillis: () => number }).toMillis()
              : 0;
          if (tsA !== tsB) return tsA - tsB;

          return a.id.localeCompare(b.id);
        });
        setLivePkks(items);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'pkks_items')
    );

    const jbQ = isBootstrappedAdmin
      ? collection(db, 'jabar_beraksi')
      : query(collection(db, 'jabar_beraksi'), where('status', '==', 'terverifikasi'));

    const unsubJb = onSnapshot(
      jbQ,
      (snap) => {
        const allowedPillars = new Set<string>(JABAR_BERAKSI_PILLARS);
        const normalized = snap.docs.map((d) => {
          const raw = d.data() as Partial<JabarBeraksiReport>;
          const rawCategory = String(raw.ekskulType || '');
          const normalizedCategory = allowedPillars.has(rawCategory)
            ? (rawCategory as JabarBeraksiReport['ekskulType'])
            : 'Pendidikan Karakter';
          return {
            id: d.id,
            title: raw.title || '',
            ekskulType: normalizedCategory,
            coachName: raw.coachName || 'Tim Pengelola SDN Cikawao',
            activityDate: raw.activityDate || '',
            participantCount: Number(raw.participantCount || 1),
            description: raw.description || '',
            characterOutcome: raw.characterOutcome || '',
            imageUrl: raw.imageUrl || '',
            fileName: raw.fileName || '',
            fileUrl: raw.fileUrl || '',
            fileSize: raw.fileSize || '',
            status: raw.status === 'menunggu' ? 'menunggu' : 'terverifikasi',
            authorUid: raw.authorUid || 'seed-admin',
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          } as JabarBeraksiReport;
        });
        setLiveJabarBeraksi(normalized);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'jabar_beraksi')
    );

    const unsubStaff = onSnapshot(
      collection(db, 'staff'),
      (snap) => {
        const seedById = new Map(INITIAL_STAFF.map((s) => [s.id, s]));
        const items = snap.docs.map((d) => {
          const raw = d.data() as Partial<StaffMember>;
          const seedFallback = seedById.get(d.id);
          return {
            id: d.id,
            fullName: raw.fullName || seedFallback?.fullName || '',
            nip: raw.nip ?? seedFallback?.nip ?? '-',
            category: raw.category || seedFallback?.category || 'Guru',
            role: raw.role || seedFallback?.role || '',
            assignment: raw.assignment ?? seedFallback?.assignment ?? '',
            rank: raw.rank ?? seedFallback?.rank ?? '',
            employmentStatus: raw.employmentStatus || seedFallback?.employmentStatus || 'PNS',
            photoUrl: raw.photoUrl ?? seedFallback?.photoUrl ?? '',
            motto: raw.motto ?? seedFallback?.motto ?? '',
            sortOrder: Number(raw.sortOrder ?? seedFallback?.sortOrder ?? 99),
            updatedByUid: raw.updatedByUid || 'seed-admin',
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          } as StaffMember;
        });
        items.sort((a, b) => a.sortOrder - b.sortOrder || a.fullName.localeCompare(b.fullName));
        setLiveStaff(items);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'staff')
    );

    const silokaItemsQ = isBootstrappedAdmin
      ? collection(db, 'siloka_items')
      : query(collection(db, 'siloka_items'), where('status', '==', 'terpublikasi'));

    const unsubSilokaItems = onSnapshot(
      silokaItemsQ,
      (snap) => {
        const allowedPillars = new Set<string>(SILOKA_PILLARS);
        const items = snap.docs.map((d) => {
          const raw = d.data() as Partial<SilokaItem>;
          const rawPillar = String(raw.pillar || '');
          const normalizedPillar = allowedPillars.has(rawPillar)
            ? (rawPillar as SilokaItem['pillar'])
            : 'Perencanaan';
          return {
            id: d.id,
            title: raw.title || '',
            pillar: normalizedPillar,
            coordinator: raw.coordinator || 'Tim Pengelola SDN Cikawao',
            periodDate: raw.periodDate || '',
            targetGroup: raw.targetGroup || '',
            outcome: raw.outcome || '',
            description: raw.description || '',
            imageUrl: raw.imageUrl || '',
            fileName: raw.fileName || '',
            fileUrl: raw.fileUrl || '',
            fileSize: raw.fileSize || '',
            status: raw.status === 'draf' ? 'draf' : 'terpublikasi',
            authorUid: raw.authorUid || 'seed-admin',
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          } as SilokaItem;
        });
        setLiveSilokaItems(items);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'siloka_items')
    );

    const unsubNisnDirectory = onSnapshot(
      collection(db, 'nisn_directory'),
      (snap) => {
        const items = snap.docs.map((d) => {
          const raw = d.data() as Partial<NisnDirectoryEntry>;
          return {
            id: d.id,
            nisn: String(raw.nisn || ''),
            fullName: String(raw.fullName || ''),
            rombel: (raw.rombel || 'Kelas 1') as RombelName,
            gender: raw.gender === 'P' ? 'P' : 'L',
            nikHash: String(raw.nikHash || ''),
            updatedByUid: String(raw.updatedByUid || 'seed-admin'),
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          } as NisnDirectoryEntry;
        });
        items.sort((a, b) => a.rombel.localeCompare(b.rombel) || a.fullName.localeCompare(b.fullName));
        setLiveNisnDirectory(items);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'nisn_directory')
    );

    return () => {
      unsubNews();
      unsubAnn();
      unsubGallery();
      unsubPkks();
      unsubJb();
      unsubStaff();
      unsubSilokaItems();
      unsubNisnDirectory();
    };
  }, [authReady, isBootstrappedAdmin]);

  // Authenticated PII & private listeners
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || !user.email) return;

    const stuQ = isBootstrappedAdmin
      ? collection(db, 'students')
      : query(collection(db, 'students'), where('parentEmail', '==', user.email));

    const unsubStudents = onSnapshot(
      stuQ,
      (snap) => {
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudentRecord));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'students')
    );

    const linkQ = isBootstrappedAdmin
      ? collection(db, 'student_link_requests')
      : query(collection(db, 'student_link_requests'), where('requesterUid', '==', user.uid));

    const unsubLinks = onSnapshot(
      linkQ,
      (snap) => {
        setLinkRequests(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StudentLinkRequest)
        );
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'student_link_requests')
    );

    const silokaQ = isBootstrappedAdmin
      ? collection(db, 'siloka_complaints')
      : query(collection(db, 'siloka_complaints'), where('reporterUid', '==', user.uid));

    const unsubSiloka = onSnapshot(
      silokaQ,
      (snap) => {
        setSilokaComplaints(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SilokaComplaint)
        );
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'siloka_complaints')
    );

    const unsubMySub = onSnapshot(
      doc(db, 'parent_subscriptions', user.uid),
      (snap) => {
        if (snap.exists()) {
          setMySubscription(snap.data() as ParentSubscription);
        } else {
          setMySubscription(null);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `parent_subscriptions/${user.uid}`)
    );

    let unsubAllSubs = () => {};
    if (isBootstrappedAdmin) {
      unsubAllSubs = onSnapshot(
        collection(db, 'parent_subscriptions'),
        (snap) => setAllSubscriptionsCount(snap.size),
        (err) => handleFirestoreError(err, OperationType.GET, 'parent_subscriptions')
      );
    }

    return () => {
      unsubStudents();
      unsubLinks();
      unsubSiloka();
      unsubMySub();
      unsubAllSubs();
    };
  }, [authReady, user, isBootstrappedAdmin]);

  const requireFirebaseAdmin = useCallback(() => {
    if (!user || !isFirebaseAdmin) {
      if (isItAdmin) {
        throw new Error(FIRESTORE_ADMIN_LINK_REQUIRED_MSG);
      }
      throw new Error('Silakan masuk sebagai Admin terlebih dahulu untuk menyimpan perubahan.');
    }
  }, [user, isFirebaseAdmin, isItAdmin]);

  const seedAllInitialData = useCallback(async () => {
    requireFirebaseAdmin();
    if (!user) return;
    setSeeding(true);
    try {
      const [
        adminSnap,
        newsSnap,
        annSnap,
        galSnap,
        pkksSnap,
        jbSnap,
        silokaSnap,
        stuSnap,
        nisnDirSnap,
        staffSnap,
      ] = await Promise.all([
        getDoc(doc(db, 'admins', user.uid)),
        getDocs(collection(db, 'news')),
        getDocs(collection(db, 'announcements')),
        getDocs(collection(db, 'gallery')),
        getDocs(collection(db, 'pkks_items')),
        getDocs(collection(db, 'jabar_beraksi')),
        getDocs(collection(db, 'siloka_items')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'nisn_directory')),
        getDocs(collection(db, 'staff')),
      ]);

      const seedNisnHashes = await Promise.all(
        INITIAL_STUDENTS.map((item) => hashNikSha256(item.nik || ''))
      );

      const existingNewsIds = new Set(newsSnap.docs.map((d) => d.id));
      const existingAnnIds = new Set(annSnap.docs.map((d) => d.id));
      const existingGalIds = new Set(galSnap.docs.map((d) => d.id));
      const existingPkksIds = new Set(pkksSnap.docs.map((d) => d.id));
      const existingJbIds = new Set(jbSnap.docs.map((d) => d.id));
      const existingSilokaIds = new Set(silokaSnap.docs.map((d) => d.id));
      const existingStuIds = new Set(stuSnap.docs.map((d) => d.id));
      const existingNisnDirIds = new Set(nisnDirSnap.docs.map((d) => d.id));
      const existingStaffIds = new Set(staffSnap.docs.map((d) => d.id));

      const batch = writeBatch(db);
      const ts = serverTimestamp();

      // Ensure admin role doc exists or update mutable profile fields
      if (adminSnap.exists()) {
        batch.update(doc(db, 'admins', user.uid), {
          email: user.email || ADMIN_EMAIL,
          name: 'Neng Linlin Irmawati, S.Pd.',
          roleLabel: 'Kepala Sekolah SDN Cikawao',
        });
      } else {
        batch.set(doc(db, 'admins', user.uid), {
          uid: user.uid,
          email: user.email || ADMIN_EMAIL,
          name: 'Neng Linlin Irmawati, S.Pd.',
          roleLabel: 'Kepala Sekolah SDN Cikawao',
          createdAt: ts,
        });
      }

      const legacyNewsIds = [
        'news-jabar-beraksi-angklung',
        'news-kurikulum-merdeka-p5',
        'news-pojok-baca-literasi',
      ];
      legacyNewsIds.forEach((legacyId) => {
        if (existingNewsIds.has(legacyId)) {
          batch.delete(doc(db, 'news', legacyId));
        }
      });

      INITIAL_NEWS.forEach((item) => {
        const { id, authorUid: _ignored, ...rest } = item;
        const ref = doc(db, 'news', id);
        if (existingNewsIds.has(id)) {
          batch.update(ref, {
            ...rest,
            updatedAt: ts,
          });
        } else {
          batch.set(ref, {
            ...rest,
            authorUid: user.uid,
            createdAt: ts,
            updatedAt: ts,
          });
        }
      });

      INITIAL_ANNOUNCEMENTS.forEach((item) => {
        const { id, authorUid: _ignored, ...rest } = item;
        const ref = doc(db, 'announcements', id);
        if (existingAnnIds.has(id)) {
          batch.update(ref, {
            ...rest,
            updatedAt: ts,
          });
        } else {
          batch.set(ref, {
            ...rest,
            authorUid: user.uid,
            createdAt: ts,
            updatedAt: ts,
          });
        }
      });

      const legacyGalleryIds = ['gal-pramuka-angklung'];
      legacyGalleryIds.forEach((legacyId) => {
        if (existingGalIds.has(legacyId)) {
          batch.delete(doc(db, 'gallery', legacyId));
        }
      });

      INITIAL_GALLERY.forEach((item) => {
        const { id, authorUid: _ignored, ...rest } = item;
        const ref = doc(db, 'gallery', id);
        if (existingGalIds.has(id)) {
          batch.update(ref, {
            ...rest,
          });
        } else {
          batch.set(ref, {
            ...rest,
            authorUid: user.uid,
            createdAt: ts,
          });
        }
      });

      INITIAL_PKKS.forEach((item) => {
        const { id, updatedByUid: _ignored, ...rest } = item;
        const ref = doc(db, 'pkks_items', id);
        if (existingPkksIds.has(id)) {
          batch.update(ref, {
            ...rest,
            updatedByUid: user.uid,
            updatedAt: ts,
          });
        } else {
          batch.set(ref, {
            ...rest,
            updatedByUid: user.uid,
            createdAt: ts,
            updatedAt: ts,
          });
        }
      });

      const legacyJbIds = ['jb-angklung-sunda', 'jb-pramuka-siaga', 'jb-literasi-uks'];
      legacyJbIds.forEach((legacyId) => {
        if (existingJbIds.has(legacyId)) {
          batch.delete(doc(db, 'jabar_beraksi', legacyId));
        }
      });

      INITIAL_JABAR_BERAKSI.forEach((item) => {
        const { id, authorUid: _ignored, ...rest } = item;
        const ref = doc(db, 'jabar_beraksi', id);
        if (existingJbIds.has(id)) {
          batch.update(ref, {
            ...rest,
            updatedAt: ts,
          });
        } else {
          batch.set(ref, {
            ...rest,
            authorUid: user.uid,
            createdAt: ts,
            updatedAt: ts,
          });
        }
      });

      INITIAL_SILOKA_ITEMS.forEach((item) => {
        const { id, authorUid: _ignored, ...rest } = item;
        const ref = doc(db, 'siloka_items', id);
        if (existingSilokaIds.has(id)) {
          batch.update(ref, {
            ...rest,
            updatedAt: ts,
          });
        } else {
          batch.set(ref, {
            ...rest,
            authorUid: user.uid,
            createdAt: ts,
            updatedAt: ts,
          });
        }
      });

      INITIAL_STUDENTS.forEach((item, idx) => {
        const { id, updatedByUid: _ignored, ...rest } = item;
        const nikClean = (item.nik || '').replace(/\D/g, '').slice(0, 20);
        const ref = doc(db, 'students', id);
        if (existingStuIds.has(id)) {
          batch.update(ref, {
            ...rest,
            nik: nikClean,
            updatedByUid: user.uid,
            updatedAt: ts,
          });
        } else {
          batch.set(ref, {
            ...rest,
            nik: nikClean,
            updatedByUid: user.uid,
            createdAt: ts,
            updatedAt: ts,
          });
        }

        const dirRef = doc(db, 'nisn_directory', id);
        const dirPayload = {
          nisn: item.nisn,
          fullName: item.fullName,
          rombel: item.rombel,
          gender: item.gender,
          nikHash: seedNisnHashes[idx],
          updatedByUid: user.uid,
          updatedAt: ts,
        };
        if (existingNisnDirIds.has(id)) {
          batch.update(dirRef, dirPayload);
        } else {
          batch.set(dirRef, {
            ...dirPayload,
            createdAt: ts,
          });
        }
      });

      INITIAL_STAFF.forEach((item) => {
        const { id, updatedByUid: _ignored, ...rest } = item;
        const ref = doc(db, 'staff', id);
        if (existingStaffIds.has(id)) {
          batch.update(ref, {
            ...rest,
            updatedByUid: user.uid,
            updatedAt: ts,
          });
        } else {
          batch.set(ref, {
            ...rest,
            updatedByUid: user.uid,
            createdAt: ts,
            updatedAt: ts,
          });
        }
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch_seed');
    } finally {
      setSeeding(false);
    }
  }, [user, requireFirebaseAdmin]);

  // Auto-seed once when Admin logs in and Firestore collections are empty
  useEffect(() => {
    if (
      isBootstrappedAdmin &&
      !autoSeededRef.current &&
      liveNews !== null &&
      liveNews.length === 0 &&
      livePkks !== null &&
      livePkks.length === 0
    ) {
      autoSeededRef.current = true;
      void seedAllInitialData();
    }
  }, [isBootstrappedAdmin, liveNews, livePkks, seedAllInitialData]);

  // Auto-cleanup removed legacy news & gallery seed docs from Firestore when Admin is online
  useEffect(() => {
    if (!isBootstrappedAdmin) return;
    const legacyNewsToRemove = [
      'news-jabar-beraksi-angklung',
      'news-kurikulum-merdeka-p5',
      'news-pojok-baca-literasi',
    ];
    legacyNewsToRemove.forEach((legacyId) => {
      if (liveNews?.some((n) => n.id === legacyId)) {
        void deleteDoc(doc(db, 'news', legacyId)).catch(() => {});
      }
    });
    if (liveGallery?.some((g) => g.id === 'gal-pramuka-angklung')) {
      void deleteDoc(doc(db, 'gallery', 'gal-pramuka-angklung')).catch(() => {});
    }
  }, [isBootstrappedAdmin, liveNews, liveGallery]);

  // Backfill public nisn_directory whenever admin has students not yet indexed
  useEffect(() => {
    if (!isBootstrappedAdmin || !user || liveNisnDirectory === null || students.length === 0) {
      return;
    }
    const existingDirIds = new Set(liveNisnDirectory.map((entry) => entry.id));
    const missingStudents = students.filter(
      (s) =>
        s.nisn &&
        s.fullName &&
        !existingDirIds.has(s.id) &&
        !autoSyncedNisnIdsRef.current.has(s.id)
    );
    if (missingStudents.length === 0) return;

    missingStudents.forEach((s) => autoSyncedNisnIdsRef.current.add(s.id));

    void (async () => {
      try {
        const chunkSize = 150;
        for (let i = 0; i < missingStudents.length; i += chunkSize) {
          const chunk = missingStudents.slice(i, i + chunkSize);
          const hashes = await Promise.all(
            chunk.map((s) => hashNikSha256(s.nik || ''))
          );
          const batch = writeBatch(db);
          const ts = serverTimestamp();
          chunk.forEach((s, idx) => {
            const dirRef = doc(db, 'nisn_directory', s.id);
            batch.set(dirRef, {
              nisn: s.nisn.replace(/\D/g, '').slice(0, 20),
              fullName: s.fullName.slice(0, 120),
              rombel: s.rombel,
              gender: s.gender,
              nikHash: hashes[idx],
              updatedByUid: user.uid,
              createdAt: ts,
              updatedAt: ts,
            });
          });
          await batch.commit();
        }
      } catch {
        // Ignore transient sync error; next admin save/import will sync remaining entries
      }
    })();
  }, [isBootstrappedAdmin, user, students, liveNisnDirectory]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signInWithGoogle = useCallback(async () => {
    if (authLoading) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed or superseded the Google sign-in popup; treat as normal cancellation.
        return;
      }
      if (code === 'auth/popup-blocked') {
        setAuthError(
          'Jendela login Google diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba masuk kembali.'
        );
      } else if (code === 'auth/network-request-failed') {
        setAuthError(
          'Koneksi internet terputus saat membuka login Google. Periksa jaringan Anda lalu coba lagi.'
        );
      } else {
        setAuthError('Login Google belum berhasil diproses. Silakan coba kembali.');
      }
    } finally {
      setAuthLoading(false);
    }
  }, [authLoading]);

  const setupItAdmin = useCallback(async (phone: string, password: string) => {
    setAuthError(null);
    const res = await fetch('/api/it-admin/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      token?: string;
      session?: { roleLabel?: string; phoneMasked?: string };
    };
    if (!res.ok || !payload.token || !payload.session) {
      throw new Error(payload.error || 'Gagal mengaktifkan akses Tim IT.');
    }
    const roleLabel = payload.session.roleLabel || 'Tim IT SDN Cikawao';
    setItAdminSession({
      token: payload.token,
      roleLabel,
      phoneMasked: payload.session.phoneMasked || '',
    });
    setItAdminStatus({
      configured: true,
      mode: 'claimed',
      roleLabel,
    });
  }, []);

  const loginItAdmin = useCallback(async (phone: string, password: string) => {
    setAuthError(null);
    const res = await fetch('/api/it-admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const payload = (await res.json().catch(() => ({}))) as {
      error?: string;
      token?: string;
      session?: { roleLabel?: string; phoneMasked?: string };
    };
    if (!res.ok || !payload.token || !payload.session) {
      throw new Error(payload.error || 'Nomor HP atau kata sandi Tim IT tidak sesuai.');
    }
    setItAdminSession({
      token: payload.token,
      roleLabel: payload.session.roleLabel || 'Tim IT SDN Cikawao',
      phoneMasked: payload.session.phoneMasked || '',
    });
  }, []);

  const logoutItAdmin = useCallback(async () => {
    const token = itAdminSession?.token;
    setItAdminSession(null);
    if (token) {
      await fetch('/api/it-admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  }, [itAdminSession]);

  const logout = useCallback(async () => {
    try {
      await logoutItAdmin();
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch {
      setAuthError('Gagal keluar dari akun. Silakan muat ulang halaman.');
    }
  }, [logoutItAdmin]);

  const saveDelegatedAdmin: SchoolContextValue['saveDelegatedAdmin'] = async (data) => {
    if (!user || !isBootstrappedAdmin) {
      throw new Error('Hanya akun Kepala Sekolah yang dapat mengelola akses Admin Delegasi.');
    }
    const cleanUid = data.uid.trim();
    const cleanEmail = data.email.trim().slice(0, 180);
    const cleanName = data.name.trim().slice(0, 120);
    const cleanRoleLabel = data.roleLabel.trim().slice(0, 80) || 'Tim IT SDN Cikawao';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(cleanUid)) {
      throw new Error('Format UID Google tidak valid.');
    }
    if (cleanEmail.length < 5 || !cleanEmail.includes('@')) {
      throw new Error('Masukkan alamat email Google yang valid.');
    }
    if (cleanName.length < 2) {
      throw new Error('Nama administrator minimal 2 karakter.');
    }

    const ref = doc(db, 'admins', cleanUid);
    const snap = await getDoc(ref);
    try {
      if (snap.exists()) {
        await updateDoc(ref, {
          email: cleanEmail,
          name: cleanName,
          roleLabel: cleanRoleLabel,
        });
      } else {
        await setDoc(ref, {
          uid: cleanUid,
          email: cleanEmail,
          name: cleanName,
          roleLabel: cleanRoleLabel,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${cleanUid}`);
    }
  };

  const removeDelegatedAdmin = async (uid: string) => {
    if (!user || !isBootstrappedAdmin) {
      throw new Error('Hanya akun Kepala Sekolah yang dapat menghapus akses Admin Delegasi.');
    }
    if (uid === user.uid) {
      throw new Error('Tidak dapat menghapus akun Kepala Sekolah utama.');
    }
    try {
      await deleteDoc(doc(db, 'admins', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `admins/${uid}`);
    }
  };

  // Strictly show only inputted news (excluding removed seed articles)
  const news = useMemo(() => {
    if (!liveNews || liveNews.length === 0) return [];
    const removedSeedNews = new Set([
      'news-jabar-beraksi-angklung',
      'news-kurikulum-merdeka-p5',
      'news-pojok-baca-literasi',
    ]);
    return liveNews.filter((item) => !removedSeedNews.has(item.id));
  }, [liveNews]);

  const announcements = useMemo(() => {
    if (liveAnnouncements && liveAnnouncements.length > 0) return liveAnnouncements;
    return INITIAL_ANNOUNCEMENTS as Announcement[];
  }, [liveAnnouncements]);

  const gallery = useMemo(() => {
    const source = liveGallery && liveGallery.length > 0 ? liveGallery : (INITIAL_GALLERY as GalleryItem[]);
    return source.filter((item) => item.id !== 'gal-pramuka-angklung');
  }, [liveGallery]);

  const seedGalleryById = useMemo(
    () => new Map(INITIAL_GALLERY.map((item) => [item.id, item])),
    []
  );

  const inputtedGallery = useMemo(() => {
    if (!liveGallery || liveGallery.length === 0) return [];
    return liveGallery.filter((item) => {
      if (item.id === 'gal-pramuka-angklung') return false;
      const seed = seedGalleryById.get(item.id);
      if (!seed) return true;
      return (
        item.title !== seed.title ||
        item.caption !== seed.caption ||
        item.imageUrl !== seed.imageUrl ||
        (item.videoUrl || '') !== (seed.videoUrl || '') ||
        item.takenDate !== seed.takenDate
      );
    });
  }, [liveGallery, seedGalleryById]);

  const pkksItems = useMemo(() => {
    if (livePkks && livePkks.length > 0) return livePkks;
    return INITIAL_PKKS as PkksItem[];
  }, [livePkks]);

  const jabarBeraksi = useMemo(() => {
    if (liveJabarBeraksi && liveJabarBeraksi.length > 0) return liveJabarBeraksi;
    return INITIAL_JABAR_BERAKSI as JabarBeraksiReport[];
  }, [liveJabarBeraksi]);

  const silokaItems = useMemo(() => {
    if (liveSilokaItems && liveSilokaItems.length > 0) return liveSilokaItems;
    return INITIAL_SILOKA_ITEMS as SilokaItem[];
  }, [liveSilokaItems]);

  const staffMembers = useMemo(() => {
    if (liveStaff && liveStaff.length > 0) return liveStaff;
    return INITIAL_STAFF as StaffMember[];
  }, [liveStaff]);

  const nisnDirectory = useMemo(() => {
    if (liveNisnDirectory && liveNisnDirectory.length > 0) return liveNisnDirectory;
    return fallbackNisnDirectory;
  }, [liveNisnDirectory, fallbackNisnDirectory]);

  const usingFallbackData = Boolean(
    liveNews !== null && liveNews.length === 0 && livePkks !== null && livePkks.length === 0
  );

  // --- CRUD Handlers ---
  const saveNews: SchoolContextValue['saveNews'] = async (data, existingId) => {
    requireFirebaseAdmin();
    if (!user) return;
    const id = existingId || makeId('news');
    const path = `news/${id}`;
    try {
      if (existingId && liveNews?.some((n) => n.id === existingId)) {
        await updateDoc(doc(db, 'news', existingId), {
          title: data.title.slice(0, 160),
          category: data.category,
          summary: data.summary.slice(0, 360),
          content: data.content.slice(0, 8000),
          imageUrl: data.imageUrl.slice(0, 500),
          authorName: data.authorName.slice(0, 120),
          status: data.status,
          publishedDate: data.publishedDate.slice(0, 40),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'news', id), {
          title: data.title.slice(0, 160),
          category: data.category,
          summary: data.summary.slice(0, 360),
          content: data.content.slice(0, 8000),
          imageUrl: data.imageUrl.slice(0, 500),
          authorName: data.authorName.slice(0, 120),
          authorUid: user.uid,
          status: data.status,
          publishedDate: data.publishedDate.slice(0, 40),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const removeNews = async (id: string) => {
    requireFirebaseAdmin();
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `news/${id}`);
    }
  };

  const saveAnnouncement: SchoolContextValue['saveAnnouncement'] = async (data, existingId) => {
    requireFirebaseAdmin();
    if (!user) return;
    const id = existingId || makeId('ann');
    try {
      if (existingId && liveAnnouncements?.some((a) => a.id === existingId)) {
        await updateDoc(doc(db, 'announcements', existingId), {
          title: data.title.slice(0, 160),
          message: data.message.slice(0, 2000),
          priority: data.priority,
          targetAudience: data.targetAudience,
          isActive: data.isActive,
          autoNotifyParents: data.autoNotifyParents,
          authorName: data.authorName.slice(0, 120),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'announcements', id), {
          title: data.title.slice(0, 160),
          message: data.message.slice(0, 2000),
          priority: data.priority,
          targetAudience: data.targetAudience,
          isActive: data.isActive,
          autoNotifyParents: data.autoNotifyParents,
          authorUid: user.uid,
          authorName: data.authorName.slice(0, 120),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `announcements/${id}`);
    }
  };

  const removeAnnouncement = async (id: string) => {
    requireFirebaseAdmin();
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `announcements/${id}`);
    }
  };

  const saveParentSubscription: SchoolContextValue['saveParentSubscription'] = async (
    rombelFilter,
    browserPushEnabled,
    instantAlertEnabled
  ) => {
    if (!user || !user.email) return;
    const path = `parent_subscriptions/${user.uid}`;
    try {
      if (mySubscription) {
        await updateDoc(doc(db, 'parent_subscriptions', user.uid), {
          parentName: (user.displayName || 'Orang Tua Murid').slice(0, 120),
          rombelFilter,
          browserPushEnabled,
          instantAlertEnabled,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'parent_subscriptions', user.uid), {
          uid: user.uid,
          parentName: (user.displayName || 'Orang Tua Murid').slice(0, 120),
          email: user.email.slice(0, 180),
          rombelFilter,
          browserPushEnabled,
          instantAlertEnabled,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const clearGalleryVideoChunks = async (galleryId: string) => {
    const chunksSnap = await getDocs(collection(db, 'gallery', galleryId, 'video_chunks'));
    if (chunksSnap.empty) return;
    for (let i = 0; i < chunksSnap.docs.length; i += 20) {
      const batch = writeBatch(db);
      chunksSnap.docs.slice(i, i + 20).forEach((chunkDoc) => {
        batch.delete(chunkDoc.ref);
      });
      await batch.commit();
    }
  };

  const invalidateCachedVideo = (galleryId: string) => {
    Array.from(resolvedVideoCacheRef.current.keys()).forEach((key) => {
      if (key.startsWith(`${galleryId}:`)) {
        const cached = resolvedVideoCacheRef.current.get(key);
        if (cached && cached.startsWith('blob:')) {
          URL.revokeObjectURL(cached);
        }
        resolvedVideoCacheRef.current.delete(key);
      }
    });
  };

  const saveGalleryItem: SchoolContextValue['saveGalleryItem'] = async (data, existingId) => {
    requireFirebaseAdmin();
    if (!user) return;
    const id = existingId || makeId('gal');
    const path = `gallery/${id}`;
    const hasNewChunks = Array.isArray(data.videoChunks) && data.videoChunks.length > 0;
    const nextChunkCount = hasNewChunks
      ? data.videoChunks!.length
      : data.videoChunks === null
      ? 0
      : Math.max(0, Math.min(80, Number(data.videoChunkCount || 0)));

    const payload = {
      title: data.title.trim().slice(0, 140),
      category: data.category,
      caption: data.caption.trim().slice(0, 400),
      mediaType: data.mediaType === 'video' ? ('video' as const) : ('image' as const),
      imageUrl: data.imageUrl.trim().slice(0, 120000),
      videoUrl: hasNewChunks ? '' : (data.videoUrl || '').trim().slice(0, 750000),
      videoMimeType: (data.videoMimeType || '').trim().slice(0, 80),
      videoFileName: (data.videoFileName || '').trim().slice(0, 200),
      videoChunkCount: nextChunkCount,
      takenDate: data.takenDate.trim().slice(0, 40),
    };

    try {
      invalidateCachedVideo(id);
      const hasLiveGallery = Boolean(liveGallery && liveGallery.length > 0);
      if (!hasLiveGallery) {
        const batch = writeBatch(db);
        const ts = serverTimestamp();
        let replacedExisting = false;
        INITIAL_GALLERY.forEach((seedItem) => {
          const { id: seedId, authorUid: _ignored, ...seedRest } = seedItem;
          const ref = doc(db, 'gallery', seedId);
          if (existingId && seedId === existingId) {
            replacedExisting = true;
            batch.set(ref, {
              ...payload,
              authorUid: user.uid,
              createdAt: ts,
            });
          } else {
            batch.set(ref, {
              ...seedRest,
              authorUid: user.uid,
              createdAt: ts,
            });
          }
        });
        if (!replacedExisting) {
          batch.set(doc(db, 'gallery', id), {
            ...payload,
            authorUid: user.uid,
            createdAt: ts,
          });
        }
        await batch.commit();
      } else if (existingId && liveGallery?.some((g) => g.id === existingId)) {
        await updateDoc(doc(db, 'gallery', existingId), payload);
      } else {
        await setDoc(doc(db, 'gallery', id), {
          ...payload,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
        });
      }

      if (data.videoChunks !== undefined) {
        await clearGalleryVideoChunks(id);
        if (hasNewChunks) {
          const chunks = data.videoChunks!;
          for (let i = 0; i < chunks.length; i += 4) {
            const batch = writeBatch(db);
            const slice = chunks.slice(i, i + 4);
            slice.forEach((chunkData, offset) => {
              const chunkIdx = i + offset;
              batch.set(doc(db, 'gallery', id, 'video_chunks', `chunk_${chunkIdx}`), {
                chunkIndex: chunkIdx,
                data: chunkData,
                authorUid: user.uid,
                createdAt: serverTimestamp(),
              });
            });
            await batch.commit();
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const removeGalleryItem = async (id: string) => {
    requireFirebaseAdmin();
    if (!user) return;
    const path = `gallery/${id}`;
    try {
      invalidateCachedVideo(id);
      const hasLiveGallery = Boolean(liveGallery && liveGallery.length > 0);
      if (!hasLiveGallery) {
        const remaining = INITIAL_GALLERY.filter((g) => g.id !== id);
        if (remaining.length > 0) {
          const batch = writeBatch(db);
          const ts = serverTimestamp();
          remaining.forEach((seedItem) => {
            const { id: seedId, authorUid: _ignored, ...seedRest } = seedItem;
            batch.set(doc(db, 'gallery', seedId), {
              ...seedRest,
              authorUid: user.uid,
              createdAt: ts,
            });
          });
          await batch.commit();
        }
        return;
      }

      await clearGalleryVideoChunks(id);
      await deleteDoc(doc(db, 'gallery', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const resolveGalleryVideoUrl = useCallback(async (item: GalleryItem): Promise<string> => {
    const cacheKey = `${item.id}:${item.videoChunkCount || 0}:${item.videoUrl?.slice(0, 32) || ''}`;
    const existingCached = resolvedVideoCacheRef.current.get(cacheKey);
    if (existingCached) return existingCached;

    if (item.videoUrl) {
      if (item.videoUrl.startsWith('data:video/')) {
        const blobUrl = dataUrlToBlobUrl(item.videoUrl, item.videoMimeType || 'video/mp4');
        resolvedVideoCacheRef.current.set(cacheKey, blobUrl);
        return blobUrl;
      }
      return item.videoUrl;
    }

    if ((item.videoChunkCount || 0) > 0) {
      const snap = await getDocs(collection(db, 'gallery', item.id, 'video_chunks'));
      const sorted = snap.docs
        .map((d) => ({
          chunkIndex: Number(d.data().chunkIndex ?? 0),
          data: String(d.data().data ?? ''),
        }))
        .sort((a, b) => a.chunkIndex - b.chunkIndex);
      const fullDataUrl = sorted.map((c) => c.data).join('');
      if (!fullDataUrl) {
        throw new Error('Data video belum tersedia.');
      }
      const blobUrl = dataUrlToBlobUrl(fullDataUrl, item.videoMimeType || 'video/mp4');
      resolvedVideoCacheRef.current.set(cacheKey, blobUrl);
      return blobUrl;
    }

    return '';
  }, []);

  const saveStudent: SchoolContextValue['saveStudent'] = async (data, existingId) => {
    requireFirebaseAdmin();
    if (!user) return;
    const nisnClean = data.nisn.replace(/\D/g, '').slice(0, 20);
    const nikClean = (data.nik || '').replace(/\D/g, '').slice(0, 20);
    const id = existingId || `stu-${nisnClean}`;
    try {
      const stuRef = doc(db, 'students', id);
      const dirRef = doc(db, 'nisn_directory', id);
      const [existingSnap, dirSnap, nikHash] = await Promise.all([
        existingId ? Promise.resolve(null) : getDoc(stuRef),
        getDoc(dirRef),
        hashNikSha256(nikClean),
      ]);
      const isUpdate = Boolean(existingId || existingSnap?.exists());

      const payload = {
        ...data,
        nisn: nisnClean,
        nik: nikClean,
        fullName: data.fullName.slice(0, 120),
        parentName: data.parentName.slice(0, 120),
        parentEmail: data.parentEmail.slice(0, 180),
        p5ProjectTitle: data.p5ProjectTitle.slice(0, 160),
        teacherNote: data.teacherNote.slice(0, 600),
        updatedByUid: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (isUpdate) {
        await updateDoc(stuRef, payload);
      } else {
        await setDoc(stuRef, {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      const dirPayload = {
        nisn: nisnClean,
        fullName: payload.fullName,
        rombel: payload.rombel,
        gender: payload.gender,
        nikHash,
        updatedByUid: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (dirSnap.exists()) {
        await updateDoc(dirRef, dirPayload);
      } else {
        await setDoc(dirRef, {
          ...dirPayload,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `students/${id}`);
    }
  };

  const importStudentsBulk: SchoolContextValue['importStudentsBulk'] = async (rows) => {
    requireFirebaseAdmin();
    if (!user) return { created: 0, updated: 0 };
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) return { created: 0, updated: 0 };

    let created = 0;
    let updated = 0;

    try {
      const [existingSnap, existingDirSnap] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'nisn_directory')),
      ]);
      const existingById = new Map<string, StudentRecord>();
      const existingByNisn = new Map<string, StudentRecord>();
      existingSnap.docs.forEach((d) => {
        const record = { id: d.id, ...d.data() } as StudentRecord;
        existingById.set(d.id, record);
        if (record.nisn) {
          existingByNisn.set(record.nisn, record);
        }
      });
      const existingDirIds = new Set(existingDirSnap.docs.map((d) => d.id));

      const chunkSize = 100;
      for (let i = 0; i < validRows.length; i += chunkSize) {
        const chunk = validRows.slice(i, i + chunkSize);
        const rowNikValues = chunk.map((row) => {
          const nisnClean = row.nisn.replace(/\D/g, '').slice(0, 20);
          const defaultId = `stu-${nisnClean}`;
          const prev = existingById.get(defaultId) ?? existingByNisn.get(nisnClean);
          return (row.nik || prev?.nik || '').replace(/\D/g, '').slice(0, 20);
        });
        const rowNikHashes = await Promise.all(
          rowNikValues.map((nikVal) => hashNikSha256(nikVal))
        );

        const batch = writeBatch(db);
        const ts = serverTimestamp();

        chunk.forEach((row, idx) => {
          const nisnClean = row.nisn.replace(/\D/g, '').slice(0, 20);
          const defaultId = `stu-${nisnClean}`;
          const prev = existingById.get(defaultId) ?? existingByNisn.get(nisnClean);
          const id = prev ? prev.id : defaultId;
          const nikClean = rowNikValues[idx];
          const stuRef = doc(db, 'students', id);

          if (prev) {
            updated += 1;
            batch.update(stuRef, {
              nisn: nisnClean,
              nik: nikClean,
              fullName: row.fullName.slice(0, 120),
              rombel: row.rombel,
              gender: row.gender,
              parentName: (row.parentName || prev.parentName || '').slice(0, 120),
              parentEmail: (row.parentEmail || prev.parentEmail || '').slice(0, 180),
              parentUid: prev.parentUid || '',
              attendancePercent: row.attendancePercent ?? prev.attendancePercent ?? 95,
              p5ProjectTitle: (
                row.p5ProjectTitle ||
                prev.p5ProjectTitle ||
                'Proyek Penguatan Profil Pelajar Pancasila'
              ).slice(0, 160),
              p5Status: row.p5Status ?? prev.p5Status ?? 'Berkembang Sesuai Harapan',
              mathScore: row.mathScore ?? prev.mathScore ?? 80,
              indoScore: row.indoScore ?? prev.indoScore ?? 80,
              ipasScore: row.ipasScore ?? prev.ipasScore ?? 80,
              pancasilaScore: row.pancasilaScore ?? prev.pancasilaScore ?? 80,
              sundaScore: row.sundaScore ?? prev.sundaScore ?? 80,
              teacherNote: (row.teacherNote ?? prev.teacherNote ?? '').slice(0, 600),
              updatedByUid: user.uid,
              updatedAt: ts,
            });
          } else {
            created += 1;
            batch.set(stuRef, {
              nisn: nisnClean,
              nik: nikClean,
              fullName: row.fullName.slice(0, 120),
              rombel: row.rombel,
              gender: row.gender,
              parentName: row.parentName.slice(0, 120),
              parentEmail: row.parentEmail.slice(0, 180),
              parentUid: '',
              attendancePercent: row.attendancePercent ?? 95,
              p5ProjectTitle: (
                row.p5ProjectTitle || 'Proyek Penguatan Profil Pelajar Pancasila'
              ).slice(0, 160),
              p5Status: row.p5Status ?? 'Berkembang Sesuai Harapan',
              mathScore: row.mathScore ?? 80,
              indoScore: row.indoScore ?? 80,
              ipasScore: row.ipasScore ?? 80,
              pancasilaScore: row.pancasilaScore ?? 80,
              sundaScore: row.sundaScore ?? 80,
              teacherNote: (row.teacherNote ?? '').slice(0, 600),
              updatedByUid: user.uid,
              createdAt: ts,
              updatedAt: ts,
            });
          }

          const dirRef = doc(db, 'nisn_directory', id);
          const dirPayload = {
            nisn: nisnClean,
            fullName: row.fullName.slice(0, 120),
            rombel: row.rombel,
            gender: row.gender,
            nikHash: rowNikHashes[idx],
            updatedByUid: user.uid,
            updatedAt: ts,
          };
          if (existingDirIds.has(id)) {
            batch.update(dirRef, dirPayload);
          } else {
            batch.set(dirRef, {
              ...dirPayload,
              createdAt: ts,
            });
          }
        });

        await batch.commit();
      }

      return { created, updated };
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students_bulk_import');
    }
  };

  const removeStudent = async (id: string) => {
    requireFirebaseAdmin();
    try {
      await deleteDoc(doc(db, 'students', id));
      await deleteDoc(doc(db, 'nisn_directory', id)).catch(() => {});
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `students/${id}`);
    }
  };

  const submitStudentLinkRequest: SchoolContextValue['submitStudentLinkRequest'] = async (
    data
  ) => {
    if (!user || !user.email) return;
    const id = makeId('lnk');
    try {
      await setDoc(doc(db, 'student_link_requests', id), {
        requesterUid: user.uid,
        requesterEmail: user.email.slice(0, 180),
        requesterName: (user.displayName || 'Wali Murid').slice(0, 120),
        studentName: data.studentName.slice(0, 120),
        nisn: data.nisn.replace(/\D/g, '').slice(0, 20),
        rombel: data.rombel,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `student_link_requests/${id}`);
    }
  };

  const resolveStudentLinkRequest: SchoolContextValue['resolveStudentLinkRequest'] = async (
    req,
    action
  ) => {
    requireFirebaseAdmin();
    if (!user) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'student_link_requests', req.id), {
        status: action,
        updatedAt: serverTimestamp(),
      });

      if (action === 'approved') {
        const matchedStudent = students.find((s) => s.nisn === req.nisn);
        if (matchedStudent) {
          batch.update(doc(db, 'students', matchedStudent.id), {
            parentEmail: req.requesterEmail,
            parentUid: req.requesterUid,
            parentName: req.requesterName,
            updatedByUid: user.uid,
            updatedAt: serverTimestamp(),
          });
        }
      }
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `student_link_requests/${req.id}`);
    }
  };

  const savePkksItem: SchoolContextValue['savePkksItem'] = async (data, existingId) => {
    requireFirebaseAdmin();
    if (!user) return;
    const id = existingId || makeId('pkks');
    const path = `pkks_items/${id}`;
    const cleanCode = data.code.trim().slice(0, 24);
    const cleanTitle = data.indicatorTitle.trim().slice(0, 220);
    const cleanSummary = data.evidenceSummary.trim().slice(0, 600);
    const cleanUrl = data.evidenceUrl.trim().slice(0, 500);
    const rawScore = Number(data.score);
    if (cleanCode.length < 2) {
      throw new Error('Kode PKKS minimal terdiri dari 2 karakter.');
    }
    if (cleanTitle.length < 5) {
      throw new Error('Nama indikator kinerja PKKS minimal terdiri dari 5 karakter.');
    }
    if (cleanSummary.length < 5) {
      throw new Error('Ringkasan dokumen bukti fisik minimal terdiri dari 5 karakter.');
    }
    if (!Number.isFinite(rawScore) || rawScore < 0 || rawScore > 4) {
      throw new Error('Skor PKKS harus berupa angka antara 0 sampai 4.');
    }
    const cleanScore = Math.round(rawScore * 100) / 100;

    const payload = {
      code: cleanCode,
      component: data.component,
      indicatorTitle: cleanTitle,
      evidenceSummary: cleanSummary,
      evidenceUrl: cleanUrl,
      status: data.status,
      score: cleanScore,
      updatedByUid: user.uid,
    };

    try {
      const hasLivePkks = Boolean(livePkks && livePkks.length > 0);
      if (!hasLivePkks) {
        const pkksSnap = await getDocs(collection(db, 'pkks_items'));
        if (pkksSnap.empty) {
          const batch = writeBatch(db);
          const ts = serverTimestamp();
          let replacedExisting = false;
          INITIAL_PKKS.forEach((seedItem) => {
            const { id: seedId, updatedByUid: _ignored, ...seedRest } = seedItem;
            const ref = doc(db, 'pkks_items', seedId);
            if (existingId && seedId === existingId) {
              replacedExisting = true;
              batch.set(ref, {
                ...payload,
                createdAt: ts,
                updatedAt: ts,
              });
            } else {
              batch.set(ref, {
                ...seedRest,
                updatedByUid: user.uid,
                createdAt: ts,
                updatedAt: ts,
              });
            }
          });
          if (!replacedExisting) {
            batch.set(doc(db, 'pkks_items', id), {
              ...payload,
              createdAt: ts,
              updatedAt: ts,
            });
          }
          await batch.commit();
          return;
        }
      }

      const targetRef = doc(db, 'pkks_items', id);
      const existingSnap = await getDoc(targetRef);
      if (existingSnap.exists()) {
        await updateDoc(targetRef, {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(targetRef, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const removePkksItem = async (id: string) => {
    requireFirebaseAdmin();
    if (!user) return;
    const path = `pkks_items/${id}`;
    try {
      const hasLivePkks = Boolean(livePkks && livePkks.length > 0);
      if (!hasLivePkks) {
        const pkksSnap = await getDocs(collection(db, 'pkks_items'));
        if (pkksSnap.empty) {
          const remaining = INITIAL_PKKS.filter((p) => p.id !== id);
          if (remaining.length > 0) {
            const batch = writeBatch(db);
            const ts = serverTimestamp();
            remaining.forEach((seedItem) => {
              const { id: seedId, updatedByUid: _ignored, ...seedRest } = seedItem;
              batch.set(doc(db, 'pkks_items', seedId), {
                ...seedRest,
                updatedByUid: user.uid,
                createdAt: ts,
                updatedAt: ts,
              });
            });
            await batch.commit();
          }
          return;
        }
      }

      await deleteDoc(doc(db, 'pkks_items', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveJabarBeraksi: SchoolContextValue['saveJabarBeraksi'] = async (data, existingId) => {
    if (!user) {
      if (isItAdmin) {
        throw new Error(FIRESTORE_ADMIN_LINK_REQUIRED_MSG);
      }
      throw new Error('Silakan masuk terlebih dahulu untuk mengirim laporan Jabar Beraksi.');
    }
    const id = existingId || makeId('jb');
    const cleanFileName = data.fileName.trim().slice(0, 200);
    const cleanFileUrl = data.fileUrl.trim().slice(0, 700000);
    const cleanFileSize = data.fileSize.trim().slice(0, 40);
    try {
      if (existingId && liveJabarBeraksi?.some((r) => r.id === existingId)) {
        await updateDoc(doc(db, 'jabar_beraksi', existingId), {
          title: data.title.slice(0, 160),
          ekskulType: data.ekskulType,
          coachName: data.coachName.slice(0, 120),
          activityDate: data.activityDate.slice(0, 40),
          participantCount: Number(data.participantCount),
          description: data.description.slice(0, 2000),
          characterOutcome: data.characterOutcome.slice(0, 300),
          imageUrl: data.imageUrl.slice(0, 120000),
          fileName: cleanFileName,
          fileUrl: cleanFileUrl,
          fileSize: cleanFileSize,
          status: data.status,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'jabar_beraksi', id), {
          title: data.title.slice(0, 160),
          ekskulType: data.ekskulType,
          coachName: data.coachName.slice(0, 120),
          activityDate: data.activityDate.slice(0, 40),
          participantCount: Number(data.participantCount),
          description: data.description.slice(0, 2000),
          characterOutcome: data.characterOutcome.slice(0, 300),
          imageUrl: data.imageUrl.slice(0, 120000),
          fileName: cleanFileName,
          fileUrl: cleanFileUrl,
          fileSize: cleanFileSize,
          status: isFirebaseAdmin ? data.status : 'menunggu',
          authorUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `jabar_beraksi/${id}`);
    }
  };

  const verifyJabarBeraksi = async (id: string, status: 'terverifikasi' | 'menunggu') => {
    requireFirebaseAdmin();
    try {
      await updateDoc(doc(db, 'jabar_beraksi', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jabar_beraksi/${id}`);
    }
  };

  const removeJabarBeraksi = async (id: string) => {
    requireFirebaseAdmin();
    try {
      await deleteDoc(doc(db, 'jabar_beraksi', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jabar_beraksi/${id}`);
    }
  };

  const submitSilokaComplaint: SchoolContextValue['submitSilokaComplaint'] = async (data) => {
    if (!user) throw new Error('Harap masuk terlebih dahulu untuk mengirim pengaduan SILOKA.');
    const id = makeId('slk');
    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketCode = `SLK-2026-${codeSuffix}`;
    try {
      await setDoc(doc(db, 'siloka_complaints', id), {
        ticketCode,
        reporterUid: user.uid,
        reporterName: data.reporterName.slice(0, 120),
        reporterRole: data.reporterRole,
        category: data.category,
        subject: data.subject.slice(0, 160),
        description: data.description.slice(0, 2000),
        status: 'Diterima',
        adminResponse: '',
        respondedBy: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return ticketCode;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `siloka_complaints/${id}`);
    }
  };

  const respondSilokaComplaint: SchoolContextValue['respondSilokaComplaint'] = async (
    id,
    status,
    adminResponse
  ) => {
    requireFirebaseAdmin();
    if (!user) return;
    try {
      await updateDoc(doc(db, 'siloka_complaints', id), {
        status,
        adminResponse: adminResponse.slice(0, 2000),
        respondedBy: isBootstrappedAdmin
          ? 'Neng Linlin Irmawati, S.Pd. (Kepala Sekolah)'
          : 'Tim IT SDN Cikawao',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `siloka_complaints/${id}`);
    }
  };

  const updateOwnSilokaComplaint: SchoolContextValue['updateOwnSilokaComplaint'] = async (
    id,
    subject,
    description
  ) => {
    try {
      await updateDoc(doc(db, 'siloka_complaints', id), {
        subject: subject.slice(0, 160),
        description: description.slice(0, 2000),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `siloka_complaints/${id}`);
    }
  };

  const saveSilokaItem: SchoolContextValue['saveSilokaItem'] = async (data, existingId) => {
    requireFirebaseAdmin();
    if (!user) return;
    const id = existingId || makeId('slkitem');
    const path = `siloka_items/${id}`;
    const cleanFileName = data.fileName.trim().slice(0, 200);
    const cleanFileUrl = data.fileUrl.trim().slice(0, 700000);
    const cleanFileSize = data.fileSize.trim().slice(0, 40);
    const payload = {
      title: data.title.trim().slice(0, 160),
      pillar: data.pillar,
      coordinator: data.coordinator.trim().slice(0, 120),
      periodDate: data.periodDate.trim().slice(0, 40),
      targetGroup: data.targetGroup.trim().slice(0, 120),
      outcome: data.outcome.trim().slice(0, 300),
      description: data.description.trim().slice(0, 2000),
      imageUrl: data.imageUrl.trim().slice(0, 120000),
      fileName: cleanFileName,
      fileUrl: cleanFileUrl,
      fileSize: cleanFileSize,
      status: data.status,
    };

    try {
      const hasLiveSiloka = Boolean(liveSilokaItems && liveSilokaItems.length > 0);
      if (!hasLiveSiloka) {
        const batch = writeBatch(db);
        const ts = serverTimestamp();
        let replacedExisting = false;
        INITIAL_SILOKA_ITEMS.forEach((seedItem) => {
          const { id: seedId, authorUid: _ignored, ...seedRest } = seedItem;
          const ref = doc(db, 'siloka_items', seedId);
          if (existingId && seedId === existingId) {
            replacedExisting = true;
            batch.set(ref, {
              ...payload,
              authorUid: user.uid,
              createdAt: ts,
              updatedAt: ts,
            });
          } else {
            batch.set(ref, {
              ...seedRest,
              authorUid: user.uid,
              createdAt: ts,
              updatedAt: ts,
            });
          }
        });
        if (!replacedExisting) {
          batch.set(doc(db, 'siloka_items', id), {
            ...payload,
            authorUid: user.uid,
            createdAt: ts,
            updatedAt: ts,
          });
        }
        await batch.commit();
        return;
      }

      if (existingId && liveSilokaItems?.some((s) => s.id === existingId)) {
        await updateDoc(doc(db, 'siloka_items', existingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'siloka_items', id), {
          ...payload,
          authorUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const removeSilokaItem = async (id: string) => {
    requireFirebaseAdmin();
    if (!user) return;
    const path = `siloka_items/${id}`;
    try {
      const hasLiveSiloka = Boolean(liveSilokaItems && liveSilokaItems.length > 0);
      if (!hasLiveSiloka) {
        const remaining = INITIAL_SILOKA_ITEMS.filter((s) => s.id !== id);
        if (remaining.length > 0) {
          const batch = writeBatch(db);
          const ts = serverTimestamp();
          remaining.forEach((seedItem) => {
            const { id: seedId, authorUid: _ignored, ...seedRest } = seedItem;
            batch.set(doc(db, 'siloka_items', seedId), {
              ...seedRest,
              authorUid: user.uid,
              createdAt: ts,
              updatedAt: ts,
            });
          });
          await batch.commit();
        }
        return;
      }

      await deleteDoc(doc(db, 'siloka_items', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const saveStaffMember: SchoolContextValue['saveStaffMember'] = async (data, existingId) => {
    requireFirebaseAdmin();
    if (!user) return;
    const id = existingId || makeId('staff');
    const path = `staff/${id}`;
    const payload = {
      fullName: data.fullName.trim().slice(0, 120),
      nip: data.nip.trim().slice(0, 30),
      category: data.category,
      role: data.role.trim().slice(0, 120),
      assignment: data.assignment.trim().slice(0, 200),
      rank: data.rank.trim().slice(0, 80),
      employmentStatus: data.employmentStatus,
      photoUrl: data.photoUrl.trim().slice(0, 80000),
      motto: data.motto.trim().slice(0, 280),
      sortOrder: Math.max(1, Math.min(999, Math.round(Number(data.sortOrder) || 1))),
      updatedByUid: user.uid,
    };

    try {
      const hasLiveStaff = Boolean(liveStaff && liveStaff.length > 0);
      if (!hasLiveStaff) {
        const batch = writeBatch(db);
        const ts = serverTimestamp();
        let replacedExisting = false;
        INITIAL_STAFF.forEach((seedItem) => {
          const { id: seedId, updatedByUid: _ignored, ...seedRest } = seedItem;
          const ref = doc(db, 'staff', seedId);
          if (existingId && seedId === existingId) {
            replacedExisting = true;
            batch.set(ref, {
              ...payload,
              createdAt: ts,
              updatedAt: ts,
            });
          } else {
            batch.set(ref, {
              ...seedRest,
              updatedByUid: user.uid,
              createdAt: ts,
              updatedAt: ts,
            });
          }
        });
        if (!replacedExisting) {
          batch.set(doc(db, 'staff', id), {
            ...payload,
            createdAt: ts,
            updatedAt: ts,
          });
        }
        await batch.commit();
        return;
      }

      if (existingId && liveStaff?.some((s) => s.id === existingId)) {
        await updateDoc(doc(db, 'staff', existingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'staff', id), {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const removeStaffMember = async (id: string) => {
    requireFirebaseAdmin();
    if (!user) return;
    const path = `staff/${id}`;
    try {
      const hasLiveStaff = Boolean(liveStaff && liveStaff.length > 0);
      if (!hasLiveStaff) {
        const remaining = INITIAL_STAFF.filter((s) => s.id !== id);
        if (remaining.length > 0) {
          const batch = writeBatch(db);
          const ts = serverTimestamp();
          remaining.forEach((seedItem) => {
            const { id: seedId, updatedByUid: _ignored, ...seedRest } = seedItem;
            batch.set(doc(db, 'staff', seedId), {
              ...seedRest,
              updatedByUid: user.uid,
              createdAt: ts,
              updatedAt: ts,
            });
          });
          await batch.commit();
        }
        return;
      }

      await deleteDoc(doc(db, 'staff', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const unreadAnnouncementCount = useMemo(() => {
    return announcements.filter((a) => a.isActive && !readAnnouncementIds.includes(a.id)).length;
  }, [announcements, readAnnouncementIds]);

  const markAnnouncementsRead = useCallback(() => {
    setReadAnnouncementIds(announcements.map((a) => a.id));
  }, [announcements]);

  const dismissToast = useCallback(() => setActiveToast(null), []);

  return (
    <SchoolContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        isBootstrappedAdmin,
        isFirebaseAdmin,
        isItAdmin,
        itAdminSession,
        itAdminStatus,
        delegatedAdmins,
        authLoading,
        authError,
        clearAuthError,
        signInWithGoogle,
        refreshItAdminStatus,
        setupItAdmin,
        loginItAdmin,
        logoutItAdmin,
        logout,
        saveDelegatedAdmin,
        removeDelegatedAdmin,
        news,
        announcements,
        gallery,
        inputtedGallery,
        pkksItems,
        jabarBeraksi,
        silokaItems,
        staffMembers,
        students,
        nisnDirectory,
        linkRequests,
        silokaComplaints,
        mySubscription,
        allSubscriptionsCount,
        usingFallbackData,
        seeding,
        seedAllInitialData,
        activeToast,
        dismissToast,
        unreadAnnouncementCount,
        markAnnouncementsRead,
        saveNews,
        removeNews,
        saveAnnouncement,
        removeAnnouncement,
        saveParentSubscription,
        saveGalleryItem,
        removeGalleryItem,
        resolveGalleryVideoUrl,
        saveStudent,
        importStudentsBulk,
        removeStudent,
        submitStudentLinkRequest,
        resolveStudentLinkRequest,
        savePkksItem,
        removePkksItem,
        saveJabarBeraksi,
        verifyJabarBeraksi,
        removeJabarBeraksi,
        submitSilokaComplaint,
        respondSilokaComplaint,
        updateOwnSilokaComplaint,
        saveSilokaItem,
        removeSilokaItem,
        saveStaffMember,
        removeStaffMember,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export function useSchool() {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used inside SchoolProvider');
  return ctx;
}
