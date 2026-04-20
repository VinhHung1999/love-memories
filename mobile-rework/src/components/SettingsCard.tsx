import { Children, Fragment, type ReactNode } from 'react';
import { View } from 'react-native';

// T340 (Sprint 61) — wrapper for the Profile settings list (see prototype
// more-screens.jsx:71). Rounded-3xl surface-on-bg container with 1px line
// dividers between rows. We insert the dividers ourselves so SettingsRow
// stays position-agnostic and can be re-used in other settings screens later
// without border state leaking in.

type Props = {
  children: ReactNode;
  className?: string;
};

export function SettingsCard({ children, className }: Props) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View
      className={`rounded-3xl bg-surface border border-line-on-surface overflow-hidden ${className ?? ''}`}
    >
      {items.map((child, i) => (
        <Fragment key={i}>
          {child}
          {i < items.length - 1 ? <View className="h-px bg-line" /> : null}
        </Fragment>
      ))}
    </View>
  );
}
