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
    primary:      '#FF6B6B',   // active tab, header tint, links (Coral)
    background:   '#FFF9F5',   // screen background (Warm off-white)
    card:         '#FFFFFF',   // tab bar / header background
    text:         '#2D1B3D',   // default text (Warm dark purple-brown)
    border:       '#E8DFE8',   // tab bar border, header border
    notification: '#FF6B6B',   // badge color

    // ── Brand palette (gradient-first design) ─────────────────────────────
    // Coral Blush (Primary)
    primaryLight:   '#FF8E8E',
    primaryLighter: '#FFB4B4',
    primaryShadow:  'rgba(255,107,107,0.40)',
    primaryMuted:   'rgba(255,107,107,0.12)',

    // Peachy Gold (Secondary)
    secondary:      '#FFD93D',
    secondaryMid:   '#FFC857',
    secondaryDark:  '#FFB84D',
    secondaryMuted: 'rgba(255,217,61,0.12)',

    // Lavender Dream (Accent)
    accent:         '#C7CEEA',
    accentMid:      '#B4B8D5',
    accentDark:     '#A5A9C9',
    accentMuted:    'rgba(199,206,234,0.12)',

    // Mint Fresh (Success/Food)
    success:        '#95E1D3',
    successMid:     '#A8E6CF',
    successLight:   '#BCE9D6',
    successBg:      'rgba(149,225,211,0.10)',

    // Violet Expense (Accent 2)
    expensePurple:     '#B983FF',
    expensePurpleMid:  '#A068F5',
    expensePurpleDark: '#8B5CF6',

    // ── Text (warm purple-gray tones) ────────────────────────────────────
    textDark:  '#2D1B3D',  // Warm deep purple-brown
    textMid:   '#6B5570',  // Muted purple-gray
    textLight: '#9D8EA1',  // Lighter purple-gray

    // ── Input states ──────────────────────────────────────────────────────
    white:            '#FFFFFF',
    inputBg:          'rgba(255,255,255,0.90)',
    inputFocusBg:     '#FFFFFF',
    inputBorderFocus: 'rgba(255,107,107,0.50)',

    // ── Misc ─────────────────────────────────────────────────────────────
    starRating:  '#FFB84D',  // Peachy gold for stars

    // ── Status ────────────────────────────────────────────────────────────
    errorColor:  '#D94F58',
    errorBg:     'rgba(255,240,240,0.95)',

    // ── Neutral ───────────────────────────────────────────────────────────
    gray100:     '#F5F3F4',

    // ── Gradient Collections (for reference in components) ───────────────
    // Use these in LinearGradient components
    // Dashboard: ['#FF6B6B', '#FF8E8E', '#FFD93D']
    // Moments: ['#FFB4B4', '#C7CEEA', '#B4B8D5']
    // Food: ['#FFD93D', '#FFC857', '#A8E6CF']
    // Letters: ['#C7CEEA', '#B4B8D5', '#FFB4B4']
    // Expenses: ['#B983FF', '#A068F5', '#8B5CF6']
    // Stats: ['#FFE4EA', '#FFD4DE', '#FFC4D0']
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
