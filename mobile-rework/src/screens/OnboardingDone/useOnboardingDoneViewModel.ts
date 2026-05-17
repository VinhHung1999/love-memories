import { CommonActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 60 T286 → Sprint 68 T468 — final commit screen.
//
// Tap-to-enter sequence:
//   1. PATCH /api/auth/me/onboarding-complete — server-side commit so a
//      re-login on a fresh install skips the wizard.
//   2. setOnboardingComplete(true) — flip local gate for instant nav.
//   3. CommonActions.reset on the ROOT navigator into '(tabs)'. Replaces
//      the Sprint 60 router.replace; per memory bugs_navigation_maintabs
//      and the Profile/signOut pattern, replace leaves the prior native
//      stack alive — iOS edge-swipe-back can return the user to a
//      destructive auth screen. Reset truly drops the (auth) stack.
//
// The server PATCH is best-effort — offline path still flips the local
// flag and the next /refresh or /me reconciles.
//
// T330 carry-over: joiner reaches this screen via PairJoin → Personalize.
// At validate-invite time the creator's name was usually still null in DB,
// so pendingPartner.name was stashed as ''. By tap-time the creator has
// almost always finished Personalize, so we re-fetch /api/couple here and
// surface the fresh partner name.
//
// T468 also fetches /api/settings/app_slogan once on mount so the body
// can read couple-personal copy when the creator filled it in CoupleForm.
// Falls back to the generic default when no slogan was set.

type CoupleResponse = {
  users: { id: string; name: string | null }[];
  anniversaryDate: string | null;
};

type SettingResponse = { key: string; value: string | null };

// Sprint 68 D4prime — render the anniversary as DD.MM.YYYY for the
// "since" pill. Falls back to the empty string so the screen surfaces a
// "since today" copy when the value is missing.
function formatAnniversary(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
}

export function useOnboardingDoneViewModel() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const pendingPartner = useAuthStore((s) => s.pendingPartner);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setPendingPartner = useAuthStore((s) => s.setPendingPartner);
  const [entering, setEntering] = useState(false);
  const [freshPartnerName, setFreshPartnerName] = useState<string | null>(null);
  const [slogan, setSlogan] = useState<string | null>(null);
  const [anniversaryLabel, setAnniversaryLabel] = useState<string>('');

  // T330 + T468: one-shot bootstrap on mount (when paired). Fetches partner
  // name + couple slogan in parallel. Failures are silent — the partner
  // name falls back through pendingPartner → screen-level fallback, and the
  // slogan field defaults to null which surfaces the generic body copy.
  useEffect(() => {
    if (!user?.coupleId || !user?.id) return;
    let cancelled = false;
    (async () => {
      const [coupleResult, sloganResult] = await Promise.allSettled([
        apiClient.get<CoupleResponse>('/api/couple'),
        apiClient.get<SettingResponse>('/api/settings/app_slogan'),
      ]);
      if (cancelled) return;
      if (coupleResult.status === 'fulfilled') {
        const partner = coupleResult.value.users.find((u) => u.id !== user.id);
        if (partner?.name?.trim()) {
          setFreshPartnerName(partner.name);
        }
        const formatted = formatAnniversary(coupleResult.value.anniversaryDate);
        if (formatted) setAnniversaryLabel(formatted);
      }
      if (sloganResult.status === 'fulfilled') {
        setSlogan(sloganResult.value.value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.coupleId, user?.id]);

  const onEnter = useCallback(async () => {
    if (entering) return;
    setEntering(true);
    try {
      try {
        await apiClient.patch('/api/auth/me/onboarding-complete', { value: true });
      } catch {
        // Offline / transient — keep going; the local flag unblocks the
        // gate now and the server will sync on the next /refresh / /me.
      }
      await setOnboardingComplete(true);
      // T316 carry-over: drop the transient inviter stash now that (tabs)
      // will fetch the real partner via /api/couple.
      setPendingPartner(null);
    } finally {
      // Cross-stack reset on the root navigator. Same pattern as Profile/
      // signOut (Sprint 61) — getParent() climbs from the (auth) Stack to
      // the root, then drops the auth screens entirely so iOS edge-swipe
      // can never return the user to a post-pair onboarding step.
      const root = navigation.getParent();
      root?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: '(tabs)' }],
        }),
      );
    }
  }, [entering, setOnboardingComplete, setPendingPartner, navigation]);

  return {
    selfName: user?.name ?? null,
    // T330: fresh fetch wins; pendingPartner is the validate-invite snapshot
    // (often empty for the joiner path). Screen handles the final fallback.
    partnerName: freshPartnerName ?? pendingPartner?.name ?? null,
    slogan,
    anniversaryLabel,
    entering,
    onEnter,
  };
}
