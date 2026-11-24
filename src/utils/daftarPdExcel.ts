import * as XLSX from 'xlsx';
import type { P5Status, RombelName } from '../types';

export interface ParsedDaftarPdRow {
  rowNumber: number;
  nisn: string;
  nik?: string;
  fullName: string;
  rombel: RombelName;
  gender: 'L' | 'P';
  parentName: string;
  parentEmail: string;
  attendancePercent?: number;
  p5ProjectTitle?: string;
  p5Status?: P5Status;
  mathScore?: number;
  indoScore?: number;
  ipasScore?: number;
  pancasilaScore?: number;
  sundaScore?: number;
  teacherNote?: string;
  isValid: boolean;
  errorReason: string;
}

export interface DaftarPdParseResult {
  sheetName: string;
  rows: ParsedDaftarPdRow[];
  validCount: number;
  invalidCount: number;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeRombel(raw: unknown): RombelName {
  const s = String(raw ?? '')
    .toUpperCase()
    .trim();
  if (!s) return 'Kelas 1';

  // Match explicit digits 1..6 (e.g. "Kelas 4", "4A", "Rombel 6 B", "4")
  const digitMatch = s.match(/(?:KELAS|KLS|ROMBEL|^|\s)([1-6])(?:\s|[A-Z]|$)/);
  if (digitMatch) {
    return `Kelas ${digitMatch[1]}` as RombelName;
  }
  const anyDigit = s.match(/[1-6]/);
  if (anyDigit) {
    return `Kelas ${anyDigit[0]}` as RombelName;
  }

  // Match Roman numerals I..VI
  if (/\bVI\b/.test(s)) return 'Kelas 6';
  if (/\bV\b/.test(s)) return 'Kelas 5';
  if (/\bIV\b/.test(s)) return 'Kelas 4';
  if (/\bIII\b/.test(s)) return 'Kelas 3';
  if (/\bII\b/.test(s)) return 'Kelas 2';
  if (/\bI\b/.test(s)) return 'Kelas 1';

  return 'Kelas 1';
}

function normalizeGender(raw: unknown): 'L' | 'P' {
  const s = String(raw ?? '')
    .toUpperCase()
    .trim();
  if (s.startsWith('P') || s.includes('PEREMPUAN') || s.includes('WANITA') || s === 'F') {
    return 'P';
  }
  return 'L';
}

function normalizeScore(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || String(raw).trim() === '') return undefined;
  const num = Number(String(raw).replace(',', '.').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num)) return undefined;
  return Math.min(100, Math.max(0, Math.round(num)));
}

function normalizeP5Status(raw: unknown): P5Status | undefined {
  const s = String(raw ?? '')
    .toLowerCase()
    .trim();
  if (!s) return undefined;
  if (s.includes('sangat')) return 'Sangat Berkembang';
  if (s.includes('mulai')) return 'Mulai Berkembang';
  if (s.includes('sesuai') || s.includes('berkembang')) return 'Berkembang Sesuai Harapan';
  return undefined;
}

function findColumnIndex(headers: string[], candidates: string[]): number {
  for (const cand of candidates) {
    const exactIdx = headers.findIndex((h) => h === cand);
    if (exactIdx !== -1) return exactIdx;
  }
  for (const cand of candidates) {
    const partialIdx = headers.findIndex((h) => h.includes(cand));
    if (partialIdx !== -1) return partialIdx;
  }
  return -1;
}

