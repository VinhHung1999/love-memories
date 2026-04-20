import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 60 T286 — final commit screen. Tap-to-enter:
//   1. PATCH /api/auth/me/onboarding-complete — T301 server-side commit so a
//      re-login on a fresh install skips the wizard (replaces the ad-hoc
//      useOnboardingResume couple-probe).
//   2. setOnboardingComplete(true) — flip local gate for instant navigation.
//   3. router.replace('/(tabs)') — useAuthGate would also route us, but
//      replacing immediately avoids a one-frame blank as the gate effect
//      runs after the next render.
//
// The server PATCH is best-effort. If it fails (offline), the local flag still
// gets the user into the app; next successful /refresh or /me will reconcile.
//
// T330 (Build 26): joiner reaches this screen via PairJoin → Personalize.
// At validate-invite time the creator's name was usually still null in DB
// (creator hadn't submitted Personalize yet), so pendingPartner.name was
// stashed as ''. By the time joiner taps "Vào Memoura" the creator has
// almost always finished Personalize, so we re-fetch /api/couple here and
// surface the fresh partner name. Falls back through pendingPartner → null
// so the screen's existing fallback ("Người ấy") still wins if both fail.

type CoupleResponse = {
  users: { id: string; name: string | null }[];
};

export function useOnboardingDoneViewModel() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const pendingPartner = useAuthStore((s) => s.pendingPartner);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setPendingPartner = useAuthStore((s) => s.setPendingPartner);
  const [entering, setEntering] = useState(false);
  const [freshPartnerName, setFreshPartnerName] = useState<string | null>(null);

  // T330: one-shot fetch on mount (when paired). Failures are silent — the
  // pendingPartner / fallback chain still renders something reasonable.
  useEffect(() => {
    if (!user?.coupleId || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<CoupleResponse>('/api/couple');
        if (cancelled) return;
        const partner = res.users.find((u) => u.id !== user.id);
        if (partner?.name?.trim()) {
          setFreshPartnerName(partner.name);
        }
      } catch {
        // Network / 5xx — keep the existing pendingPartner fallback.
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
        // Offline / transient — keep going; the server will still say false
        // until a later sync, but the local flag unblocks the gate now.
      }
      await setOnboardingComplete(true);
      // T316: drop the transient inviter stash now that (tabs) will fetch the
      // real partner via /api/couple. Keeping it around would let stale name/
      // avatar leak into any screen still reading pendingPartner.
      setPendingPartner(null);
    } finally {
      router.replace('/(tabs)');
    }
  }, [entering, setOnboardingComplete, setPendingPartner, router]);

  return {
    selfName: user?.name ?? null,
    // T330: fresh fetch wins; pendingPartner is the validate-invite snapshot
    // (often empty for the joiner path). Screen handles the final fallback.
    partnerName: freshPartnerName ?? pendingPartner?.name ?? null,
    entering,
    onEnter,
  };
}
