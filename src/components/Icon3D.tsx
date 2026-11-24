import React, { useId } from 'react';

export type Icon3DName =
  | 'home'
  | 'school'
  | 'graduation'
  | 'users'
  | 'award'
  | 'file-check'
  | 'siloka'
  | 'bell'
  | 'bell-ring'
  | 'megaphone'
  | 'camera'
  | 'video'
  | 'play'
  | 'book'
  | 'calendar'
  | 'map-pin'
  | 'shield'
  | 'user'
  | 'login'
  | 'logout'
  | 'menu'
  | 'close'
  | 'check'
  | 'check-circle'
  | 'user-check'
  | 'arrow-right'
  | 'chevron-right'
  | 'download'
  | 'external'
  | 'file-text'
  | 'plus'
  | 'upload'
  | 'loader'
  | 'maximize'
  | 'clipboard'
  | 'clock'
  | 'layers'
  | 'send'
  | 'settings'
  | 'alert'
  | 'database'
  | 'spreadsheet'
  | 'folder-up'
  | 'image'
  | 'image-off'
  | 'dashboard'
  | 'newspaper'
  | 'pencil'
  | 'quote'
  | 'search'
  | 'trash'
  | 'refresh'
  | 'gamepad'
  | 'star'
  | 'puzzle';

export type Icon3DTone =
  | 'emerald'
  | 'sky'
  | 'amber'
  | 'orange'
  | 'violet'
  | 'rose'
  | 'teal'
  | 'indigo'
  | 'white';

export type Icon3DSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Icon3DProps {
  name: Icon3DName;
  tone?: Icon3DTone;
  size?: Icon3DSize;
  variant?: 'glyph' | 'tile';
  className?: string;
}

const TONE_PALETTE: Record<
  Icon3DTone,
  {
    light: string;
    mid: string;
    dark: string;
    accent: string;
    tileBg: string;
    tileBorder: string;
    tileShadow: string;
  }
> = {
  emerald: {
    light: '#6EE7B7',
    mid: '#10B981',
    dark: '#047857',
    accent: '#FEF08A',
    tileBg: 'from-emerald-400 via-emerald-500 to-teal-600',
    tileBorder: 'border-emerald-700/80',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(16,185,129,0.45)]',
  },
  sky: {
    light: '#7DD3FC',
    mid: '#0EA5E9',
    dark: '#0369A1',
    accent: '#FDE68A',
    tileBg: 'from-sky-400 via-sky-500 to-blue-600',
    tileBorder: 'border-blue-700/80',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(14,165,233,0.45)]',
  },
  amber: {
    light: '#FDE68A',
    mid: '#F59E0B',
    dark: '#B45309',
    accent: '#FFFBEB',
    tileBg: 'from-amber-300 via-amber-500 to-orange-500',
    tileBorder: 'border-amber-700/80',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(245,158,11,0.45)]',
  },
  orange: {
    light: '#FDBA74',
    mid: '#F97316',
    dark: '#C2410C',
    accent: '#FEF08A',
    tileBg: 'from-orange-400 via-orange-500 to-rose-500',
    tileBorder: 'border-orange-700/80',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(249,115,22,0.45)]',
  },
  violet: {
    light: '#C4B5FD',
    mid: '#8B5CF6',
    dark: '#5B21B6',
    accent: '#FDE68A',
    tileBg: 'from-violet-400 via-violet-500 to-purple-600',
    tileBorder: 'border-purple-800/80',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(139,92,246,0.45)]',
  },
  rose: {
    light: '#FDA4AF',
    mid: '#F43F5E',
    dark: '#BE123C',
    accent: '#FEF08A',
    tileBg: 'from-rose-400 via-rose-500 to-pink-600',
    tileBorder: 'border-rose-700/80',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(244,63,94,0.45)]',
  },
  teal: {
    light: '#5EEAD4',
    mid: '#14B8A6',
    dark: '#0F766E',
    accent: '#FEF08A',
    tileBg: 'from-teal-400 via-teal-500 to-emerald-600',
    tileBorder: 'border-teal-700/80',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(20,184,166,0.45)]',
  },
  indigo: {
    light: '#A5B4FC',
    mid: '#6366F1',
    dark: '#3730A3',
    accent: '#FDE68A',
    tileBg: 'from-indigo-400 via-indigo-500 to-blue-600',
    tileBorder: 'border-indigo-800/80',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(99,102,241,0.45)]',
  },
  white: {
    light: '#FFFFFF',
    mid: '#E2E8F0',
    dark: '#94A3B8',
    accent: '#FDE047',
    tileBg: 'from-white via-slate-50 to-slate-200',
    tileBorder: 'border-slate-300',
    tileShadow: 'shadow-[0_6px_14px_-3px_rgba(15,23,42,0.18)]',
  },
};

