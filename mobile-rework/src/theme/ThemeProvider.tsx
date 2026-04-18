import AsyncStorage from '@react-native-async-storage/async-storage';
import { vars } from 'nativewind';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import { paletteToCssVars } from './cssVars';
import {
  DEFAULTS,
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

type ModePref = 'system' | Mode;

type ThemeState = {
  palette: PaletteId;
  mode: ModePref;
  type: TypeSystemId;
  density: DensityId;
};

type ThemeContextValue = ThemeState & {
  resolvedMode: Mode;
  colors: Palette;
  typeSystem: TypeSystem;
  densityTokens: Density;
  setPalette: (p: PaletteId) => void;
  setMode: (m: ModePref) => void;
  setType: (t: TypeSystemId) => void;
  setDensity: (d: DensityId) => void;
};

const STORAGE_KEY = '@memoura/theme/v1';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [state, setState] = useState<ThemeState>({
    palette: DEFAULTS.palette,
    mode: DEFAULTS.mode,
    type: DEFAULTS.type,
    density: DEFAULTS.density,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ThemeState>;
          setState((s) => ({ ...s, ...parsed }));
        }
      } catch {
        // corrupt cache — fall back to defaults
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const resolvedMode: Mode =
    state.mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : state.mode;
  const colors = PALETTES[state.palette][resolvedMode];

  const value = useMemo<ThemeContextValue>(
    () => ({
      ...state,
      resolvedMode,
      colors,
      typeSystem: TYPE_SYSTEMS[state.type],
      densityTokens: DENSITIES[state.density],
      setPalette: (palette) => setState((s) => ({ ...s, palette })),
      setMode: (mode) => setState((s) => ({ ...s, mode })),
      setType: (type) => setState((s) => ({ ...s, type })),
      setDensity: (density) => setState((s) => ({ ...s, density })),
    }),
    [state, resolvedMode, colors],
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
