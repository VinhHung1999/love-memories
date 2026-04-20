import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { DEFAULTS, DensityId, Mode, PaletteId, TypeSystemId } from '@/theme/tokens';

export type ModePref = 'system' | Mode;

type ThemeState = {
  palette: PaletteId;
  mode: ModePref;
  type: TypeSystemId;
  density: DensityId;
  hydrated: boolean;
};

type ThemeActions = {
  hydrate: () => Promise<void>;
  setPalette: (p: PaletteId) => void;
  setMode: (m: ModePref) => void;
  setType: (t: TypeSystemId) => void;
  setDensity: (d: DensityId) => void;
};

const STORAGE_KEY = '@memoura/theme/v1';

type Persisted = Pick<ThemeState, 'palette' | 'mode' | 'type' | 'density'>;

async function persist(state: Persisted) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota / serialization failure — swallow, next write will retry
  }
}

export const useThemeStore = create<ThemeState & ThemeActions>((set, get) => ({
  palette: DEFAULTS.palette,
  mode: DEFAULTS.mode,
  type: DEFAULTS.type,
  density: DEFAULTS.density,
  hydrated: false,

  // T288: lifted from ThemeProvider so the root layout can keep splash up
  // until BOTH authStore + themeStore have settled. Same STORAGE_KEY as the
  // pre-T288 ThemeProvider, so existing user prefs round-trip unchanged.
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        set({
          palette: parsed.palette ?? DEFAULTS.palette,
          mode: parsed.mode ?? DEFAULTS.mode,
          type: parsed.type ?? DEFAULTS.type,
          density: parsed.density ?? DEFAULTS.density,
        });
      }
    } catch {
      // corrupt cache — keep defaults
    } finally {
      set({ hydrated: true });
    }
  },

  setPalette: (palette) => {
    set({ palette });
    const { mode, type, density } = get();
    void persist({ palette, mode, type, density });
  },

  setMode: (mode) => {
    set({ mode });
    const { palette, type, density } = get();
    void persist({ palette, mode, type, density });
  },

  setType: (type) => {
    set({ type });
    const { palette, mode, density } = get();
    void persist({ palette, mode, type, density });
  },

  setDensity: (density) => {
    set({ density });
    const { palette, mode, type } = get();
    void persist({ palette, mode, type, density });
  },
}));
