import { vars } from 'nativewind';
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, View } from 'react-native';
import { useThemeStore, type ModePref } from '@/stores/themeStore';
import { paletteToCssVars } from './cssVars';
import {
  DENSITIES,
  Density,
  DensityId,
  Mode,
  Palette,
  PALETTES,
  PaletteId,
  TypeSystem,
  TYPE_SYSTEMS,
  TypeSystemId,
} from './tokens';

type ThemeContextValue = {
  palette: PaletteId;
  mode: ModePref;
  type: TypeSystemId;
  density: DensityId;
  resolvedMode: Mode;
  colors: Palette;
  typeSystem: TypeSystem;
  densityTokens: Density;
  setPalette: (p: PaletteId) => void;
  setMode: (m: ModePref) => void;
  setType: (t: TypeSystemId) => void;
  setDensity: (d: DensityId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// T288: persisted state lives in src/stores/themeStore.ts so the root layout
// can wait on hydration alongside authStore. ThemeProvider is now a pure
// derive-and-vars layer — no AsyncStorage, no internal state.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const palette = useThemeStore((s) => s.palette);
  const mode = useThemeStore((s) => s.mode);
  const type = useThemeStore((s) => s.type);
  const density = useThemeStore((s) => s.density);
  const setPalette = useThemeStore((s) => s.setPalette);
  const setMode = useThemeStore((s) => s.setMode);
  const setType = useThemeStore((s) => s.setType);
  const setDensity = useThemeStore((s) => s.setDensity);

  const resolvedMode: Mode =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = PALETTES[palette][resolvedMode];

  const value = useMemo<ThemeContextValue>(
    () => ({
      palette,
      mode,
      type,
      density,
      resolvedMode,
      colors,
      typeSystem: TYPE_SYSTEMS[type],
      densityTokens: DENSITIES[density],
      setPalette,
      setMode,
      setType,
      setDensity,
    }),
    [palette, mode, type, density, resolvedMode, colors, setPalette, setMode, setType, setDensity],
  );

  // `vars()` is the NativeWind v4 mechanism for declaring CSS custom properties
  // — analogous to CSS :root vars on the web. It's not user styling; it's the
  // theme-application surface that every descendant consumes via className
  // (`bg-bg`, `text-ink`, etc.). This is the ONE allowed place style= appears.
  const themeVars = useMemo(() => vars(paletteToCssVars(colors)), [colors]);

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1" style={themeVars}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

export const useAppColors = () => useTheme().colors;
export const useTypeSystem = () => useTheme().typeSystem;
export const useDensity = () => useTheme().densityTokens;
export const useAppMode = () => useTheme().resolvedMode;
export const useThemeControls = () => {
  const t = useTheme();
  return {
    palette: t.palette,
    mode: t.mode,
    type: t.type,
    density: t.density,
    setPalette: t.setPalette,
    setMode: t.setMode,
    setType: t.setType,
    setDensity: t.setDensity,
  };
};

export { useTheme };
