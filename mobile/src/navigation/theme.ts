/**
 * App theme — extends React Navigation's DefaultTheme.
 *
 * Benefits:
 *  - NavigationContainer auto-applies colors to tab bars, headers, modals
 *  - Dark mode ready: swap AppTheme for DarkAppTheme in one place
 *  - Single source of truth — no custom theme.ts outside navigation
 *
 * Usage in components:
 *   import { useAppColors } from '../navigation/theme';
 *   const colors = useAppColors();
 *   <View style={{ backgroundColor: colors.primary }} />
 */
import { useColorScheme } from 'react-native';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const AppTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    // ── React Navigation base (auto-applied to navigator UI) ──────────────
    primary:      '#E8788A',   // active tab, header tint, links (Rose)
    background:   '#FFF8F6',   // screen background (Soft blush white)
    card:         '#FFFFFF',   // tab bar / header background
    text:         '#2D2D2D',   // default text
    border:       '#F0E6E3',   // tab bar border, header border
    notification: '#E8788A',   // badge color

    // ── Brand palette (gentle & soothing — web-aligned) ───────────────────
    // Rose Primary
    primaryLight:   '#F2A5B0',
    primaryLighter: '#FADADD',
    primaryShadow:  'rgba(232,120,138,0.20)',
    primaryMuted:   'rgba(232,120,138,0.10)',

    // Warm Secondary
    secondary:      '#F4A261',
    secondaryMuted: 'rgba(244,162,97,0.12)',

    // Teal Accent
    accent:         '#7EC8B5',
    accentMuted:    'rgba(126,200,181,0.12)',

    // Success
    success:        '#7EC8B5',
    successBg:      'rgba(126,200,181,0.10)',

    // ── Backgrounds ────────────────────────────────────────────────────────
    baseBg:         '#FFF8F6',
    bgCard:         '#FFFFFF',
    borderSoft:     '#F0E6E3',

    // ── Text ──────────────────────────────────────────────────────────────
    textDark:  '#2D2D2D',
    textMid:   '#6B7280',
    textLight: '#9CA3AF',

    // ── Input states ──────────────────────────────────────────────────────
    white:            '#FFFFFF',
    inputBg:          'rgba(255,255,255,0.90)',
    inputFocusBg:     '#FFFFFF',
    inputBorderFocus: 'rgba(232,120,138,0.40)',

    // ── Misc ─────────────────────────────────────────────────────────────
    starRating:  '#F4A261',

    // ── Status ────────────────────────────────────────────────────────────
    errorColor:  '#D94F58',
    errorBg:     'rgba(255,240,240,0.95)',

    // ── Neutral ───────────────────────────────────────────────────────────
    gray100:     '#F5F3F4',
  },
  fonts: {
    // Be Vietnam Pro - designed for Vietnamese with excellent diacritics support
    heading: 'BeVietnamPro-Bold',        // 700 - Large titles, headers
    headingSemi: 'BeVietnamPro-SemiBold', // 600 - Subtitles, section headers
    body: 'BeVietnamPro-Regular',        // 400 - Body text, descriptions
    bodyMedium: 'BeVietnamPro-Medium',   // 500 - Emphasized text, labels
    bodyLight: 'BeVietnamPro-Light',     // 300 - Secondary text
    // Borel-Regular available via tailwind 'font-cursive' (slogans only)
  },
} as const;

export const DarkAppTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    // ── React Navigation base ─────────────────────────────────────────────
    primary:      '#E8788A',
    background:   '#121212',
    card:         '#1E1E1E',
    text:         '#E5E5E5',
    border:       '#2C2C2C',
    notification: '#E8788A',

    // ── Brand palette ─────────────────────────────────────────────────────
    primaryLight:   '#F2A5B0',
    primaryLighter: '#3D2328',
    primaryShadow:  'rgba(232,120,138,0.30)',
    primaryMuted:   'rgba(232,120,138,0.15)',

    secondary:      '#F4A261',
    secondaryMuted: 'rgba(244,162,97,0.15)',

    accent:         '#7EC8B5',
    accentMuted:    'rgba(126,200,181,0.15)',

    success:        '#7EC8B5',
    successBg:      'rgba(126,200,181,0.15)',

    // ── Backgrounds ────────────────────────────────────────────────────────
    baseBg:         '#121212',
    bgCard:         '#1E1E1E',
    borderSoft:     '#2C2C2C',

    // ── Text ──────────────────────────────────────────────────────────────
    textDark:  '#E5E5E5',
    textMid:   '#B0B0B0',
    textLight: '#D4D4D4',

    // ── Input states ──────────────────────────────────────────────────────
    white:            '#FFFFFF',
    inputBg:          'rgba(30,30,30,0.90)',
    inputFocusBg:     '#2A2A2A',
    inputBorderFocus: 'rgba(232,120,138,0.40)',

    // ── Misc ─────────────────────────────────────────────────────────────
    starRating:  '#F4A261',

    // ── Status ────────────────────────────────────────────────────────────
    errorColor:  '#FF6B75',
    errorBg:     'rgba(80,20,20,0.95)',

    // ── Neutral ───────────────────────────────────────────────────────────
    gray100:     '#2C2C2C',
  },
  fonts: AppTheme.fonts,
} as const;

/** Color map with widened string values — supports both light and dark palettes. */
export type AppColors = { [K in keyof typeof AppTheme.colors]: string };

/**
 * Typed hook to access app colors based on system color scheme.
 * Uses useColorScheme() from react-native — system-only, no user override.
 * Returns dark colors when OS is in dark mode, light colors otherwise.
 */
export function useAppColors(): AppColors {
  const scheme = useColorScheme();
  return (scheme === 'dark' ? DarkAppTheme.colors : AppTheme.colors) as AppColors;
}
