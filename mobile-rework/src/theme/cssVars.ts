import { Palette } from './tokens';

// Converts a hex (#RRGGBB) or rgba(...) string to the "r g b" channel triple
// that tailwind's `rgb(var(--x) / <alpha-value>)` syntax needs. All current
// tokens are hex (T293: line/lineSoft were rgba originally; the alpha was
// silently stripped here, so borders rendered solid instead of as soft
// hairlines — fixed by pre-composing against bg in tokens.ts). The rgba()
// branch below is kept as defence: if a future token is rgba, the alpha is
// intentionally dropped — prefer pre-composed hex for theme tokens.
function toRgbChannels(value: string): string {
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    const n =
      hex.length === 3
        ? hex
            .split('')
            .map((c) => c + c)
            .join('')
        : hex;
    const r = parseInt(n.slice(0, 2), 16);
    const g = parseInt(n.slice(2, 4), 16);
    const b = parseInt(n.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
  }
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(',').map((s) => parseInt(s.trim(), 10));
    return `${r} ${g} ${b}`;
  }
  return '0 0 0';
}

// Keys here must line up 1:1 with the `colors` section of tailwind.config.js.
export function paletteToCssVars(p: Palette): Record<string, string> {
  return {
    '--color-bg': toRgbChannels(p.bg),
    '--color-bg-elev': toRgbChannels(p.bgElev),
    '--color-surface': toRgbChannels(p.surface),
    '--color-surface-alt': toRgbChannels(p.surfaceAlt),
    '--color-ink': toRgbChannels(p.ink),
    '--color-ink-soft': toRgbChannels(p.inkSoft),
    '--color-ink-mute': toRgbChannels(p.inkMute),
    '--color-primary': toRgbChannels(p.primary),
    '--color-primary-deep': toRgbChannels(p.primaryDeep),
    '--color-primary-soft': toRgbChannels(p.primarySoft),
    '--color-secondary': toRgbChannels(p.secondary),
    '--color-secondary-soft': toRgbChannels(p.secondarySoft),
    '--color-accent': toRgbChannels(p.accent),
    '--color-accent-soft': toRgbChannels(p.accentSoft),
    '--color-hero-a': toRgbChannels(p.heroA),
    '--color-hero-b': toRgbChannels(p.heroB),
    '--color-hero-c': toRgbChannels(p.heroC),
    '--color-line': toRgbChannels(p.line),
    '--color-line-soft': toRgbChannels(p.lineSoft),
    '--color-line-on-surface': toRgbChannels(p.lineOnSurface),
    '--color-line-soft-on-surface': toRgbChannels(p.lineSoftOnSurface),
  };
}
