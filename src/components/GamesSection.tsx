import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon3D, type Icon3DName, type Icon3DTone } from './Icon3D';

type GameId = 'math-blitz' | 'sunda-memory' | 'eco-sort' | 'word-builder' | 'ipas-quiz';
type GameCategory = 'Semua' | 'Matematika' | 'Bahasa & Budaya' | 'IPAS & Pancasila' | 'Peduli Lingkungan';
type FaseLevel = 'Fase A (Kelas 1–2)' | 'Fase B (Kelas 3–4)' | 'Fase C (Kelas 5–6)';
type PlayStage = 'TITLE_MENU' | 'PLAYING' | 'SUMMARY';

interface GameBestRecord {
  bestScore: number;
  stars: number;
  plays: number;
}

type RecordsMap = Partial<Record<GameId, GameBestRecord>>;

interface GameMeta {
  id: GameId;
  title: string;
  subtitle: string;
  category: Exclude<GameCategory, 'Semua'>;
  targetFase: string;
  objective: string;
  howToPlay: string[];
  icon: Icon3DName;
  tone: Icon3DTone;
  cardBg: string;
  borderClass: string;
  barGradient: string;
  badgeText: string;
}

const STORAGE_KEY = 'sdncikawao_game_records_v1';

const GAME_CATALOG: GameMeta[] = [
  {
    id: 'math-blitz',
    title: 'Tantangan Hitung Cepat',
    subtitle: 'Latih ketangkasan berhitung sesuai tingkat kelas dengan sistem kombo & nyawa.',
    category: 'Matematika',
    targetFase: 'Kelas 1–6 (Fase A, B, C)',
    objective: 'Mengasah penjumlahan, pengurangan, perkalian, pembagian, dan operasi campuran.',
    howToPlay: [
      'Pilih tingkat kesulitan Fase A (Kelas 1–2), Fase B (Kelas 3–4), atau Fase C (Kelas 5–6).',
      'Jawab 10 soal berhitung secepat mungkin sebelum waktu habis.',
      'Jawaban benar berturut-turut memberi poin Kombo ekstra!',
    ],
    icon: 'puzzle',
    tone: 'sky',
    cardBg: 'bg-gradient-to-br from-sky-100/80 via-white to-indigo-100/70',
    borderClass: 'border-sky-300 hover:border-sky-500',
    barGradient: 'from-sky-400 via-blue-500 to-indigo-500',
    badgeText: 'text-sky-800',
  },
  {
    id: 'sunda-memory',
    title: 'Memori Kata Sunda–Indonesia',
    subtitle: 'Cocokkan pasangan kartu kosakata Bahasa Sunda dan artinya dalam Bahasa Indonesia.',
    category: 'Bahasa & Budaya',
    targetFase: 'Kelas 1–6 (Mulok Jabar)',
    objective: 'Melestarikan kosakata Bahasa Sunda sehari-hari sambil melatih daya ingat visual.',
    howToPlay: [
      'Pilih ukuran papan: 12 Kartu (6 Pasang) atau 16 Kartu (8 Pasang).',
      'Ketuk dua kartu untuk membuka dan temukan pasangan kata Sunda dengan artinya.',
      'Selesaikan dengan langkah sesedikit mungkin untuk meraih 3 Bintang!',
    ],
    icon: 'book',
    tone: 'violet',
    cardBg: 'bg-gradient-to-br from-violet-100/80 via-white to-purple-100/70',
    borderClass: 'border-violet-300 hover:border-violet-500',
    barGradient: 'from-violet-400 via-purple-500 to-indigo-500',
    badgeText: 'text-violet-800',
  },
  {
    id: 'eco-sort',
    title: 'Pilah Sampah & Jaga Lingkungan',
    subtitle: 'Wujudkan sekolah sehat dengan memilah sampah Organik, Daur Ulang, dan Residu/B3.',
    category: 'Peduli Lingkungan',
    targetFase: 'Semua Siswa (P5 Peduli Lingkungan)',
    objective: 'Menanamkan kebiasaan memilah sampah yang benar sesuai Visi Misi SDN Cikawao.',
    howToPlay: [
      'Perhatikan benda sampah yang muncul di panggung sekolah.',
      'Pilih tempat sampah yang tepat: Organik (Hijau), Daur Ulang (Biru), atau B3/Residu (Merah).',
      'Baca fakta singkat ramah lingkungan setelah memilih untuk menambah wawasan!',
    ],
    icon: 'school',
    tone: 'emerald',
    cardBg: 'bg-gradient-to-br from-emerald-100/85 via-white to-teal-100/70',
    borderClass: 'border-emerald-300 hover:border-emerald-500',
    barGradient: 'from-emerald-400 via-teal-500 to-green-500',
    badgeText: 'text-emerald-800',
  },
  {
    id: 'word-builder',
    title: 'Susun Kata Ceria',
    subtitle: 'Rangkai ubin huruf acak menjadi kata baku Indonesia seputar alam, sekolah, dan budaya.',
    category: 'Bahasa & Budaya',
    targetFase: 'Kelas 1–6 (Literasi)',
    objective: 'Memperkaya kosakata, ejaan kata baku, dan keterampilan membaca siswa.',
    howToPlay: [
      'Baca petunjuk kategori dan deskripsi kata yang harus disusun.',
      'Ketuk ubin huruf acak satu per satu untuk mengisi kotak jawaban.',
      'Gunakan tombol Petunjuk Huruf jika membutuhkan bantuan!',
    ],
    icon: 'pencil',
    tone: 'amber',
    cardBg: 'bg-gradient-to-br from-amber-100/85 via-white to-orange-100/75',
    borderClass: 'border-amber-300 hover:border-amber-500',
    barGradient: 'from-amber-400 via-orange-500 to-rose-500',
    badgeText: 'text-amber-800',
  },
  {
    id: 'ipas-quiz',
    title: 'Kuis Jelajah IPAS & Pancasila',
    subtitle: 'Petualangan soal interaktif sains alam, wawasan Sumedang, dan karakter pelajar.',
    category: 'IPAS & Pancasila',
    targetFase: 'Kelas 3–6 (IPAS & P5)',
    objective: 'Melatih bernalar kritis tentang alam semesta, Jawa Barat, dan nilai Pancasila.',
    howToPlay: [
      'Jawab 8 pertanyaan pilihan ganda bertema IPAS, Budaya Jabar, dan Pancasila.',
      'Setiap jawaban langsung menampilkan penjelasan ringkas agar belajar makin paham.',
      'Kumpulkan nilai tinggi untuk meraih gelar Juara Cendekia SDN Cikawao!',
    ],
    icon: 'graduation',
    tone: 'rose',
    cardBg: 'bg-gradient-to-br from-rose-100/80 via-white to-pink-100/70',
    borderClass: 'border-rose-300 hover:border-rose-500',
    barGradient: 'from-rose-400 via-pink-500 to-orange-500',
    badgeText: 'text-rose-800',
  },
];

const CATEGORIES: GameCategory[] = [
  'Semua',
  'Matematika',
  'Bahasa & Budaya',
  'IPAS & Pancasila',
  'Peduli Lingkungan',
];

function loadRecords(): RecordsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RecordsMap;
  } catch {
    return {};
  }
}

function saveRecords(records: RecordsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage errors
  }
}