const GLYPH_SIZE_CLASS: Record<Icon3DSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

const TILE_WRAP_SIZE: Record<Icon3DSize, { box: string; glyph: string }> = {
  xs: { box: 'w-6 h-6 rounded-lg border-b-2', glyph: 'w-3.5 h-3.5' },
  sm: { box: 'w-8 h-8 rounded-xl border-b-[3px]', glyph: 'w-4 h-4' },
  md: { box: 'w-10 h-10 rounded-xl border-b-[3px]', glyph: 'w-5 h-5' },
  lg: { box: 'w-12 h-12 rounded-2xl border-b-4', glyph: 'w-6 h-6' },
  xl: { box: 'w-14 h-14 rounded-2xl border-b-4', glyph: 'w-7 h-7' },
};

export const Icon3D: React.FC<Icon3DProps> = ({
  name,
  tone = 'emerald',
  size = 'sm',
  variant = 'glyph',
  className = '',
}) => {
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');
  const palette = TONE_PALETTE[tone];
  const isTile = variant === 'tile';
  const primaryLight = isTile && tone !== 'white' ? '#FFFFFF' : palette.light;
  const primaryMid = isTile && tone !== 'white' ? '#F1F5F9' : palette.mid;
  const primaryDark = isTile && tone !== 'white' ? '#CBD5E1' : palette.dark;
  const goldLight = '#FEF08A';
  const goldMid = '#F59E0B';
  const goldDark = '#B45309';

  const gMain = `gMain_${uid}`;
  const gDepth = `gDepth_${uid}`;
  const gGold = `gGold_${uid}`;
  const gShine = `gShine_${uid}`;

  const svgSizeClass = isTile ? TILE_WRAP_SIZE[size].glyph : GLYPH_SIZE_CLASS[size];

  const renderShape = () => {
    switch (name) {
      case 'home':
      case 'school':
        return (
          <>
            <path d="M5 14v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V14l-11-9L5 14z" fill={`url(#${gDepth})`} />
            <path d="M6 13.5v11.5a1.5 1.5 0 0 0 1.5 1.5h17a1.5 1.5 0 0 0 1.5-1.5V13.5L16 5.5 6 13.5z" fill={`url(#${gMain})`} />
            <path d="M3 14.5L16 3.5l13 11-2 2.4L16 7.5 5 16.9l-2-2.4z" fill={`url(#${gGold})`} />
            <rect x="13" y="17" width="6" height="9.5" rx="1.5" fill={`url(#${gGold})`} />
            <circle cx="17.3" cy="22" r="0.8" fill={goldDark} />
          </>
        );

      case 'graduation':
        return (
          <>
            <path d="M7 15v6.5c0 2.6 4 4.8 9 4.8s9-2.2 9-4.8V15H7z" fill={`url(#${gDepth})`} />
            <path d="M7 14v6c0 2.4 4 4.5 9 4.5s9-2.1 9-4.5v-6H7z" fill={`url(#${gMain})`} />
            <path d="M2 12l14-6.5L30 12l-14 6.5L2 12z" fill={`url(#${gMain})`} />
            <path d="M2 12l14-6.5L30 12l-14 3.5L2 12z" fill={`url(#${gShine})`} opacity="0.5" />
            <path d="M26 14v9" stroke={`url(#${gGold})`} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="26" cy="24" r="2.2" fill={`url(#${gGold})`} />
          </>
        );

      case 'users':
      case 'user-check':
        return (
          <>
            <circle cx="21.5" cy="11.5" r="4" fill={`url(#${gGold})`} />
            <path d="M18 26c0-4 3-6.5 6.5-6.5 2.5 0 4.5 1.5 5.2 4.3.2 1.1-.6 2.2-1.8 2.2H18z" fill={`url(#${gGold})`} />
            <circle cx="12" cy="10.5" r="5" fill={`url(#${gMain})`} />
            <ellipse cx="10.5" cy="9" rx="1.8" ry="1.2" fill="#FFFFFF" opacity="0.45" />
            <path d="M4 26.5c0-4.6 3.6-8 8-8s8 3.4 8 8c0 .8-.7 1.5-1.5 1.5h-13c-.8 0-1.5-.7-1.5-1.5z" fill={`url(#${gDepth})`} />
            <path d="M4.5 25.5c0-4.3 3.3-7.4 7.5-7.4s7.5 3.1 7.5 7.4c0 .7-.6 1.2-1.3 1.2H5.8c-.7 0-1.3-.5-1.3-1.2z" fill={`url(#${gMain})`} />
            {name === 'user-check' && (
              <>
                <circle cx="24" cy="22" r="5.5" fill={goldMid} />
                <path d="M21.5 22l1.7 1.7 3.3-3.4" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
          </>
        );

      case 'award':
        return (
          <>
            <path d="M11 19l-2 9 7-3 7 3-2-9H11z" fill={`url(#${gDepth})`} />
            <circle cx="16" cy="13" r="9.5" fill={`url(#${gGold})`} />
            <circle cx="16" cy="13" r="6.8" fill={`url(#${gMain})`} />
            <path d="M16 7.8l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5L16 7.8z" fill={goldLight} />
          </>
        );

      case 'file-check':
      case 'file-text':
      case 'clipboard':
      case 'spreadsheet':
        return (
          <>
            <rect x="6" y="4" width="20" height="25" rx="3.5" fill={`url(#${gDepth})`} />
            <rect x="5" y="3" width="20" height="25" rx="3.5" fill={`url(#${gMain})`} />
            <path d="M18 3l7 7h-5.5A1.5 1.5 0 0 1 18 8.5V3z" fill={`url(#${gDepth})`} />
            {name === 'clipboard' && (
              <rect x="11" y="1.5" width="8" height="3.5" rx="1.5" fill={`url(#${gGold})`} />
            )}
            <rect x="8.5" y="11" width="12" height="2.4" rx="1.2" fill={`url(#${gShine})`} opacity="0.85" />
            <rect x="8.5" y="15.5" width="9" height="2.4" rx="1.2" fill={`url(#${gShine})`} opacity="0.7" />
            {name === 'file-check' && (
              <>
                <circle cx="22.5" cy="22.5" r="6" fill={`url(#${gGold})`} />
                <path d="M20 22.5l1.7 1.7 3.3-3.4" stroke="#FFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {name === 'spreadsheet' && (
              <g fill={`url(#${gGold})`}>
                <rect x="8.5" y="20" width="5" height="3.5" rx="0.8" />
                <rect x="15" y="20" width="6" height="3.5" rx="0.8" />
              </g>
            )}
          </>
        );

      case 'siloka':
      case 'megaphone':
        return (
          <>
            <path d="M6 12v8a2 2 0 0 0 2 2h4l9 5.5V4.5L12 10H8a2 2 0 0 0-2 2z" fill={`url(#${gDepth})`} />
            <path d="M5 11.5v7a2 2 0 0 0 2 2h4.5l10 5.5V4L11.5 9.5H7a2 2 0 0 0-2 2z" fill={`url(#${gMain})`} />
            <ellipse cx="22.5" cy="15" rx="3" ry="10.5" fill={`url(#${gGold})`} />
            <path d="M9.5 20.5l1.8 6a1.4 1.4 0 0 0 2.6-.2l1-4.3" fill={`url(#${gDepth})`} />
            <path d="M26.5 11c1.5 1.2 2.2 2.5 2.2 4s-.7 2.8-2.2 4" stroke={goldMid} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </>
        );

      case 'bell':
      case 'bell-ring':
        return (
          <>
            <circle cx="16" cy="26" r="3.2" fill={`url(#${gGold})`} />
            <path d="M16 4c-5 0-8.5 3.6-8.5 8.5v5l-2.3 3.4a1.2 1.2 0 0 0 1 1.9h19.6a1.2 1.2 0 0 0 1-1.9L24.5 17.5v-5C24.5 7.6 21 4 16 4z" fill={`url(#${gDepth})`} />
            <path d="M16 3.5c-4.7 0-8 3.4-8 8v5.2l-2 3.1h20l-2-3.1V11.5c0-4.6-3.3-8-8-8z" fill={`url(#${gMain})`} />
            <path d="M11 8.5c.8-2 2.5-3 4.2-3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            {name === 'bell-ring' && (
              <>
                <path d="M5.5 7.5C4 9.2 3.5 11.2 3.5 13" stroke={goldMid} strokeWidth="2.2" strokeLinecap="round" />
                <path d="M26.5 7.5c1.5 1.7 2 3.7 2 5.5" stroke={goldMid} strokeWidth="2.2" strokeLinecap="round" />
              </>
            )}
          </>
        );

      case 'camera':
        return (
          <>
            <rect x="3" y="8.5" width="26" height="19" rx="4" fill={`url(#${gDepth})`} />
            <rect x="3" y="7.5" width="26" height="18.5" rx="4" fill={`url(#${gMain})`} />
            <path d="M10.5 7.5L12.5 4.5h7l2 3h-11z" fill={`url(#${gDepth})`} />
            <circle cx="16" cy="17" r="6" fill={`url(#${gGold})`} />
            <circle cx="16" cy="17" r="3.6" fill={`url(#${gDepth})`} />
            <circle cx="14.7" cy="15.7" r="1.2" fill="#FFFFFF" opacity="0.8" />
            <circle cx="24.5" cy="11.5" r="1.4" fill={goldLight} />
          </>
        );

      case 'video':
        return (
          <>
            <rect x="3" y="8" width="19.5" height="16.5" rx="3.5" fill={`url(#${gDepth})`} />
            <rect x="2.5" y="7" width="19.5" height="16.5" rx="3.5" fill={`url(#${gMain})`} />
            <path d="M22 12.2l6.8-3.8c.9-.5 2 .2 2 1.2v11.2c0 1-1.1 1.7-2 1.2L22 18.2v-6z" fill={`url(#${gGold})`} />
            <circle cx="8.5" cy="12" r="1.8" fill={goldLight} />
          </>
        );

      case 'play':
        return (
          <>
            <circle cx="16" cy="16.5" r="12.5" fill={`url(#${gDepth})`} />
            <circle cx="16" cy="15.5" r="12.5" fill={`url(#${gMain})`} />
            <path d="M12.5 10.5l10 5-10 5v-10z" fill={`url(#${gGold})`} />
          </>
        );

      case 'book':
      case 'newspaper':
        return (
          <>
            <path d="M4 6.5c0-1.4 1.1-2.5 2.5-2.5H15v22H6.5A2.5 2.5 0 0 0 4 28.5V6.5z" fill={`url(#${gDepth})`} />
            <path d="M28 6.5c0-1.4-1.1-2.5-2.5-2.5H17v22h8.5a2.5 2.5 0 0 1 2.5 2.5V6.5z" fill={`url(#${gMain})`} />
            <path d="M5 5.5c0-1 .8-1.8 1.8-1.8H15v21H6.8c-1 0-1.8.8-1.8 1.8V5.5z" fill={`url(#${gMain})`} />
            <rect x="7.5" y="8.5" width="5" height="2" rx="1" fill={goldLight} />
            <rect x="19.5" y="8.5" width="5.5" height="2" rx="1" fill={`url(#${gShine})`} opacity="0.8" />
            <rect x="19.5" y="13" width="5.5" height="2" rx="1" fill={`url(#${gShine})`} opacity="0.65" />
          </>
        );

      case 'calendar':
        return (
          <>
            <rect x="4" y="6.5" width="24" height="22" rx="3.8" fill={`url(#${gDepth})`} />
            <rect x="4" y="5.5" width="24" height="21.5" rx="3.8" fill={`url(#${gMain})`} />
            <path d="M4 9.3A3.8 3.8 0 0 1 7.8 5.5h16.4A3.8 3.8 0 0 1 28 9.3V12H4V9.3z" fill={`url(#${gGold})`} />
            <rect x="9" y="2.8" width="3" height="5" rx="1.5" fill={`url(#${gDepth})`} />
            <rect x="20" y="2.8" width="3" height="5" rx="1.5" fill={`url(#${gDepth})`} />
            <circle cx="11" cy="17.5" r="1.8" fill={goldLight} />
            <circle cx="16" cy="17.5" r="1.8" fill={goldLight} />
            <circle cx="21" cy="17.5" r="1.8" fill={goldLight} />
          </>
        );

      case 'map-pin':
        return (
          <>
            <ellipse cx="16" cy="28" rx="6" ry="2.2" fill={`url(#${gDepth})`} opacity="0.45" />
            <path d="M16 3C10.5 3 6 7.4 6 12.9c0 7.1 10 15.6 10 15.6s10-8.5 10-15.6C26 7.4 21.5 3 16 3z" fill={`url(#${gDepth})`} />
            <path d="M16 2.5C10.7 2.5 6.4 6.8 6.4 12.1c0 6.8 9.6 14.9 9.6 14.9s9.6-8.1 9.6-14.9C25.6 6.8 21.3 2.5 16 2.5z" fill={`url(#${gMain})`} />
            <circle cx="16" cy="12.2" r="4.2" fill={`url(#${gGold})`} />
          </>
        );

      case 'shield':
        return (
          <>
            <path d="M16 3L5.5 7.4v7.5c0 6.8 4.4 12.9 10.5 14.6 6.1-1.7 10.5-7.8 10.5-14.6V7.4L16 3z" fill={`url(#${gDepth})`} />
            <path d="M16 4L6.5 8v6.8c0 6.1 3.9 11.7 9.5 13.3 5.6-1.6 9.5-7.2 9.5-13.3V8L16 4z" fill={`url(#${gMain})`} />
            <path d="M12 15.8l2.7 2.7 5.5-5.8" stroke={goldLight} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );

      case 'user':
        return (
          <>
            <circle cx="16" cy="10.5" r="5.5" fill={`url(#${gMain})`} />
            <ellipse cx="14.3" cy="8.7" rx="2" ry="1.3" fill="#FFFFFF" opacity="0.45" />
            <path d="M5.5 27c0-4.9 4.7-8.8 10.5-8.8s10.5 3.9 10.5 8.8c0 .8-.7 1.5-1.5 1.5H7c-.8 0-1.5-.7-1.5-1.5z" fill={`url(#${gDepth})`} />
            <path d="M6 26.2c0-4.5 4.5-8 10-8s10 3.5 10 8H6z" fill={`url(#${gMain})`} />
          </>
        );

      case 'login':
      case 'logout':
        return (
          <>
            <rect x="4" y="4" width="14" height="24" rx="3" fill={`url(#${gDepth})`} />
            <rect x="4" y="3.5" width="13.5" height="23" rx="3" fill={`url(#${gMain})`} />
            <path
              d={
                name === 'login'
                  ? 'M12 16h14m0 0l-4-4m4 4l-4 4'
                  : 'M14 16h13m0 0l-4-4m4 4l-4 4'
              }
              stroke={`url(#${gGold})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        );

      case 'menu':
        return (
          <>
            <rect x="4" y="6.5" width="24" height="4" rx="2" fill={`url(#${gMain})`} />
            <rect x="4" y="14" width="24" height="4" rx="2" fill={`url(#${gGold})`} />
            <rect x="4" y="21.5" width="24" height="4" rx="2" fill={`url(#${gMain})`} />
          </>
        );

      case 'close':
        return (
          <>
            <circle cx="16" cy="16.5" r="12" fill={`url(#${gDepth})`} opacity="0.22" />
            <path d="M9 9l14 14M23 9L9 23" stroke={`url(#${gMain})`} strokeWidth="3.4" strokeLinecap="round" />
          </>
        );

      case 'check':
      case 'check-circle':
        return (
          <>
            <circle cx="16" cy="16.8" r="12.5" fill={`url(#${gDepth})`} />
            <circle cx="16" cy="15.5" r="12.5" fill={`url(#${gMain})`} />
            <path d="M10.5 15.8l3.7 3.7 7.5-7.8" stroke={goldLight} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );

      case 'arrow-right':
      case 'chevron-right':
        return (
          <>
            <circle cx="16" cy="16.5" r="12" fill={`url(#${gDepth})`} opacity="0.2" />
            <path
              d={name === 'arrow-right' ? 'M7 16h16m0 0l-5.5-5.5M23 16l-5.5 5.5' : 'M12 8.5l8 7.5-8 7.5'}
              stroke={`url(#${gMain})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        );

      case 'download':
      case 'upload':
      case 'folder-up':
        return (
          <>
            <rect x="4" y="21" width="24" height="7" rx="3" fill={`url(#${gDepth})`} />
            <rect x="4" y="20" width="24" height="6.5" rx="3" fill={`url(#${gMain})`} />
            <path
              d={
                name === 'download'
                  ? 'M16 4v13m0 0l-5-5m5 5l5-5'
                  : 'M16 18V5m0 0l-5 5m5-5l5 5'
              }
              stroke={`url(#${gGold})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </>
        );

      case 'external':
      case 'maximize':
        return (
          <>
            <rect x="5" y="8" width="19" height="19" rx="3.5" fill={`url(#${gDepth})`} opacity="0.85" />
            <rect x="4" y="7" width="19" height="19" rx="3.5" fill={`url(#${gMain})`} />
            <path d="M15 17L26 6m0 0h-6m6 0v6" stroke={`url(#${gGold})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );

      case 'plus':
        return (
          <>
            <circle cx="16" cy="16.5" r="12" fill={`url(#${gDepth})`} opacity="0.25" />
            <path d="M16 7v18M7 16h18" stroke={`url(#${gMain})`} strokeWidth="3.6" strokeLinecap="round" />
          </>
        );

      case 'loader':
        return (
          <>
            <circle cx="16" cy="16" r="11" stroke={`url(#${gDepth})`} strokeWidth="3.5" opacity="0.3" fill="none" />
            <path d="M16 5a11 11 0 0 1 11 11" stroke={`url(#${gGold})`} strokeWidth="3.5" strokeLinecap="round" fill="none" />
          </>
        );

      case 'clock':
        return (
          <>
            <circle cx="16" cy="16.8" r="12" fill={`url(#${gDepth})`} />
            <circle cx="16" cy="15.5" r="12" fill={`url(#${gMain})`} />
            <path d="M16 9.5v6.5l4.2 2.5" stroke={goldLight} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );

      case 'layers':
        return (
          <>
            <path d="M3 20.5l13 6.5 13-6.5-13-6.5-13 6.5z" fill={`url(#${gDepth})`} />
            <path d="M3 15.5L16 22l13-6.5L16 9 3 15.5z" fill={`url(#${gGold})`} />
            <path d="M3 10.5L16 17l13-6.5L16 4 3 10.5z" fill={`url(#${gMain})`} />
          </>
        );

      case 'send':
        return (
          <>
            <path d="M4 15.5L28 5l-5.5 22-6.5-6.5-5 4.5v-6l-7-3.5z" fill={`url(#${gDepth})`} />
            <path d="M4 14.5L28 4l-5.5 21.5-6.5-6.3L26 6l-13.5 11.2L4 14.5z" fill={`url(#${gMain})`} />
            <path d="M12.5 17.2L26 6l-10 13.2-3.5-2z" fill={`url(#${gGold})`} />
          </>
        );

      case 'settings':
        return (
          <>
            <circle cx="16" cy="16.5" r="11" fill={`url(#${gDepth})`} />
            <circle cx="16" cy="15.5" r="10.5" fill={`url(#${gMain})`} />
            <circle cx="16" cy="15.5" r="4.5" fill={`url(#${gGold})`} />
          </>
        );

      case 'alert':
        return (
          <>
            <path d="M16 4L3.5 27.5h25L16 4z" fill={`url(#${gDepth})`} />
            <path d="M16 3L4 26.5h24L16 3z" fill={`url(#${gGold})`} />
            <rect x="14.7" y="11" width="2.6" height="8" rx="1.3" fill={goldDark} />
            <circle cx="16" cy="22.3" r="1.5" fill={goldDark} />
          </>
        );

      case 'database':
        return (
          <>
            <path d="M5 10v13c0 3 4.9 5.5 11 5.5s11-2.5 11-5.5V10H5z" fill={`url(#${gDepth})`} />
            <path d="M5 9v13c0 3 4.9 5.2 11 5.2s11-2.2 11-5.2V9H5z" fill={`url(#${gMain})`} />
            <ellipse cx="16" cy="9" rx="11" ry="4.5" fill={`url(#${gGold})`} />
          </>
        );

      case 'image':
      case 'image-off':
        return (
          <>
            <rect x="3.5" y="5.5" width="25" height="22" rx="4" fill={`url(#${gDepth})`} />
            <rect x="3.5" y="4.5" width="25" height="21" rx="4" fill={`url(#${gMain})`} />
            <path d="M6.5 22l5.5-6.5 4.2 4.5 3.8-4 5.5 6H6.5z" fill={`url(#${gGold})`} />
            <circle cx="11" cy="11" r="2.3" fill={goldLight} />
            {name === 'image-off' && (
              <path d="M6 6l20 20" stroke={goldDark} strokeWidth="2.8" strokeLinecap="round" />
            )}
          </>
        );

      case 'dashboard':
        return (
          <>
            <rect x="3.5" y="4" width="11" height="14" rx="3" fill={`url(#${gMain})`} />
            <rect x="17.5" y="4" width="11" height="9" rx="3" fill={`url(#${gGold})`} />
            <rect x="3.5" y="20.5" width="11" height="8" rx="3" fill={`url(#${gGold})`} />
            <rect x="17.5" y="15.5" width="11" height="13" rx="3" fill={`url(#${gDepth})`} />
          </>
        );

      case 'pencil':
        return (
          <>
            <path d="M6 21.5L21.5 6l4.5 4.5L10.5 26H6v-4.5z" fill={`url(#${gDepth})`} />
            <path d="M6.5 20.5L21 6l4.5 4.5-14.5 14.5H6.5v-4.5z" fill={`url(#${gMain})`} />
            <path d="M19.5 7.5L24 12l2-2a2.2 2.2 0 0 0 0-3.1l-1.4-1.4a2.2 2.2 0 0 0-3.1 0l-2 2z" fill={`url(#${gGold})`} />
          </>
        );

      case 'quote':
        return (
          <>
            <path d="M5 10.5h8.5v9c0 3.5-2.2 6.2-6 7l-1-2.7c2-.6 3-2 3.2-4.3H5v-9z" fill={`url(#${gMain})`} />
            <path d="M18 10.5h8.5v9c0 3.5-2.2 6.2-6 7l-1-2.7c2-.6 3-2 3.2-4.3H18v-9z" fill={`url(#${gGold})`} />
          </>
        );

      case 'search':
        return (
          <>
            <path d="M20.5 20.5l7 7" stroke={`url(#${gGold})`} strokeWidth="4" strokeLinecap="round" />
            <circle cx="13.5" cy="13.5" r="8.5" fill={`url(#${gMain})`} />
            <circle cx="13.5" cy="13.5" r="5" fill={`url(#${gShine})`} opacity="0.7" />
          </>
        );

      case 'trash':
        return (
          <>
            <rect x="7" y="9" width="18" height="19" rx="3" fill={`url(#${gDepth})`} />
            <rect x="7.5" y="8.5" width="17" height="18" rx="3" fill={`url(#${gMain})`} />
            <rect x="4.5" y="5.5" width="23" height="3.5" rx="1.7" fill={`url(#${gGold})`} />
            <rect x="12" y="3" width="8" height="3" rx="1.5" fill={`url(#${gGold})`} />
          </>
        );

      case 'refresh':
        return (
          <>
            <path d="M25 11a10 10 0 0 0-17.5-3.2M7 21a10 10 0 0 0 17.5 3.2" stroke={`url(#${gMain})`} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M26 5v6.5h-6.5" stroke={`url(#${gGold})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        );

      case 'gamepad':
        return (
          <>
            <path
              d="M7.5 11h17c3 0 5 2.5 5 6.2 0 4.2-2.2 7.8-4.8 7.8-1.8 0-3-1.4-4.2-2.8h-9c-1.2 1.4-2.4 2.8-4.2 2.8C4.7 25 2.5 21.4 2.5 17.2 2.5 13.5 4.5 11 7.5 11z"
              fill={`url(#${gDepth})`}
            />
            <path
              d="M7.5 10h17c2.8 0 4.8 2.4 4.8 6 0 4-2.1 7.3-4.6 7.3-1.7 0-2.9-1.3-4-2.6h-9.4c-1.1 1.3-2.3 2.6-4 2.6C4.8 23.3 2.7 20 2.7 16c0-3.6 2-6 4.8-6z"
              fill={`url(#${gMain})`}
            />
            <path d="M10 13.2v5.2M7.4 15.8h5.2" stroke={goldLight} strokeWidth="2.3" strokeLinecap="round" />
            <circle cx="21.5" cy="14.2" r="1.4" fill={`url(#${gGold})`} />
            <circle cx="24" cy="16.7" r="1.4" fill={goldLight} />
            <circle cx="19" cy="16.7" r="1.4" fill={goldLight} />
          </>
        );

      case 'star':
        return (
          <>
            <path
              d="M16 4l3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.9L16 22.1l-7 3.7 1.3-7.9-5.7-5.6 7.9-1.1L16 4z"
              fill={`url(#${gDepth})`}
              transform="translate(0, 1.2)"
            />
            <path
              d="M16 3.5l3.5 7.2 7.9 1.1-5.7 5.6 1.3 7.9L16 21.6l-7 3.7 1.3-7.9-5.7-5.6 7.9-1.1L16 3.5z"
              fill={`url(#${gGold})`}
            />
            <path
              d="M16 7l2 4.2 4.6.7-3.3 3.2.8 4.6L16 17.5V7z"
              fill={goldLight}
              opacity="0.65"
            />
          </>
        );

      case 'puzzle':
        return (
          <>
            <path
              d="M7 9h5.2a2.8 2.8 0 0 1 5.6 0H23a2 2 0 0 1 2 2v5.2a2.8 2.8 0 0 1 0 5.6V27a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5.2a2.8 2.8 0 0 0 0-5.6V11a2 2 0 0 1 2-2z"
              fill={`url(#${gDepth})`}
            />
            <path
              d="M7 8h5.2a2.8 2.8 0 0 1 5.6 0H23a2 2 0 0 1 2 2v5.2a2.8 2.8 0 0 1 0 5.6V26a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5.2a2.8 2.8 0 0 0 0-5.6V10a2 2 0 0 1 2-2z"
              fill={`url(#${gMain})`}
            />
            <circle cx="15" cy="18" r="3" fill={`url(#${gGold})`} />
          </>
        );
    }
  };

  const svgElement = (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`${svgSizeClass} shrink-0 icon-3d-svg ${name === 'loader' ? 'animate-spin' : ''} ${
        isTile ? 'drop-shadow-[0_2px_3px_rgba(15,23,42,0.28)]' : 'drop-shadow-[0_2px_2px_rgba(15,23,42,0.18)]'
      } ${!isTile ? className : ''}`}
    >
      <defs>
        <linearGradient id={gMain} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryLight} />
          <stop offset="52%" stopColor={primaryMid} />
          <stop offset="100%" stopColor={primaryDark} />
        </linearGradient>
        <linearGradient id={gDepth} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryMid} />
          <stop offset="100%" stopColor={primaryDark} />
        </linearGradient>
        <linearGradient id={gGold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={goldLight} />
          <stop offset="55%" stopColor={goldMid} />
          <stop offset="100%" stopColor={goldDark} />
        </linearGradient>
        <linearGradient id={gShine} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {renderShape()}
    </svg>
  );

  if (!isTile) {
    return svgElement;
  }

  const wrap = TILE_WRAP_SIZE[size];
  return (
    <span
      className={`icon-3d-tile relative inline-flex items-center justify-center shrink-0 bg-gradient-to-br ${palette.tileBg} ${palette.tileBorder} ${palette.tileShadow} ${wrap.box} overflow-hidden ${className}`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 top-0.5 h-1/2 rounded-t-lg bg-gradient-to-b from-white/55 to-transparent"
      />
      {svgElement}
    </span>
  );
};