export async function parseDaftarPdExcel(file: File): Promise<DaftarPdParseResult> {
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error('Ukuran file melebihi batas maksimal 10 MB.');
  }
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls') && !lowerName.endsWith('.csv')) {
    throw new Error('Format file tidak didukung. Gunakan file .xlsx, .xls, atau .csv.');
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const preferredSheet =
    workbook.SheetNames.find((name) => {
      const lower = name.toLowerCase();
      return lower.includes('pd') || lower.includes('siswa') || lower.includes('peserta');
    }) || workbook.SheetNames[0];

  if (!preferredSheet) {
    throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
  }

  const worksheet = workbook.Sheets[preferredSheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (matrix.length === 0) {
    throw new Error('Lembar kerja Excel kosong.');
  }

  // Scan top 15 rows to locate the real header row (handles Dapodik title banners)
  let headerRowIdx = 0;
  let bestScore = -1;
  const scanLimit = Math.min(15, matrix.length);
  for (let i = 0; i < scanLimit; i++) {
    const rowCells = (matrix[i] || []).map(normalizeHeader);
    let score = 0;
    if (rowCells.some((c) => c === 'nisn' || c.includes('nisn'))) score += 3;
    if (rowCells.some((c) => c === 'nama' || c.includes('nama'))) score += 2;
    if (rowCells.some((c) => c.includes('rombel') || c.includes('kelas'))) score += 2;
    if (rowCells.some((c) => c === 'jk' || c.includes('kelamin'))) score += 1;
    if (score > bestScore) {
      bestScore = score;
      headerRowIdx = i;
    }
  }

  if (bestScore < 2) {
    throw new Error(
      'Header kolom Daftar PD tidak ditemukan. Pastikan terdapat kolom Nama dan NISN.'
    );
  }

  const headers = (matrix[headerRowIdx] || []).map(normalizeHeader);

  const idxNisn = findColumnIndex(headers, ['nisn', 'no nisn', 'nis']);
  const idxNik = findColumnIndex(headers, ['nik', 'no nik', 'nomor induk kependudukan']);
  const idxName = findColumnIndex(headers, [
    'nama lengkap',
    'nama peserta didik',
    'nama siswa',
    'nama',
  ]);
  const idxRombel = findColumnIndex(headers, [
    'rombel saat ini',
    'rombel',
    'kelas saat ini',
    'kelas',
    'tingkat pendidikan',
  ]);
  const idxGender = findColumnIndex(headers, ['jk', 'jenis kelamin', 'kelamin', 'gender']);
  const idxParent = findColumnIndex(headers, [
    'nama wali',
    'nama orang tua',
    'orang tua',
    'wali murid',
    'nama ibu',
    'nama ayah',
  ]);
  const idxParentMom = findColumnIndex(headers, ['nama ibu', 'ibu kandung']);
  const idxParentDad = findColumnIndex(headers, ['nama ayah']);
  const idxEmail = findColumnIndex(headers, ['email wali', 'email orang tua', 'email']);
  const idxAttendance = findColumnIndex(headers, ['kehadiran', 'absensi', 'persentase hadir']);
  const idxMath = findColumnIndex(headers, ['matematika', 'mtk']);
  const idxIndo = findColumnIndex(headers, ['bahasa indonesia', 'b indonesia', 'b indo']);
  const idxIpas = findColumnIndex(headers, ['ipas', 'ipa']);
  const idxPancasila = findColumnIndex(headers, ['pendidikan pancasila', 'pancasila', 'ppkn', 'pkn']);
  const idxSunda = findColumnIndex(headers, ['bahasa sunda', 'b sunda', 'sunda']);
  const idxP5Title = findColumnIndex(headers, ['proyek p5', 'judul p5', 'p5']);
  const idxP5Status = findColumnIndex(headers, ['status p5', 'capaian p5']);
  const idxNote = findColumnIndex(headers, ['catatan guru', 'catatan wali', 'catatan']);

  if (idxName === -1 || idxNisn === -1) {
    throw new Error('Kolom wajib "Nama" dan "NISN" tidak ditemukan pada file Excel.');
  }

  const parsedRows: ParsedDaftarPdRow[] = [];
  const seenNisn = new Set<string>();

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const rawRow = matrix[r] || [];
    const rawName = String(rawRow[idxName] ?? '').trim();
    const rawNisn = String(rawRow[idxNisn] ?? '').trim();

    // Skip empty trailing rows or repeated subheader rows
    if (!rawName && !rawNisn) continue;
    if (normalizeHeader(rawName) === 'nama' || normalizeHeader(rawNisn) === 'nisn') continue;

    const nisnDigits = rawNisn.replace(/\D/g, '').slice(0, 20);
    const nikDigits =
      idxNik !== -1
        ? String(rawRow[idxNik] ?? '')
            .replace(/\D/g, '')
            .slice(0, 20)
        : '';
    const fullName = rawName.slice(0, 120);
    const rombel = idxRombel !== -1 ? normalizeRombel(rawRow[idxRombel]) : 'Kelas 1';
    const gender = idxGender !== -1 ? normalizeGender(rawRow[idxGender]) : 'L';

    let parentName = idxParent !== -1 ? String(rawRow[idxParent] ?? '').trim() : '';
    if (!parentName && idxParentMom !== -1) {
      parentName = String(rawRow[idxParentMom] ?? '').trim();
    }
    if (!parentName && idxParentDad !== -1) {
      parentName = String(rawRow[idxParentDad] ?? '').trim();
    }
    parentName = parentName.slice(0, 120);

    const rawEmail = idxEmail !== -1 ? String(rawRow[idxEmail] ?? '').trim() : '';
    const parentEmail = rawEmail.includes('@') ? rawEmail.slice(0, 180) : '';

    let errorReason = '';
    if (fullName.length < 2) {
      errorReason = 'Nama siswa terlalu pendek';
    } else if (nisnDigits.length < 6 || nisnDigits.length > 20) {
      errorReason = 'NISN harus terdiri dari 6–20 digit angka';
    } else if (seenNisn.has(nisnDigits)) {
      errorReason = 'NISN ganda di dalam file';
    }

    if (!errorReason) {
      seenNisn.add(nisnDigits);
    }

    parsedRows.push({
      rowNumber: r + 1,
      nisn: nisnDigits || rawNisn,
      nik: nikDigits || undefined,
      fullName,
      rombel,
      gender,
      parentName,
      parentEmail,
      attendancePercent: idxAttendance !== -1 ? normalizeScore(rawRow[idxAttendance]) : undefined,
      mathScore: idxMath !== -1 ? normalizeScore(rawRow[idxMath]) : undefined,
      indoScore: idxIndo !== -1 ? normalizeScore(rawRow[idxIndo]) : undefined,
      ipasScore: idxIpas !== -1 ? normalizeScore(rawRow[idxIpas]) : undefined,
      pancasilaScore: idxPancasila !== -1 ? normalizeScore(rawRow[idxPancasila]) : undefined,
      sundaScore: idxSunda !== -1 ? normalizeScore(rawRow[idxSunda]) : undefined,
      p5ProjectTitle:
        idxP5Title !== -1
          ? String(rawRow[idxP5Title] ?? '')
              .trim()
              .slice(0, 160) || undefined
          : undefined,
      p5Status: idxP5Status !== -1 ? normalizeP5Status(rawRow[idxP5Status]) : undefined,
      teacherNote:
        idxNote !== -1
          ? String(rawRow[idxNote] ?? '')
              .trim()
              .slice(0, 600) || undefined
          : undefined,
      isValid: errorReason === '',
      errorReason,
    });
  }

  const validCount = parsedRows.filter((row) => row.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return {
    sheetName: preferredSheet,
    rows: parsedRows,
    validCount,
    invalidCount,
  };
}