function playSoundFx(type: 'correct' | 'wrong' | 'win' | 'flip', enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const beep = (freq: number, start: number, duration: number, gainPeak = 0.08, wave: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.02);
    };

    if (type === 'flip') {
      beep(520, 0, 0.07, 0.05, 'triangle');
    } else if (type === 'correct') {
      beep(587.33, 0, 0.12, 0.07, 'sine');
      beep(783.99, 0.09, 0.18, 0.08, 'sine');
    } else if (type === 'wrong') {
      beep(280, 0, 0.14, 0.07, 'triangle');
      beep(210, 0.12, 0.2, 0.06, 'triangle');
    } else if (type === 'win') {
      beep(523.25, 0, 0.12, 0.08, 'sine');
      beep(659.25, 0.1, 0.12, 0.08, 'sine');
      beep(783.99, 0.2, 0.15, 0.08, 'sine');
      beep(1046.5, 0.32, 0.3, 0.09, 'sine');
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch {
    // ignore audio issues
  }
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ============================================================================
   GAME 1: TANTANGAN HITUNG CEPAT
   ============================================================================ */
interface MathQuestion {
  prompt: string;
  answer: number;
  choices: number[];
  hint: string;
}

function generateMathQuestion(fase: FaseLevel): MathQuestion {
  let a = 2;
  let b = 3;
  let answer = 5;
  let prompt = '2 + 3 = ?';
  let hint = 'Hitung penjumlahan secara bertahap.';

  if (fase === 'Fase A (Kelas 1–2)') {
    const isAdd = Math.random() > 0.42;
    if (isAdd) {
      a = Math.floor(Math.random() * 19) + 2;
      b = Math.floor(Math.random() * 19) + 1;
      answer = a + b;
      prompt = `${a} + ${b} = ?`;
      hint = `Mulai dari ${Math.max(a, b)}, lalu tambahkan ${Math.min(a, b)}.`;
    } else {
      a = Math.floor(Math.random() * 20) + 10;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
      prompt = `${a} - ${b} = ?`;
      hint = `Kurangi ${a} sebanyak ${b} langkah.`;
    }
  } else if (fase === 'Fase B (Kelas 3–4)') {
    const mode = Math.floor(Math.random() * 3);
    if (mode === 0) {
      a = Math.floor(Math.random() * 9) + 3;
      b = Math.floor(Math.random() * 9) + 2;
      answer = a * b;
      prompt = `${a} × ${b} = ?`;
      hint = `${a} dikalikan ${b} sama dengan menjumlahkan ${a} sebanyak ${b} kali.`;
    } else if (mode === 1) {
      b = Math.floor(Math.random() * 8) + 2;
      answer = Math.floor(Math.random() * 10) + 2;
      a = b * answer;
      prompt = `${a} ÷ ${b} = ?`;
      hint = `Berapa dikali ${b} yang hasilnya ${a}?`;
    } else {
      a = Math.floor(Math.random() * 65) + 25;
      b = Math.floor(Math.random() * 45) + 15;
      answer = a + b;
      prompt = `${a} + ${b} = ?`;
      hint = `Jumlahkan puluhannya dulu, lalu satuannya.`;
    }
  } else {
    const mode = Math.floor(Math.random() * 3);
    if (mode === 0) {
      a = Math.floor(Math.random() * 12) + 4;
      b = Math.floor(Math.random() * 9) + 3;
      const c = Math.floor(Math.random() * 20) + 5;
      answer = a * b + c;
      prompt = `(${a} × ${b}) + ${c} = ?`;
      hint = `Kerjakan perkalian ${a} × ${b} = ${a * b} terlebih dahulu, lalu tambah ${c}.`;
    } else if (mode === 1) {
      a = Math.floor(Math.random() * 14) + 6;
      b = Math.floor(Math.random() * 8) + 3;
      const c = Math.floor(Math.random() * 15) + 4;
      answer = a * b - c;
      prompt = `(${a} × ${b}) - ${c} = ?`;
      hint = `Hitung ${a} × ${b} = ${a * b}, kemudian kurangi ${c}.`;
    } else {
      const denom = [2, 4, 5, 10][Math.floor(Math.random() * 4)];
      const mult = Math.floor(Math.random() * 9) + 2;
      const whole = denom * mult;
      const num = Math.floor(Math.random() * (denom - 1)) + 1;
      answer = (whole / denom) * num;
      prompt = `${num}/${denom} dari ${whole} = ?`;
      hint = `Bagi ${whole} dengan ${denom} (${whole / denom}), lalu kalikan ${num}.`;
    }
  }

  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const offset = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const cand = answer + offset;
    if (cand >= 0 && cand !== answer) {
      wrongSet.add(cand);
    }
  }

  return {
    prompt,
    answer,
    choices: shuffleArray([answer, ...Array.from(wrongSet)]),
    hint,
  };
}

