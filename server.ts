import 'dotenv/config';
import crypto from 'crypto';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';

interface ClaimedCredentialRecord {
  phoneNormalized: string;
  passwordSalt: string;
  passwordHash: string;
  roleLabel: string;
  claimedAt: string;
}

interface SessionTokenPayload {
  role: 'tim-it';
  roleLabel: string;
  phoneMasked: string;
  iat: number;
  exp: number;
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const CREDENTIAL_FILE = path.join(DATA_DIR, 'it-admin-credential.json');
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 10;

const SESSION_SECRET =
  (process.env.IT_ADMIN_SESSION_SECRET || '').trim() || crypto.randomBytes(32).toString('hex');

const revokedTokens = new Set<string>();
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function normalizePhone(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) {
    digits = `0${digits.slice(2)}`;
  }
  if (digits.length < 9 || digits.length > 15) return '';
  return digits;
}

function maskPhone(phone: string): string {
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}••••${phone.slice(-4)}`;
}

function hashPassword(password: string, saltHex: string): string {
  return crypto.scryptSync(password, saltHex, 64).toString('hex');
}

function verifyPasswordConstantTime(password: string, saltHex: string, expectedHashHex: string): boolean {
  try {
    const derived = crypto.scryptSync(password, saltHex, 64);
    const expected = Buffer.from(expectedHashHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function getEnvCredential(): { phoneNormalized: string; password: string } | null {
  const envPhone = normalizePhone(process.env.IT_ADMIN_PHONE || '');
  const envPassword = (process.env.IT_ADMIN_PASSWORD || '').trim();
  if (!envPhone || !envPassword) return null;
  return { phoneNormalized: envPhone, password: envPassword };
}

function readClaimedCredential(): ClaimedCredentialRecord | null {
  try {
    if (!fs.existsSync(CREDENTIAL_FILE)) return null;
    const raw = fs.readFileSync(CREDENTIAL_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ClaimedCredentialRecord>;
    if (
      typeof parsed.phoneNormalized === 'string' &&
      typeof parsed.passwordSalt === 'string' &&
      typeof parsed.passwordHash === 'string' &&
      parsed.phoneNormalized.length >= 9 &&
      parsed.passwordHash.length >= 32
    ) {
      return {
        phoneNormalized: parsed.phoneNormalized,
        passwordSalt: parsed.passwordSalt,
        passwordHash: parsed.passwordHash,
        roleLabel: parsed.roleLabel || 'Tim IT SDN Cikawao',
        claimedAt: parsed.claimedAt || '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getCredentialMode(): {
  configured: boolean;
  mode: 'env' | 'claimed' | 'needs-setup';
} {
  if (getEnvCredential()) {
    return { configured: true, mode: 'env' };
  }
  if (readClaimedCredential()) {
    return { configured: true, mode: 'claimed' };
  }
  return { configured: false, mode: 'needs-setup' };
}

function signSessionToken(phoneNormalized: string, roleLabel: string): {
  token: string;
  phoneMasked: string;
} {
  const now = Date.now();
  const phoneMasked = maskPhone(phoneNormalized);
  const payload: SessionTokenPayload = {
    role: 'tim-it',
    roleLabel,
    phoneMasked,
    iat: now,
    exp: now + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return {
    token: `${encodedPayload}.${signature}`,
    phoneMasked,
  };
}

function verifySessionToken(token: string): SessionTokenPayload | null {
  if (!token || revokedTokens.has(token)) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(encodedPayload)
      .digest('base64url');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as Partial<SessionTokenPayload>;
    if (
      payload.role !== 'tim-it' ||
      typeof payload.roleLabel !== 'string' ||
      typeof payload.phoneMasked !== 'string' ||
      typeof payload.exp !== 'number' ||
      payload.exp < Date.now()
    ) {
      return null;
    }
    return payload as SessionTokenPayload;
  } catch {
    return null;
  }
}

function getClientIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    return fwd.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (now > entry.resetAt) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= RATE_LIMIT_MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

function extractBearerToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== 'string') return '';
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/it-admin/status', (_req: Request, res: Response) => {
    const status = getCredentialMode();
    res.json({
      ...status,
      roleLabel: 'Tim IT SDN Cikawao',
    });
  });

  app.post('/api/it-admin/setup', (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        error: 'Terlalu banyak percobaan. Silakan tunggu beberapa menit sebelum mencoba lagi.',
      });
      return;
    }

    const current = getCredentialMode();
    if (current.configured) {
      res.status(409).json({
        error: 'Akses Tim IT sudah diaktifkan. Silakan langsung masuk dengan nomor HP dan kata sandi.',
      });
      return;
    }

    if (!isPlainObject(req.body)) {
      res.status(400).json({ error: 'Format permintaan tidak valid.' });
      return;
    }

    const phone = normalizePhone(req.body.phone);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!phone) {
      res.status(400).json({
        error: 'Nomor HP tidak valid. Gunakan format nomor Indonesia (contoh: 081234567890).',
      });
      return;
    }
    if (password.length < 8 || password.length > 128) {
      res.status(400).json({
        error: 'Kata sandi harus terdiri dari 8 hingga 128 karakter.',
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const record: ClaimedCredentialRecord = {
      phoneNormalized: phone,
      passwordSalt: salt,
      passwordHash,
      roleLabel: 'Tim IT SDN Cikawao',
      claimedAt: new Date().toISOString(),
    };

    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(CREDENTIAL_FILE, JSON.stringify(record, null, 2), {
        flag: 'wx',
        mode: 0o600,
      });
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'EEXIST') {
        res.status(409).json({
          error: 'Akses Tim IT sudah diklaim sebelumnya. Silakan masuk melalui tab login.',
        });
        return;
      }
      res.status(500).json({ error: 'Gagal menyimpan konfigurasi akses Tim IT.' });
      return;
    }

    clearFailedAttempts(clientIp);
    const { token, phoneMasked } = signSessionToken(phone, record.roleLabel);
    res.status(201).json({
      token,
      session: {
        roleLabel: record.roleLabel,
        phoneMasked,
      },
    });
  });

  app.post('/api/it-admin/login', (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        error: 'Terlalu banyak percobaan login gagal. Coba kembali dalam 10 menit.',
      });
      return;
    }

    if (!isPlainObject(req.body)) {
      res.status(400).json({ error: 'Format permintaan tidak valid.' });
      return;
    }

    const phone = normalizePhone(req.body.phone);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!phone || !password || password.length > 128) {
      recordFailedAttempt(clientIp);
      res.status(400).json({
        error: 'Masukkan nomor HP dan kata sandi Tim IT dengan benar.',
      });
      return;
    }

    const envCred = getEnvCredential();
    if (envCred) {
      const envSalt = crypto.createHash('sha256').update(envCred.phoneNormalized).digest('hex');
      const envHash = hashPassword(envCred.password, envSalt);
      const phoneBufA = Buffer.from(phone, 'utf8');
      const phoneBufB = Buffer.from(envCred.phoneNormalized, 'utf8');
      const phoneMatch =
        phoneBufA.length === phoneBufB.length && crypto.timingSafeEqual(phoneBufA, phoneBufB);
      const passMatch = verifyPasswordConstantTime(password, envSalt, envHash);
      if (!phoneMatch || !passMatch) {
        recordFailedAttempt(clientIp);
        res.status(401).json({ error: 'Nomor HP atau kata sandi Tim IT tidak sesuai.' });
        return;
      }
      clearFailedAttempts(clientIp);
      const { token, phoneMasked } = signSessionToken(phone, 'Tim IT SDN Cikawao');
      res.json({
        token,
        session: {
          roleLabel: 'Tim IT SDN Cikawao',
          phoneMasked,
        },
      });
      return;
    }

    const claimed = readClaimedCredential();
    if (!claimed) {
      res.status(409).json({
        error: 'Akses Tim IT belum diaktifkan. Silakan lakukan aktivasi pertama terlebih dahulu.',
      });
      return;
    }

    const phoneBufA = Buffer.from(phone, 'utf8');
    const phoneBufB = Buffer.from(claimed.phoneNormalized, 'utf8');
    const phoneMatch =
      phoneBufA.length === phoneBufB.length && crypto.timingSafeEqual(phoneBufA, phoneBufB);
    const passMatch = verifyPasswordConstantTime(
      password,
      claimed.passwordSalt,
      claimed.passwordHash
    );

    if (!phoneMatch || !passMatch) {
      recordFailedAttempt(clientIp);
      res.status(401).json({ error: 'Nomor HP atau kata sandi Tim IT tidak sesuai.' });
      return;
    }

    clearFailedAttempts(clientIp);
    const { token, phoneMasked } = signSessionToken(phone, claimed.roleLabel);
    res.json({
      token,
      session: {
        roleLabel: claimed.roleLabel,
        phoneMasked,
      },
    });
  });

  app.get('/api/it-admin/session', (req: Request, res: Response) => {
    const token = extractBearerToken(req);
    const payload = verifySessionToken(token);
    if (!payload) {
      res.status(401).json({ valid: false });
      return;
    }
    res.json({
      valid: true,
      session: {
        roleLabel: payload.roleLabel,
        phoneMasked: payload.phoneMasked,
      },
    });
  });

  app.post('/api/it-admin/logout', (req: Request, res: Response) => {
    const token = extractBearerToken(req);
    if (token) {
      revokedTokens.add(token);
    }
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Portal SDN Cikawao berjalan di http://0.0.0.0:${PORT}`);
  });
}

void startServer();