export function downloadDaftarPdTemplate(): void {
  const headers = [
    'No',
    'Nama',
    'NISN',
    'NIK',
    'JK',
    'Rombel Saat Ini',
    'Nama Wali',
    'Email Wali',
    'Kehadiran',
    'Matematika',
    'Bahasa Indonesia',
    'IPAS',
    'Pendidikan Pancasila',
    'Bahasa Sunda',
    'Proyek P5',
    'Status P5',
    'Catatan Guru',
  ];

  const sampleRows = [
    [
      1,
      'Rafi Pratama Nugraha',
      '0158492001',
      '3211160101140001',
      'L',
      'Kelas 6',
      'Bapak Dadan Nugraha',
      '',
      98,
      89,
      91,
      92,
      94,
      90,
      'Pengolahan Kompos Daun Sekolah',
      'Sangat Berkembang',
      'Aktif berdiskusi dan hadir tepat waktu.',
    ],
    [
      2,
      'Nayla Putri Ramadhani',
      '0158492002',
      '3211160205150002',
      'P',
      'Kelas 5',
      'Ibu Ai Suryani',
      '',
      96,
      87,
      94,
      88,
      92,
      95,
      'Ensiklopedia Mini Aksara Sunda',
      'Sangat Berkembang',
      'Kemampuan literasi membaca sangat menonjol.',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 26 },
    { wch: 14 },
    { wch: 18 },
    { wch: 6 },
    { wch: 16 },
    { wch: 22 },
    { wch: 26 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 8 },
    { wch: 20 },
    { wch: 14 },
    { wch: 30 },
    { wch: 24 },
    { wch: 36 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Daftar PD');
  XLSX.writeFile(wb, 'Template_Daftar_PD_SDN_Cikawao.xlsx');
}