const MathBlitzGame: React.FC<{
  meta: GameMeta;
  soundEnabled: boolean;
  onFinish: (score: number, stars: number) => void;
  onBackToCatalog: () => void;
}> = ({ meta, soundEnabled, onFinish, onBackToCatalog }) => {
  const TOTAL_QUESTIONS = 10;
  const [stage, setStage] = useState<PlayStage>('TITLE_MENU');
  const [fase, setFase] = useState<FaseLevel>('Fase B (Kelas 3–4)');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [question, setQuestion] = useState<MathQuestion>(() => generateMathQuestion('Fase B (Kelas 3–4)'));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [timeLeft, setTimeLeft] = useState(75);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (stage !== 'PLAYING') return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === 'PLAYING' && timeLeft === 0) {
      const stars = score >= 100 ? 3 : score >= 60 ? 2 : 1;
      playSoundFx('win', soundEnabled);
      onFinish(score, stars);
      setStage('SUMMARY');
    }
  }, [timeLeft, stage, score, soundEnabled, onFinish]);

  const startGame = (selectedFase: FaseLevel) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setFase(selectedFase);
    setQuestionIdx(0);
    setScore(0);
    setStreak(0);
    setHearts(3);
    setCorrectCount(0);
    setTimeLeft(selectedFase === 'Fase A (Kelas 1–2)' ? 90 : 75);
    setFeedback(null);
    setQuestion(generateMathQuestion(selectedFase));
    setStage('PLAYING');
  };

  const handleAnswer = (chosen: number) => {
    if (feedback !== null || stage !== 'PLAYING') return;

    const isOk = chosen === question.answer;
    const nextStreak = isOk ? streak + 1 : 0;
    const gained = isOk ? 10 + Math.min(nextStreak - 1, 4) * 3 : 0;
    const nextScore = score + gained;
    const nextHearts = isOk ? hearts : hearts - 1;
    const nextCorrect = isOk ? correctCount + 1 : correctCount;

    setScore(nextScore);
    setStreak(nextStreak);
    setHearts(nextHearts);
    setCorrectCount(nextCorrect);

    if (isOk) {
      playSoundFx('correct', soundEnabled);
      setFeedback({
        ok: true,
        text: `Hebat! +${gained} poin${nextStreak >= 2 ? ` (Kombo ${nextStreak}×)` : ''}`,
      });
    } else {
      playSoundFx('wrong', soundEnabled);
      setFeedback({
        ok: false,
        text: `Kurang tepat. Jawaban benar: ${question.answer}. ${question.hint}`,
      });
    }

    timeoutRef.current = window.setTimeout(() => {
      const isLast = questionIdx + 1 >= TOTAL_QUESTIONS || nextHearts <= 0;
      if (isLast) {
        const stars = nextCorrect >= 8 ? 3 : nextCorrect >= 5 ? 2 : 1;
        playSoundFx('win', soundEnabled);
        onFinish(nextScore, stars);
        setStage('SUMMARY');
      } else {
        setQuestionIdx((prev) => prev + 1);
        setQuestion(generateMathQuestion(fase));
        setFeedback(null);
      }
    }, 950);
  };

  if (stage === 'TITLE_MENU') {
    return (
      <GameTitleCard
        meta={meta}
        onBack={onBackToCatalog}
        extraControls={
          <div className="space-y-3">
            <p className="text-xs font-bold text-sky-900">Pilih Tingkat Kelas:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Fase A (Kelas 1–2)', 'Fase B (Kelas 3–4)', 'Fase C (Kelas 5–6)'] as FaseLevel[]).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFase(item)}
                    className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      fase === item
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-blue-700 shadow-md'
                        : 'bg-white text-slate-700 border-sky-200 hover:border-sky-400'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>
        }
        onStart={() => startGame(fase)}
      />
    );
  }

  if (stage === 'SUMMARY') {
    const stars = correctCount >= 8 ? 3 : correctCount >= 5 ? 2 : 1;
    return (
      <GameSummaryCard
        meta={meta}
        score={score}
        stars={stars}
        details={[
          { label: 'Tingkat', value: fase },
          { label: 'Jawaban Benar', value: `${correctCount} / ${TOTAL_QUESTIONS}` },
          { label: 'Sisa Nyawa', value: `${hearts} / 3` },
        ]}
        onPlayAgain={() => startGame(fase)}
        onBackToCatalog={onBackToCatalog}
      />
    );
  }

  return (
    <div className="bg-white border-2 border-sky-300 rounded-3xl shadow-lg overflow-hidden">
      {/* HUD */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold"
          >
            ← Daftar Game
          </button>
          <span className="text-xs sm:text-sm font-bold">{meta.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-bold tabular-nums">
          <span className="px-3 py-1 rounded-xl bg-white/20">
            Soal {questionIdx + 1}/{TOTAL_QUESTIONS}
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-400 text-amber-950">
            Skor: {score}
          </span>
          <span className="px-3 py-1 rounded-xl bg-rose-500 text-white">
            Nyawa: {hearts}/3
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-400 text-emerald-950">
            Waktu: {timeLeft}d
          </span>
        </div>
      </div>

      {/* Arena */}
      <div className="p-6 sm:p-10 bg-gradient-to-br from-sky-50/70 via-white to-indigo-50/60 space-y-8">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="font-semibold text-sky-800">{fase}</span>
          <span className="font-bold text-amber-700">
            Kombo Beruntun: {streak}×
          </span>
        </div>

        <div className="max-w-xl mx-auto text-center bg-white border-2 border-sky-200 rounded-3xl p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
            Hitung Hasilnya
          </p>
          <p className="font-mono text-4xl sm:text-5xl font-bold text-[#132A2E] mt-3 tracking-tight tabular-nums">
            {question.prompt}
          </p>
        </div>

        <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
          {question.choices.map((choice) => {
            let btnStyle =
              'bg-white border-sky-200 border-b-4 hover:border-sky-500 hover:bg-sky-50 text-[#132A2E]';
            if (feedback) {
              if (choice === question.answer) {
                btnStyle = 'bg-emerald-500 border-emerald-700 border-b-4 text-white';
              } else {
                btnStyle = 'bg-slate-100 border-slate-300 text-slate-500 opacity-75';
              }
            }
            return (
              <button
                key={choice}
                type="button"
                disabled={feedback !== null}
                onClick={() => handleAnswer(choice)}
                className={`btn-3d min-h-[64px] rounded-2xl border-2 font-mono text-2xl font-bold tabular-nums transition-all ${btnStyle}`}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div
            role="status"
            className={`max-w-xl mx-auto rounded-2xl border-2 p-4 flex items-center gap-3 text-sm font-semibold ${
              feedback.ok
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <Icon3D
              name={feedback.ok ? 'check-circle' : 'alert'}
              tone={feedback.ok ? 'emerald' : 'rose'}
              size="md"
            />
            <span>{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   GAME 2: MEMORI KATA SUNDA - INDONESIA
   ============================================================================ */
interface SundaPair {
  id: string;
  sunda: string;
  indo: string;
}

const SUNDA_PAIRS: SundaPair[] = [
  { id: 'enjing', sunda: 'Wilujeng Enjing', indo: 'Selamat Pagi' },
  { id: 'nuhun', sunda: 'Hatur Nuhun', indo: 'Terima Kasih' },
  { id: 'punten', sunda: 'Punten', indo: 'Permisi' },
  { id: 'sakola', sunda: 'Sakola', indo: 'Sekolah' },
  { id: 'diajar', sunda: 'Diajar', indo: 'Belajar' },
  { id: 'cai', sunda: 'Cai', indo: 'Air' },
  { id: 'panonpoe', sunda: 'Panonpoé', indo: 'Matahari' },
  { id: 'babaturan', sunda: 'Babaturan', indo: 'Teman' },
];

interface MemoryCard {
  uid: string;
  pairId: string;
  text: string;
  lang: 'Sunda' | 'Indonesia';
  matched: boolean;
}

function buildMemoryDeck(pairCount: 6 | 8): MemoryCard[] {
  const chosen = shuffleArray(SUNDA_PAIRS).slice(0, pairCount);
  const deck: MemoryCard[] = [];
  chosen.forEach((p) => {
    deck.push({ uid: `${p.id}-su`, pairId: p.id, text: p.sunda, lang: 'Sunda', matched: false });
    deck.push({ uid: `${p.id}-id`, pairId: p.id, text: p.indo, lang: 'Indonesia', matched: false });
  });
  return shuffleArray(deck);
}

const SundaMemoryGame: React.FC<{
  meta: GameMeta;
  soundEnabled: boolean;
  onFinish: (score: number, stars: number) => void;
  onBackToCatalog: () => void;
}> = ({ meta, soundEnabled, onFinish, onBackToCatalog }) => {
  const [stage, setStage] = useState<PlayStage>('TITLE_MENU');
  const [pairCount, setPairCount] = useState<6 | 8>(6);
  const [cards, setCards] = useState<MemoryCard[]>(() => buildMemoryDeck(6));
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [locked, setLocked] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (stage !== 'PLAYING') return;
    const timer = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const startMemory = (count: 6 | 8) => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setPairCount(count);
    setCards(buildMemoryDeck(count));
    setFlippedIndices([]);
    setMoves(0);
    setElapsed(0);
    setLocked(false);
    setStage('PLAYING');
  };

  const handleFlip = (idx: number) => {
    if (locked || stage !== 'PLAYING') return;
    if (cards[idx].matched || flippedIndices.includes(idx)) return;

    playSoundFx('flip', soundEnabled);
    const nextFlipped = [...flippedIndices, idx];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setLocked(true);
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [firstIdx, secondIdx] = nextFlipped;
      const first = cards[firstIdx];
      const second = cards[secondIdx];

      if (first.pairId === second.pairId) {
        playSoundFx('correct', soundEnabled);
        timeoutRef.current = window.setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, matched: true } : c
            );
            const allMatched = updated.every((c) => c.matched);
            if (allMatched) {
              const idealMoves = pairCount;
              const finalScore = Math.max(40, 120 - (nextMoves - idealMoves) * 6);
              const stars = nextMoves <= pairCount + 3 ? 3 : nextMoves <= pairCount + 7 ? 2 : 1;
              playSoundFx('win', soundEnabled);
              onFinish(finalScore, stars);
              setStage('SUMMARY');
            }
            return updated;
          });
          setFlippedIndices([]);
          setLocked(false);
        }, 420);
      } else {
        timeoutRef.current = window.setTimeout(() => {
          setFlippedIndices([]);
          setLocked(false);
        }, 780);
      }
    }
  };

  if (stage === 'TITLE_MENU') {
    return (
      <GameTitleCard
        meta={meta}
        onBack={onBackToCatalog}
        extraControls={
          <div className="space-y-3">
            <p className="text-xs font-bold text-violet-900">Pilih Jumlah Kartu:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPairCount(6)}
                className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                  pairCount === 6
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-purple-700 shadow-md'
                    : 'bg-white text-slate-700 border-violet-200 hover:border-violet-400'
                }`}
              >
                12 Kartu (6 Pasang)
              </button>
              <button
                type="button"
                onClick={() => setPairCount(8)}
                className={`px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                  pairCount === 8
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-purple-700 shadow-md'
                    : 'bg-white text-slate-700 border-violet-200 hover:border-violet-400'
                }`}
              >
                16 Kartu (8 Pasang)
              </button>
            </div>
          </div>
        }
        onStart={() => startMemory(pairCount)}
      />
    );
  }

  if (stage === 'SUMMARY') {
    const finalScore = Math.max(40, 120 - (moves - pairCount) * 6);
    const stars = moves <= pairCount + 3 ? 3 : moves <= pairCount + 7 ? 2 : 1;
    return (
      <GameSummaryCard
        meta={meta}
        score={finalScore}
        stars={stars}
        details={[
          { label: 'Pasangan Selesai', value: `${pairCount} Pasang` },
          { label: 'Total Langkah', value: `${moves} Langkah` },
          { label: 'Waktu Bermain', value: `${elapsed} Detik` },
        ]}
        onPlayAgain={() => startMemory(pairCount)}
        onBackToCatalog={onBackToCatalog}
      />
    );
  }

  const matchedPairs = cards.filter((c) => c.matched).length / 2;

  return (
    <div className="bg-white border-2 border-violet-300 rounded-3xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold"
          >
            ← Daftar Game
          </button>
          <span className="text-xs sm:text-sm font-bold">{meta.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold tabular-nums">
          <span className="px-3 py-1 rounded-xl bg-white/20">
            Cocok: {matchedPairs}/{pairCount}
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-400 text-amber-950">
            Langkah: {moves}
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-400 text-emerald-950">
            Waktu: {elapsed}d
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8 bg-gradient-to-br from-violet-50/70 via-white to-purple-50/70">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {cards.map((card, idx) => {
            const isRevealed = card.matched || flippedIndices.includes(idx);
            return (
              <button
                key={card.uid}
                type="button"
                disabled={isRevealed || locked}
                onClick={() => handleFlip(idx)}
                className={`btn-3d min-h-[92px] sm:min-h-[104px] rounded-2xl border-2 p-3 flex flex-col items-center justify-center text-center transition-all ${
                  card.matched
                    ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-400 text-emerald-950'
                    : isRevealed
                      ? card.lang === 'Sunda'
                        ? 'bg-gradient-to-br from-violet-100 to-indigo-100 border-violet-400 text-violet-950'
                        : 'bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-400 text-amber-950'
                      : 'bg-gradient-to-br from-violet-500 to-purple-600 border-purple-800 border-b-4 text-white hover:brightness-105'
                }`}
              >
                {isRevealed ? (
                  <>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${
                        card.matched
                          ? 'bg-emerald-200 text-emerald-900'
                          : card.lang === 'Sunda'
                            ? 'bg-violet-200 text-violet-900'
                            : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {card.lang}
                    </span>
                    <span className="text-xs sm:text-sm font-bold leading-snug">
                      {card.text}
                    </span>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <Icon3D name="star" tone="amber" size="md" />
                    <span className="text-[11px] font-bold text-white/90">Buka</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   GAME 3: PILAH SAMPAH & JAGA LINGKUNGAN
   ============================================================================ */
type WasteBin = 'organik' | 'daur-ulang' | 'b3';

interface WasteItem {
  name: string;
  bin: WasteBin;
  fact: string;
}

const WASTE_ITEMS: WasteItem[] = [
  {
    name: 'Kulit Pisang',
    bin: 'organik',
    fact: 'Kulit pisang mudah terurai dan sangat bagus dijadikan pupuk kompos tanaman sekolah.',
  },
  {
    name: 'Botol Plastik Minuman',
    bin: 'daur-ulang',
    fact: 'Botol plastik bersih dapat didaur ulang menjadi pot bunga atau kerajinan P5!',
  },
  {
    name: 'Baterai Bekas Jam',
    bin: 'b3',
    fact: 'Baterai bekas mengandung bahan kimia berbahaya sehingga harus dipisahkan di tempat B3/Residu.',
  },
  {
    name: 'Daun Kering Halaman',
    bin: 'organik',
    fact: 'Daun kering dari halaman SDN Cikawao dapat diolah menjadi kompos penyubur taman.',
  },
  {
    name: 'Kardus & Kertas Bekas',
    bin: 'daur-ulang',
    fact: 'Kardus dan kertas bekas dapat didaur ulang kembali sehingga menghemat penebangan pohon.',
  },
  {
    name: 'Sisa Nasi Kotak',
    bin: 'organik',
    fact: 'Sisa makanan termasuk sampah organik basah yang cepat membusuk secara alami.',
  },
  {
    name: 'Kaleng Susu Logam',
    bin: 'daur-ulang',
    fact: 'Kaleng logam bisa dilebur ulang atau dimanfaatkan sebagai tempat pensil kreatif.',
  },
  {
    name: 'Pecahan Kaca Gelas',
    bin: 'b3',
    fact: 'Pecahan kaca tajam berbahaya bagi petugas kebersihan dan perlu ditangani khusus di Residu/B3.',
  },
];

const EcoSortGame: React.FC<{
  meta: GameMeta;
  soundEnabled: boolean;
  onFinish: (score: number, stars: number) => void;
  onBackToCatalog: () => void;
}> = ({ meta, soundEnabled, onFinish, onBackToCatalog }) => {
  const [stage, setStage] = useState<PlayStage>('TITLE_MENU');
  const [deck, setDeck] = useState<WasteItem[]>(() => shuffleArray(WASTE_ITEMS));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const startEco = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setDeck(shuffleArray(WASTE_ITEMS));
    setIndex(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setFeedback(null);
    setStage('PLAYING');
  };

  const current = deck[index];

  const handleSort = (bin: WasteBin) => {
    if (feedback !== null || !current) return;
    const isOk = current.bin === bin;
    const nextStreak = isOk ? streak + 1 : 0;
    const gained = isOk ? 15 + (nextStreak >= 2 ? 5 : 0) : 0;
    const nextScore = score + gained;
    const nextCorrect = isOk ? correctCount + 1 : correctCount;

    setScore(nextScore);
    setStreak(nextStreak);
    setCorrectCount(nextCorrect);

    if (isOk) {
      playSoundFx('correct', soundEnabled);
      setFeedback({ ok: true, text: `Tepat sekali! ${current.fact}` });
    } else {
      playSoundFx('wrong', soundEnabled);
      const binLabel =
        current.bin === 'organik'
          ? 'Organik (Hijau)'
          : current.bin === 'daur-ulang'
            ? 'Daur Ulang (Biru)'
            : 'B3 / Residu (Merah)';
      setFeedback({
        ok: false,
        text: `Seharusnya masuk ke ${binLabel}. ${current.fact}`,
      });
    }

    timeoutRef.current = window.setTimeout(() => {
      if (index + 1 >= deck.length) {
        const stars = nextCorrect >= 7 ? 3 : nextCorrect >= 4 ? 2 : 1;
        playSoundFx('win', soundEnabled);
        onFinish(nextScore, stars);
        setStage('SUMMARY');
      } else {
        setIndex((prev) => prev + 1);
        setFeedback(null);
      }
    }, 1500);
  };

  if (stage === 'TITLE_MENU') {
    return <GameTitleCard meta={meta} onBack={onBackToCatalog} onStart={startEco} />;
  }

  if (stage === 'SUMMARY') {
    const stars = correctCount >= 7 ? 3 : correctCount >= 4 ? 2 : 1;
    return (
      <GameSummaryCard
        meta={meta}
        score={score}
        stars={stars}
        details={[
          { label: 'Sampah Dipilah', value: `${deck.length} Benda` },
          { label: 'Pemilahan Benar', value: `${correctCount} / ${deck.length}` },
          { label: 'Predikat', value: stars === 3 ? 'Duta Lingkungan' : 'Sahabat Bumi' },
        ]}
        onPlayAgain={startEco}
        onBackToCatalog={onBackToCatalog}
      />
    );
  }

  const bins: Array<{
    id: WasteBin;
    title: string;
    desc: string;
    style: string;
    tone: Icon3DTone;
    icon: Icon3DName;
  }> = [
    {
      id: 'organik',
      title: 'Tong Hijau · Organik',
      desc: 'Sisa makanan, daun, kulit buah',
      style: 'bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-400 hover:border-emerald-600 text-emerald-950',
      tone: 'emerald',
      icon: 'school',
    },
    {
      id: 'daur-ulang',
      title: 'Tong Biru · Daur Ulang',
      desc: 'Plastik bersih, kertas, kaleng',
      style: 'bg-gradient-to-br from-sky-50 to-blue-100 border-sky-400 hover:border-sky-600 text-sky-950',
      tone: 'sky',
      icon: 'refresh',
    },
    {
      id: 'b3',
      title: 'Tong Merah · B3 / Residu',
      desc: 'Baterai, kaca tajam, bahan kimia',
      style: 'bg-gradient-to-br from-rose-50 to-orange-100 border-rose-400 hover:border-rose-600 text-rose-950',
      tone: 'rose',
      icon: 'alert',
    },
  ];

  return (
    <div className="bg-white border-2 border-emerald-300 rounded-3xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold"
          >
            ← Daftar Game
          </button>
          <span className="text-xs sm:text-sm font-bold">{meta.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
          <span className="px-3 py-1 rounded-xl bg-white/20">
            Benda {index + 1}/{deck.length}
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-400 text-amber-950">
            Skor: {score}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-10 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/70 space-y-8">
        <div className="max-w-lg mx-auto text-center bg-white border-2 border-emerald-200 rounded-3xl p-7 shadow-sm">
          <div className="flex justify-center mb-3">
            <Icon3D name="trash" tone="amber" size="xl" variant="tile" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Pilah Benda Ini ke Tempat yang Tepat
          </p>
          <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#132A2E] mt-2">
            {current.name}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {bins.map((bin) => (
            <button
              key={bin.id}
              type="button"
              disabled={feedback !== null}
              onClick={() => handleSort(bin.id)}
              className={`btn-3d rounded-2xl border-2 border-b-4 p-5 text-left flex flex-col justify-between gap-3 transition-all ${bin.style}`}
            >
              <Icon3D name={bin.icon} tone={bin.tone} size="lg" variant="tile" />
              <div>
                <p className="text-sm font-bold">{bin.title}</p>
                <p className="text-xs opacity-85 mt-1">{bin.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {feedback && (
          <div
            role="status"
            className={`max-w-2xl mx-auto rounded-2xl border-2 p-4 flex items-center gap-3 text-sm font-semibold ${
              feedback.ok
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                : 'bg-amber-50 border-amber-400 text-amber-950'
            }`}
          >
            <Icon3D
              name={feedback.ok ? 'check-circle' : 'alert'}
              tone={feedback.ok ? 'emerald' : 'amber'}
              size="md"
            />
            <span>{feedback.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   GAME 4: SUSUN KATA CERIA
   ============================================================================ */
interface WordPuzzle {
  word: string;
  category: string;
  clue: string;
}

const WORD_PUZZLES: WordPuzzle[] = [
  { word: 'SEKOLAH', category: 'Lingkungan Belajar', clue: 'Tempat kita menimba ilmu bersama guru dan teman.' },
  { word: 'SUMEDANG', category: 'Daerah Kita', clue: 'Kabupaten di Jawa Barat tempat SDN Cikawao berada.' },
  { word: 'GOTONG', category: 'Karakter Pancasila', clue: 'Bekerja bersama-sama membersihkan kelas (kata pertama dari ___ royong).' },
  { word: 'MERDEKA', category: 'Kurikulum', clue: 'Bebas dan mandiri dalam belajar sesuai Kurikulum ___.' },
  { word: 'ANGKLUNG', category: 'Budaya Sunda', clue: 'Alat musik tradisional dari bambu khas Jawa Barat.' },
  { word: 'PUSTAKA', category: 'Literasi', clue: 'Kumpulan buku bacaan untuk menambah pengetahuan siswa.' },
];

interface LetterTile {
  id: number;
  char: string;
}

function scrambleWord(word: string): LetterTile[] {
  const letters = word.split('').map((char, idx) => ({ id: idx, char }));
  let scrambled = shuffleArray(letters);
  if (scrambled.map((t) => t.char).join('') === word && word.length > 2) {
    scrambled = [...scrambled.slice(1), scrambled[0]];
  }
  return scrambled;
}

const WordBuilderGame: React.FC<{
  meta: GameMeta;
  soundEnabled: boolean;
  onFinish: (score: number, stars: number) => void;
  onBackToCatalog: () => void;
}> = ({ meta, soundEnabled, onFinish, onBackToCatalog }) => {
  const [stage, setStage] = useState<PlayStage>('TITLE_MENU');
  const [puzzles, setPuzzles] = useState<WordPuzzle[]>(() => shuffleArray(WORD_PUZZLES));
  const [idx, setIdx] = useState(0);
  const [pool, setPool] = useState<LetterTile[]>(() => scrambleWord(WORD_PUZZLES[0].word));
  const [picked, setPicked] = useState<LetterTile[]>([]);
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const startWords = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    const list = shuffleArray(WORD_PUZZLES);
    setPuzzles(list);
    setIdx(0);
    setPool(scrambleWord(list[0].word));
    setPicked([]);
    setScore(0);
    setSolvedCount(0);
    setHintUsed(false);
    setStatusMsg(null);
    setStage('PLAYING');
  };

  const current = puzzles[idx];

  const handlePickTile = (tile: LetterTile) => {
    if (statusMsg || !current) return;
    playSoundFx('flip', soundEnabled);
    const nextPicked = [...picked, tile];
    setPicked(nextPicked);
    setPool((prev) => prev.filter((t) => t.id !== tile.id));

    if (nextPicked.length === current.word.length) {
      const attempt = nextPicked.map((t) => t.char).join('');
      if (attempt === current.word) {
        const gained = hintUsed ? 15 : 20;
        const nextScore = score + gained;
        const nextSolved = solvedCount + 1;
        setScore(nextScore);
        setSolvedCount(nextSolved);
        playSoundFx('correct', soundEnabled);
        setStatusMsg({ ok: true, text: `Keren! Kata "${current.word}" tersusun tepat (+${gained} poin).` });

        timeoutRef.current = window.setTimeout(() => {
          if (idx + 1 >= puzzles.length) {
            const stars = nextScore >= 100 ? 3 : nextScore >= 70 ? 2 : 1;
            playSoundFx('win', soundEnabled);
            onFinish(nextScore, stars);
            setStage('SUMMARY');
          } else {
            const nextPuzzle = puzzles[idx + 1];
            setIdx((prev) => prev + 1);
            setPool(scrambleWord(nextPuzzle.word));
            setPicked([]);
            setHintUsed(false);
            setStatusMsg(null);
          }
        }, 1050);
      } else {
        playSoundFx('wrong', soundEnabled);
        setStatusMsg({ ok: false, text: 'Susunan huruf belum tepat, coba atur ulang ya!' });
      }
    }
  };

  const handleReturnTile = (tile: LetterTile) => {
    if (statusMsg?.ok) return;
    setStatusMsg(null);
    setPicked((prev) => prev.filter((t) => t.id !== tile.id));
    setPool((prev) => [...prev, tile]);
  };

  const handleResetWord = () => {
    if (!current || statusMsg?.ok) return;
    setPool(scrambleWord(current.word));
    setPicked([]);
    setStatusMsg(null);
  };

  if (stage === 'TITLE_MENU') {
    return <GameTitleCard meta={meta} onBack={onBackToCatalog} onStart={startWords} />;
  }

  if (stage === 'SUMMARY') {
    const stars = score >= 100 ? 3 : score >= 70 ? 2 : 1;
    return (
      <GameSummaryCard
        meta={meta}
        score={score}
        stars={stars}
        details={[
          { label: 'Kata Disusun', value: `${solvedCount} / ${puzzles.length}` },
          { label: 'Total Skor', value: `${score} Poin` },
          { label: 'Status Literasi', value: 'Aktif & Hebat' },
        ]}
        onPlayAgain={startWords}
        onBackToCatalog={onBackToCatalog}
      />
    );
  }

  return (
    <div className="bg-white border-2 border-amber-300 rounded-3xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold"
          >
            ← Daftar Game
          </button>
          <span className="text-xs sm:text-sm font-bold">{meta.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
          <span className="px-3 py-1 rounded-xl bg-white/20">
            Kata {idx + 1}/{puzzles.length}
          </span>
          <span className="px-3 py-1 rounded-xl bg-white text-amber-900">
            Skor: {score}
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-10 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/70 space-y-6">
        <div className="max-w-xl mx-auto text-center bg-white border-2 border-amber-200 rounded-3xl p-6 shadow-xs">
          <span className="text-xs font-bold text-amber-700">{current.category}</span>
          <p className="text-sm sm:text-base font-semibold text-[#132A2E] mt-2">
            {current.clue}
          </p>
          {hintUsed && (
            <p className="text-xs font-bold text-emerald-700 mt-2">
              Petunjuk: Huruf awal adalah “{current.word[0]}” dan terdiri dari {current.word.length} huruf.
            </p>
          )}
        </div>

        {/* Answer Slots */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 min-h-[60px]">
          {Array.from({ length: current.word.length }).map((_, slotIdx) => {
            const tile = picked[slotIdx];
            return tile ? (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleReturnTile(tile)}
                className="btn-3d w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border-b-4 border-emerald-800 text-white font-mono text-xl font-bold flex items-center justify-center"
              >
                {tile.char}
              </button>
            ) : (
              <div
                key={`slot-${slotIdx}`}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-amber-300 bg-white/80 flex items-center justify-center text-xs font-bold text-amber-400"
              >
                _
              </div>
            );
          })}
        </div>

        {/* Letter Pool */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {pool.map((tile) => (
            <button
              key={tile.id}
              type="button"
              onClick={() => handlePickTile(tile)}
              className="btn-3d w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-amber-300 border-b-4 hover:bg-amber-50 text-[#132A2E] font-mono text-xl font-bold flex items-center justify-center"
            >
              {tile.char}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setHintUsed(true)}
            disabled={hintUsed}
            className="px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
          >
            Petunjuk Huruf Awal
          </button>
          <button
            type="button"
            onClick={handleResetWord}
            className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Acak Ulang Huruf
          </button>
        </div>

        {statusMsg && (
          <div
            role="status"
            className={`max-w-xl mx-auto rounded-2xl border-2 p-4 flex items-center gap-3 text-sm font-semibold ${
              statusMsg.ok
                ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <Icon3D
              name={statusMsg.ok ? 'check-circle' : 'alert'}
              tone={statusMsg.ok ? 'emerald' : 'rose'}
              size="md"
            />
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   GAME 5: KUIS JELAJAH IPAS & PANCASILA
   ============================================================================ */
interface QuizItem {
  topic: string;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const IPAS_QUESTIONS: QuizItem[] = [
  {
    topic: 'IPAS · Tumbuhan',
    question: 'Proses tumbuhan hijau membuat makanannya sendiri dengan bantuan sinar matahari disebut...',
    options: ['Fotosintesis', 'Respirasi', 'Evaporasi', 'Fermentasi'],
    correctIdx: 0,
    explanation: 'Daun berklorofil menyerap cahaya matahari, air, dan karbon dioksida untuk menghasilkan makanan dan oksigen.',
  },
  {
    topic: 'IPAS · Tata Surya',
    question: 'Planet yang dijuluki sebagai Planet Merah dalam tata surya kita adalah...',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturnus'],
    correctIdx: 1,
    explanation: 'Mars berwarna kemerahan karena permukaannya kaya akan debu besi oksida.',
  },
  {
    topic: 'Wawasan Jawa Barat',
    question: 'Salah satu makanan khas kebanggaan Kabupaten Sumedang yang terkenal di seluruh Indonesia adalah...',
    options: ['Pempek', 'Gudeg', 'Tahu Sumedang', 'Rendang'],
    correctIdx: 2,
    explanation: 'Tahu Sumedang memiliki tekstur renyah di luar dan lembut di dalam, menjadi ikon kuliner Sumedang.',
  },
  {
    topic: 'Profil Pelajar Pancasila',
    question: 'Bekerja sama membersihkan ruang kelas tanpa membeda-bedakan teman mencerminkan nilai...',
    options: ['Individualisme', 'Bergotong Royong', 'Persaingan', 'Acuh Tak Acuh'],
    correctIdx: 1,
    explanation: 'Bergotong royong berarti berkolaborasi dengan sukarela agar pekerjaan bersama menjadi ringan.',
  },
  {
    topic: 'IPAS · Siklus Air',
    question: 'Perubahan wujud air laut menjadi uap air karena panas matahari disebut...',
    options: ['Kondensasi', 'Presipitasi', 'Evaporasi', 'Infiltrasi'],
    correctIdx: 2,
    explanation: 'Evaporasi adalah penguapan air dari permukaan bumi menuju atmosfer sebelum membentuk awan.',
  },
  {
    topic: 'Kesehatan & Lingkungan',
    question: 'Memilah sampah sebelum membuangnya dan membawa botol minum ulang bermanfaat untuk...',
    options: [
      'Menambah sampah plastik',
      'Menjaga lingkungan sekolah bersih dan sehat',
      'Mengotori selokan',
      'Menghabiskan air bersih',
    ],
    correctIdx: 1,
    explanation: 'Kebiasaan membawa tumbler dan memilah sampah mengurangi timbulan sampah plastik di sekolah.',
  },
  {
    topic: 'Pancasila',
    question: 'Simbol sila ketiga Pancasila "Persatuan Indonesia" adalah...',
    options: ['Bintang Emas', 'Rantai Emas', 'Pohon Beringin', 'Kepala Banteng'],
    correctIdx: 2,
    explanation: 'Pohon Beringin melambangkan tempat berteduh yang kokoh bagi seluruh rakyat Indonesia yang bersatu.',
  },
  {
    topic: 'Budaya Indonesia',
    question: 'Semboyan bangsa Indonesia yang berarti "Berbeda-beda tetapi tetap satu jua" adalah...',
    options: ['Tut Wuri Handayani', 'Bhinneka Tunggal Ika', 'Ing Ngarsa Sung Tuladha', 'Gemah Ripah Repeh Rapih'],
    correctIdx: 1,
    explanation: 'Bhinneka Tunggal Ika mengajarkan kita untuk saling menghormati perbedaan suku, agama, dan budaya.',
  },
];

const IpasQuizGame: React.FC<{
  meta: GameMeta;
  soundEnabled: boolean;
  onFinish: (score: number, stars: number) => void;
  onBackToCatalog: () => void;
}> = ({ meta, soundEnabled, onFinish, onBackToCatalog }) => {
  const [stage, setStage] = useState<PlayStage>('TITLE_MENU');
  const [questions, setQuestions] = useState<QuizItem[]>(() => shuffleArray(IPAS_QUESTIONS));
  const [idx, setIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const startQuiz = () => {
    setQuestions(shuffleArray(IPAS_QUESTIONS));
    setIdx(0);
    setSelectedIdx(null);
    setScore(0);
    setCorrectCount(0);
    setStage('PLAYING');
  };

  const current = questions[idx];

  const handleSelectOption = (optionIdx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(optionIdx);
    const isOk = optionIdx === current.correctIdx;
    if (isOk) {
      playSoundFx('correct', soundEnabled);
      setScore((prev) => prev + 15);
      setCorrectCount((prev) => prev + 1);
    } else {
      playSoundFx('wrong', soundEnabled);
    }
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      const stars = correctCount >= 7 ? 3 : correctCount >= 4 ? 2 : 1;
      playSoundFx('win', soundEnabled);
      onFinish(score, stars);
      setStage('SUMMARY');
    } else {
      setIdx((prev) => prev + 1);
      setSelectedIdx(null);
    }
  };

  if (stage === 'TITLE_MENU') {
    return <GameTitleCard meta={meta} onBack={onBackToCatalog} onStart={startQuiz} />;
  }

  if (stage === 'SUMMARY') {
    const stars = correctCount >= 7 ? 3 : correctCount >= 4 ? 2 : 1;
    return (
      <GameSummaryCard
        meta={meta}
        score={score}
        stars={stars}
        details={[
          { label: 'Jawaban Tepat', value: `${correctCount} / ${questions.length}` },
          { label: 'Total Nilai', value: `${score} Poin` },
          { label: 'Gelar', value: stars === 3 ? 'Juara Cendekia' : 'Penjelajah Aktif' },
        ]}
        onPlayAgain={startQuiz}
        onBackToCatalog={onBackToCatalog}
      />
    );
  }

  return (
    <div className="bg-white border-2 border-rose-300 rounded-3xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold"
          >
            ← Daftar Game
          </button>
          <span className="text-xs sm:text-sm font-bold">{meta.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
          <span className="px-3 py-1 rounded-xl bg-white/20">
            Pertanyaan {idx + 1}/{questions.length}
          </span>
          <span className="px-3 py-1 rounded-xl bg-amber-300 text-amber-950">
            Skor: {score}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-rose-100 w-full">
        <div
          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="p-6 sm:p-10 bg-gradient-to-br from-rose-50/60 via-white to-orange-50/60 space-y-6">
        <div className="max-w-2xl mx-auto bg-white border-2 border-rose-200 rounded-3xl p-6 shadow-xs">
          <p className="text-xs font-bold text-rose-700">{current.topic}</p>
          <h3 className="font-editorial text-xl sm:text-2xl font-semibold text-[#132A2E] mt-2 leading-snug">
            {current.question}
          </h3>
        </div>

        <div className="max-w-2xl mx-auto grid grid-cols-1 gap-3">
          {current.options.map((opt, optionIdx) => {
            const isSelected = selectedIdx === optionIdx;
            const isCorrect = optionIdx === current.correctIdx;
            let style =
              'bg-white border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 text-[#132A2E]';
            if (selectedIdx !== null) {
              if (isCorrect) {
                style = 'bg-emerald-500 border-emerald-700 text-white';
              } else if (isSelected) {
                style = 'bg-rose-500 border-rose-700 text-white';
              } else {
                style = 'bg-slate-50 border-slate-200 text-slate-500 opacity-75';
              }
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={selectedIdx !== null}
                onClick={() => handleSelectOption(optionIdx)}
                className={`btn-3d min-h-[54px] px-5 py-3.5 rounded-2xl border-2 border-b-4 text-left text-sm font-bold flex items-center justify-between gap-3 transition-all ${style}`}
              >
                <span>
                  {String.fromCharCode(65 + optionIdx)}. {opt}
                </span>
                {selectedIdx !== null && isCorrect && (
                  <Icon3D name="check-circle" tone="white" size="sm" />
                )}
              </button>
            );
          })}
        </div>

        {selectedIdx !== null && (
          <div className="max-w-2xl mx-auto bg-sky-50 border-2 border-sky-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-sky-900">Fakta Belajar:</p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {current.explanation}
              </p>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="btn-3d px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 border-b-[3px] border-emerald-800 text-white text-xs font-bold whitespace-nowrap shrink-0"
            >
              {idx + 1 >= questions.length ? 'Lihat Hasil →' : 'Soal Berikutnya →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   SHARED TITLE & SUMMARY CARDS
   ============================================================================ */
const GameTitleCard: React.FC<{
  meta: GameMeta;
  extraControls?: React.ReactNode;
  onStart: () => void;
  onBack: () => void;
}> = ({ meta, extraControls, onStart, onBack }) => (
  <div className={`rounded-3xl border-2 ${meta.borderClass} ${meta.cardBg} shadow-lg overflow-hidden`}>
    <div className={`h-2 w-full bg-gradient-to-r ${meta.barGradient}`} />
    <div className="p-6 sm:p-10 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Kembali ke Daftar Game
        </button>
        <span className={`text-xs font-bold ${meta.badgeText}`}>{meta.category}</span>
      </div>

      <div className="flex items-start gap-4">
        <Icon3D name={meta.icon} tone={meta.tone} size="xl" variant="tile" />
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#132A2E]">
            {meta.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{meta.subtitle}</p>
        </div>
      </div>

      <div className="bg-white/90 border border-slate-200 rounded-2xl p-5 space-y-2.5">
        <p className="text-xs font-bold text-[#132A2E]">Cara Bermain:</p>
        <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
          {meta.howToPlay.map((step, i) => (
            <li key={step} className="flex items-start gap-2">
              <span className="font-mono font-bold text-emerald-700">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {extraControls}

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onStart}
          className="btn-3d inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 border-b-4 border-emerald-800 text-white text-sm font-bold"
        >
          <Icon3D name="play" tone="white" size="sm" />
          <span>Mulai Bermain Sekarang</span>
        </button>
      </div>
    </div>
  </div>
);

const GameSummaryCard: React.FC<{
  meta: GameMeta;
  score: number;
  stars: number;
  details: Array<{ label: string; value: string }>;
  onPlayAgain: () => void;
  onBackToCatalog: () => void;
}> = ({ meta, score, stars, details, onPlayAgain, onBackToCatalog }) => (
  <div className="bg-white border-2 border-amber-300 rounded-3xl shadow-xl overflow-hidden max-w-2xl mx-auto">
    <div className="h-2.5 w-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" />
    <div className="p-7 sm:p-10 text-center space-y-6 bg-gradient-to-b from-amber-50/60 via-white to-emerald-50/40">
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`transition-transform ${n <= stars ? 'scale-110' : 'opacity-25 grayscale'}`}
          >
            <Icon3D name="star" tone="amber" size="xl" variant="tile" />
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          Permainan Selesai · {meta.title}
        </p>
        <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#132A2E] mt-1">
          {stars === 3 ? 'Luar Biasa Hebat!' : stars === 2 ? 'Bagus Sekali!' : 'Terus Berlatih!'}
        </h2>
        <p className="font-mono text-2xl font-bold text-amber-700 mt-2 tabular-nums">
          Skor Akhir: {score} Poin
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-left">
        {details.map((d) => (
          <div key={d.label} className="bg-white border border-slate-200 rounded-2xl p-3.5">
            <p className="text-[11px] font-semibold text-slate-500">{d.label}</p>
            <p className="text-xs sm:text-sm font-bold text-[#132A2E] mt-1 tabular-nums">
              {d.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="btn-3d inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 border-b-4 border-emerald-800 text-white text-sm font-bold"
        >
          <Icon3D name="refresh" tone="white" size="sm" />
          <span>Main Lagi</span>
        </button>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="btn-3d inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-50 border border-sky-300 border-b-4 text-sky-900 text-sm font-bold"
        >
          <span>Pilih Game Lain</span>
        </button>
      </div>
    </div>
  </div>
);

/* ============================================================================
   MAIN SECTION: CATALOG + ACTIVE GAME ARENA
   ============================================================================ */
export const GamesSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>('Semua');
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [records, setRecords] = useState<RecordsMap>(() => loadRecords());
  const [soundEnabled, setSoundEnabled] = useState(true);

  const totalStars = useMemo(
    () =>
      GAME_CATALOG.reduce((sum, g) => sum + (records[g.id]?.stars || 0), 0),
    [records]
  );

  const totalPlays = useMemo(
    () =>
      GAME_CATALOG.reduce((sum, g) => sum + (records[g.id]?.plays || 0), 0),
    [records]
  );

  const filteredGames = useMemo(
    () =>
      selectedCategory === 'Semua'
        ? GAME_CATALOG
        : GAME_CATALOG.filter((g) => g.category === selectedCategory),
    [selectedCategory]
  );

  const handleGameFinish = (gameId: GameId, score: number, stars: number) => {
    setRecords((prev) => {
      const current = prev[gameId];
      const updated: RecordsMap = {
        ...prev,
        [gameId]: {
          bestScore: Math.max(current?.bestScore || 0, score),
          stars: Math.max(current?.stars || 0, stars),
          plays: (current?.plays || 0) + 1,
        },
      };
      saveRecords(updated);
      return updated;
    });
  };

  const activeMeta = GAME_CATALOG.find((g) => g.id === activeGameId) || null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-100/85 via-amber-50/85 to-sky-100/85 border-2 border-rose-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Icon3D name="gamepad" tone="rose" size="xl" variant="tile" />
            <div>
              <p className="text-xs font-bold text-rose-700">
                Zona Belajar Sambil Bermain · SDN Cikawao
              </p>
              <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[#132A2E] mt-1">
                Game Edukasi Interaktif Siswa
              </h1>
              <p className="text-sm text-slate-700 mt-2 max-w-2xl leading-relaxed">
                Kumpulan permainan edukatif yang menyenangkan untuk melatih berhitung, kosakata
                Sunda–Indonesia, literasi kata baku, kepedulian lingkungan, serta wawasan IPAS dan
                Pancasila secara langsung.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-white/95 border border-amber-300 flex items-center gap-2.5 shadow-2xs">
              <Icon3D name="star" tone="amber" size="md" variant="tile" />
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Bintang Terkumpul</p>
                <p className="font-mono text-base font-bold text-amber-700 tabular-nums">
                  {totalStars} / {GAME_CATALOG.length * 3}
                </p>
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/95 border border-sky-300 flex items-center gap-2.5 shadow-2xs">
              <Icon3D name="award" tone="sky" size="md" variant="tile" />
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Total Main</p>
                <p className="font-mono text-base font-bold text-sky-700 tabular-nums">
                  {totalPlays}×
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`btn-3d px-4 py-2.5 rounded-2xl border-2 text-xs font-bold whitespace-nowrap shrink-0 ${
                soundEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              {soundEnabled ? 'Suara Efek: Aktif' : 'Suara Efek: Nonaktif'}
            </button>
          </div>
        </div>
      </div>

      {/* Active Game Arena OR Game Catalog */}
      {activeMeta ? (
        <div>
          {activeMeta.id === 'math-blitz' && (
            <MathBlitzGame
              meta={activeMeta}
              soundEnabled={soundEnabled}
              onFinish={(s, st) => handleGameFinish('math-blitz', s, st)}
              onBackToCatalog={() => setActiveGameId(null)}
            />
          )}
          {activeMeta.id === 'sunda-memory' && (
            <SundaMemoryGame
              meta={activeMeta}
              soundEnabled={soundEnabled}
              onFinish={(s, st) => handleGameFinish('sunda-memory', s, st)}
              onBackToCatalog={() => setActiveGameId(null)}
            />
          )}
          {activeMeta.id === 'eco-sort' && (
            <EcoSortGame
              meta={activeMeta}
              soundEnabled={soundEnabled}
              onFinish={(s, st) => handleGameFinish('eco-sort', s, st)}
              onBackToCatalog={() => setActiveGameId(null)}
            />
          )}
          {activeMeta.id === 'word-builder' && (
            <WordBuilderGame
              meta={activeMeta}
              soundEnabled={soundEnabled}
              onFinish={(s, st) => handleGameFinish('word-builder', s, st)}
              onBackToCatalog={() => setActiveGameId(null)}
            />
          )}
          {activeMeta.id === 'ipas-quiz' && (
            <IpasQuizGame
              meta={activeMeta}
              soundEnabled={soundEnabled}
              onFinish={(s, st) => handleGameFinish('ipas-quiz', s, st)}
              onBackToCatalog={() => setActiveGameId(null)}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`btn-3d px-4 py-2 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                    active
                      ? 'bg-gradient-to-r from-rose-500 to-orange-500 border-rose-700 border-b-[3px] text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Game Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGames.map((game) => {
              const rec = records[game.id];
              return (
                <article
                  key={game.id}
                  className={`card-interactive rounded-3xl border-2 overflow-hidden flex flex-col justify-between ${game.cardBg} ${game.borderClass}`}
                >
                  <div>
                    <div className={`h-2 w-full bg-gradient-to-r ${game.barGradient}`} />
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <Icon3D name={game.icon} tone={game.tone} size="lg" variant="tile" />
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((n) => (
                            <span
                              key={n}
                              className={
                                rec && n <= rec.stars ? 'opacity-100' : 'opacity-25 grayscale'
                              }
                            >
                              <Icon3D name="star" tone="amber" size="xs" />
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className={`text-xs font-bold ${game.badgeText}`}>
                          {game.category} · {game.targetFase}
                        </p>
                        <h2 className="font-editorial text-xl font-bold text-[#132A2E] mt-1 leading-snug">
                          {game.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                          {game.subtitle}
                        </p>
                      </div>

                      <div className="bg-white/85 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-700">
                        <span className="font-bold text-[#132A2E]">Tujuan Belajar: </span>
                        {game.objective}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-bold text-slate-600 tabular-nums">
                      {rec ? `Rekor: ${rec.bestScore} poin` : 'Belum dimainkan'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveGameId(game.id)}
                      className="btn-3d inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-600 border-b-[3px] border-emerald-800 text-white text-xs font-bold whitespace-nowrap shrink-0"
                    >
                      <Icon3D name="play" tone="white" size="xs" />
                      <span>Mainkan Game</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
