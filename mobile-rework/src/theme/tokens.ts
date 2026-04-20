// Ported 1:1 from docs/design/prototype/memoura-v2/tokens.jsx.
// Web-specific font stacks are normalized to PostScript names for RN; the
// raw design values (weights, letter spacing, italic flags) carry over.

export type PaletteId = 'brand' | 'evolve';
export type Mode = 'light' | 'dark';
export type TypeSystemId = 'sans' | 'serif' | 'script';
export type DensityId = 'airy' | 'compact';

export type Palette = {
  name: string;
  bg: string;
  bgElev: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  inkMute: string;
  primary: string;
  primaryDeep: string;
  primarySoft: string;
  secondary: string;
  secondarySoft: string;
  accent: string;
  accentSoft: string;
  heroA: string;
  heroB: string;
  heroC: string;
  line: string;
  lineSoft: string;
  // T299: same alpha-on-ink line, pre-composed against `surface` instead of
  // `bg`. Inputs / cards render on `surface` (lighter than `bg` in every
  // palette), so the bg-composed `line` reads ~14% on surface vs prototype's
  // dynamic 10%. Use `lineOnSurface` for borders inside surface containers.
  lineOnSurface: string;
  lineSoftOnSurface: string;
};

export const PALETTES: Record<PaletteId, Record<Mode, Palette>> = {
  brand: {
    light: {
      name: 'Brand',
      bg: '#FFF8F6',
      bgElev: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceAlt: '#FDEEE9',
      ink: '#2A1A1E',
      inkSoft: '#5C4750',
      inkMute: '#9A8790',
      primary: '#E8788A',
      primaryDeep: '#C94F65',
      primarySoft: '#FCE1E6',
      secondary: '#F4A261',
      secondarySoft: '#FDE8D2',
      accent: '#7EC8B5',
      accentSoft: '#D8EFE8',
      heroA: '#F5C8B6',
      heroB: '#E8788A',
      heroC: '#8B5A7E',
      // T293: pre-composed against bg #FFF8F6 so NativeWind v4's
      // `rgb(var() / <alpha-value>)` pipeline doesn't apply alpha=1 to a
      // colour that already had alpha baked in. Original web rgba values
      // kept in comments for design reference.
      line: '#EEE6E5',      // was rgba(42,26,30,0.08) over bg #FFF8F6
      lineSoft: '#F6EFED',  // was rgba(42,26,30,0.04)
      lineOnSurface: '#EEEDED',     // rgba(42,26,30,0.08) pre-composed over surface #FFFFFF
      lineSoftOnSurface: '#F6F5F6', // rgba(42,26,30,0.04) pre-composed over surface #FFFFFF
    },
    dark: {
      name: 'Brand',
      bg: '#1A1013',
      bgElev: '#231619',
      surface: '#2A1C20',
      surfaceAlt: '#35222A',
      ink: '#FBEDE8',
      inkSoft: '#D5BCC2',
      inkMute: '#8D7880',
      primary: '#FF90A4',
      primaryDeep: '#E8788A',
      primarySoft: '#4A2028',
      secondary: '#F6B57A',
      secondarySoft: '#4A331F',
      accent: '#9ADCC9',
      accentSoft: '#264038',
      heroA: '#6B3244',
      heroB: '#C94F65',
      heroC: '#3B1E2B',
      // T293: pre-composed against bg #1A1013.
      line: '#2C2326',      // was rgba(255,255,255,0.08) over bg #1A1013
      lineSoft: '#231A1C',  // was rgba(255,255,255,0.04)
      lineOnSurface: '#3B2E31',     // rgba(255,255,255,0.08) pre-composed over surface #2A1C20
      lineSoftOnSurface: '#322528', // rgba(255,255,255,0.04) pre-composed over surface #2A1C20
    },
  },
  evolve: {
    light: {
      name: 'Evolve',
      bg: '#F7EFE8',
      bgElev: '#FFFBF7',
      surface: '#FFFBF7',
      surfaceAlt: '#F0E2D6',
      ink: '#1F1512',
      inkSoft: '#574339',
      inkMute: '#968374',
      primary: '#C23B4E',
      primaryDeep: '#8E1F34',
      primarySoft: '#F5D4D8',
      secondary: '#D97E3F',
      secondarySoft: '#F5DDC6',
      accent: '#2F6F5E',
      accentSoft: '#CFE3DB',
      heroA: '#E8B590',
      heroB: '#C23B4E',
      heroC: '#3E1F2A',
      // T293: pre-composed against bg #F7EFE8.
      line: '#E1D9D3',      // was rgba(31,21,18,0.1) over bg #F7EFE8
      lineSoft: '#ECE4DD',  // was rgba(31,21,18,0.05)
      lineOnSurface: '#E8E4E0',     // rgba(31,21,18,0.1) pre-composed over surface #FFFBF7
      lineSoftOnSurface: '#F3EFEB', // rgba(31,21,18,0.05) pre-composed over surface #FFFBF7
    },
    dark: {
      name: 'Evolve',
      bg: '#150E0C',
      bgElev: '#1E1512',
      surface: '#261A17',
      surfaceAlt: '#32231D',
      ink: '#F4E7DD',
      inkSoft: '#CBB4A5',
      inkMute: '#8A7566',
      primary: '#E86A7C',
      primaryDeep: '#C23B4E',
      primarySoft: '#3A1820',
      secondary: '#E89260',
      secondarySoft: '#3C2418',
      accent: '#6DB8A2',
      accentSoft: '#1E3530',
      heroA: '#5C2A34',
      heroB: '#8E1F34',
      heroC: '#1A0C10',
      // T293: pre-composed against bg #150E0C.
      line: '#2C2624',      // was rgba(255,255,255,0.1) over bg #150E0C
      lineSoft: '#211A18',  // was rgba(255,255,255,0.05)
      lineOnSurface: '#3B302E',     // rgba(255,255,255,0.1) pre-composed over surface #261A17
      lineSoftOnSurface: '#302522', // rgba(255,255,255,0.05) pre-composed over surface #261A17
    },
  },
};

