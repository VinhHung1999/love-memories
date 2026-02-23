/**
 * Shared action button primitives used across WishCard, StopCard, etc.
 * Keeps color + shape consistent across the app from one source of truth.
 */
import type { ReactNode, MouseEventHandler } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from 'lucide-react';

// ── ActionLink ────────────────────────────────────────────────────────────────
// Text-link style (no background). For navigation actions: Chỉ đường, Xem kỷ niệm, etc.

interface ActionLinkProps {
  /** External URL → renders <a target="_blank"> */
  href?: string;
  /** Internal route → renders React Router <Link> */
  to?: string;
  /** No href/to → renders <button> */
  onClick?: MouseEventHandler;
  icon?: ReactNode;
  label: string;
  color?: 'primary' | 'secondary';
}

const linkColorCls: Record<'primary' | 'secondary', string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
};

export function ActionLink({
  href,
  to,
  onClick,
  icon,
  label,
  color = 'secondary',
}: ActionLinkProps) {
  const cls = `text-xs ${linkColorCls[color]} hover:underline flex items-center gap-1`;
  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {icon}{label}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
        {icon}{label}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {icon}{label}
    </button>
  );
}

// ── ActionPill ────────────────────────────────────────────────────────────────
// Pill-shaped button. For primary actions: Xem link, Done, Đã đi!, etc.

type PillColor = 'primary' | 'secondary' | 'green';

interface ActionPillProps {
  href?: string;
  to?: string;
  onClick?: MouseEventHandler;
  icon?: ReactNode;
  label: string;
  color?: PillColor;
  /** Extra classes appended after base styles, e.g. "ml-auto" */
  className?: string;
  disabled?: boolean;
}

const pillColorCls: Record<PillColor, string> = {
  primary:   'bg-primary/10 text-primary hover:bg-primary/20',
  secondary: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  green:     'bg-green-50 text-green-600 hover:bg-green-100',
};

export function ActionPill({
  href,
  to,
  onClick,
  icon,
  label,
  color = 'secondary',
  className = '',
  disabled,
}: ActionPillProps) {
  const cls = `text-xs font-medium ${pillColorCls[color]} px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {icon}{label}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
        {icon}{label}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {icon}{label}
    </button>
  );
}

// ── DirectionsLink ────────────────────────────────────────────────────────────
// Shortcut: builds Google Maps directions URL + renders ActionLink with 🧭 icon.

interface DirectionsLinkProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  title?: string;
  /** Forwarded to the rendered <a> onClick, e.g. e.stopPropagation() */
  onClick?: MouseEventHandler;
}

function buildMapsUrl(
  lat?: number | null,
  lng?: number | null,
  address?: string | null,
  title?: string,
): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(title ?? '')}`;
}

export function DirectionsLink({ latitude, longitude, address, title, onClick }: DirectionsLinkProps) {
  if (latitude == null && !address) return null;
  return (
    <ActionLink
      href={buildMapsUrl(latitude, longitude, address, title)}
      icon={<Navigation className="w-3 h-3" />}
      label="Chỉ đường"
      color="secondary"
      onClick={onClick}
    />
  );
}
