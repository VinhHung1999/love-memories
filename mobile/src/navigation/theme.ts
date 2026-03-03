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
import { DefaultTheme, useTheme } from '@react-navigation/native';

export const AppTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    // ── React Navigation base (auto-applied to navigator UI) ──────────────
    primary:      '#E8788A',   // active tab, header tint, links
    background:   '#FAFAFA',   // screen background
    card:         '#FFFFFF',   // tab bar / header background
    text:         '#1A1624',   // default text
    border:       '#E2DCE8',   // tab bar border, header border
    notification: '#E8788A',   // badge color

    // ── Brand palette ─────────────────────────────────────────────────────
    primaryLight:   '#F4A8B4',
    primaryShadow:  'rgba(232,120,138,0.40)',
    primaryMuted:   'rgba(232,120,138,0.12)',
    secondary:      '#F4A261',
    secondaryMuted: 'rgba(244,162,97,0.10)',
    accent:         '#7EC8B5',
    accentMuted:    'rgba(126,200,181,0.10)',

    // ── Text ──────────────────────────────────────────────────────────────
    textDark:  '#1A1624',
    textMid:   '#5C4E60',
    textLight: '#A898AD',

    // ── Input states ──────────────────────────────────────────────────────
    white:            '#FFFFFF',
    inputBg:          'rgba(255,255,255,0.88)',
    inputFocusBg:     '#FFFFFF',
    inputBorderFocus: 'rgba(232,120,138,0.60)',

    // ── Status ────────────────────────────────────────────────────────────
    errorColor:  '#D94F58',
    errorBg:     'rgba(255,240,240,0.95)',
    success:     '#34A853',
    successBg:   '#F0FFF4',
  },
} as const;

export type AppColors = typeof AppTheme.colors;

/**
 * Typed hook to access app colors from React Navigation theme.
 * Must be called inside a component rendered within NavigationContainer.
 */
export function useAppColors(): AppColors {
  const { colors } = useTheme();
  return colors as unknown as AppColors;
}