export type TypeSystem = {
  name: string;
  // Tailwind class name (maps to tailwind.config.js fontFamily keys)
  display: 'body' | 'bodyMedium' | 'bodySemibold' | 'bodyBold' | 'display' | 'displayItalic' | 'displayMedium' | 'displayBold' | 'displayBoldItalic' | 'script' | 'scriptBold';
  body: 'body' | 'bodyMedium' | 'bodySemibold' | 'bodyBold';
  accent: 'body' | 'bodyMedium' | 'bodySemibold' | 'bodyBold' | 'display' | 'displayItalic' | 'displayMedium' | 'displayBold' | 'displayBoldItalic' | 'script' | 'scriptBold';
  displayLetterSpacing: number; // em → px multiplier applied at component level
  displayItalic: boolean;
  accentItalic: boolean;
};

export const TYPE_SYSTEMS: Record<TypeSystemId, TypeSystem> = {
  sans: {
    name: 'Sans only',
    display: 'bodyBold',
    body: 'body',
    accent: 'bodyMedium',
    displayLetterSpacing: -0.03,
    displayItalic: false,
    accentItalic: true,
  },
  serif: {
    name: 'Sans + Serif',
    display: 'displayMedium',
    body: 'body',
    accent: 'displayItalic',
    displayLetterSpacing: -0.025,
    displayItalic: true,
    accentItalic: true,
  },
  script: {
    name: 'Sans + Script',
    display: 'bodyBold',
    body: 'body',
    accent: 'scriptBold',
    displayLetterSpacing: -0.03,
    displayItalic: false,
    accentItalic: false,
  },
};

export type Density = {
  pad: number;
  gap: number;
  radius: number;
  cardPad: number;
  titleSize: number;
};

export const DENSITIES: Record<DensityId, Density> = {
  airy: { pad: 20, gap: 20, radius: 22, cardPad: 20, titleSize: 32 },
  compact: { pad: 16, gap: 12, radius: 18, cardPad: 16, titleSize: 28 },
};

// Boss-locked defaults (see CLAUDE.md "Design defaults").
// T291 (bug #2): default palette flipped from Brand → Evolve. Existing users
// keep their saved prefs (themeStore hydrates from AsyncStorage); only fresh
// installs inherit this default.
export const DEFAULTS = {
  palette: 'evolve' as PaletteId,
  mode: 'system' as 'system' | Mode,
  type: 'serif' as TypeSystemId,
  density: 'airy' as DensityId,
};
