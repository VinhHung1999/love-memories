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
import React from 'react';
import { DefaultTheme } from '@react-navigation/native';
import { ThemeContext } from '@react-navigation/core';

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
  },
} as const;

export type AppColors = typeof AppTheme.colors;

/**
 * Typed hook to access app colors.
 * Uses React.useContext directly (returns undefined instead of throwing)
 * with fallback to static AppTheme.colors — safe during screen transitions
 * where NavigationContainer context may be temporarily unavailable.
 */
export function useAppColors(): AppColors {
  const theme = React.useContext(ThemeContext);
  return ((theme?.colors ?? AppTheme.colors) as unknown) as AppColors;
}
