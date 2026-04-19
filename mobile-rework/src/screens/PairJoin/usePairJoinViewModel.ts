import { useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Linking, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError, apiClient } from '@/lib/apiClient';
import { parseMemouraUrl } from '@/lib/deepLink';
import { useAuthStore } from '@/stores/authStore';

// Sprint 60 T285. 8-cell hex input (BE generates `randomBytes(4).toString('hex')`,
// see backend/src/services/CoupleService.ts#generateInvite). Public preview via
// GET /api/couple/validate-invite?code=… debounced ~400ms after every change to
// surface partner name early. Submit hits POST /api/couple/join with body
// `{ inviteCode }` (NOT `code`) — see backend/src/validators/coupleSchemas.ts.
//
// Code arrives via:
//   1. Route param `?code=…` from PairChoice (post-auth deep-link consumer)
//   2. Manual cell-by-cell entry
//   3. Paste — accepts mixed-case, spaces, even >8 chars (we trim to 8)

const CODE_LEN = 8;
const HEX_RE = /[0-9a-f]/i;
const VALIDATE_DEBOUNCE_MS = 400;

type ValidateResponse = {
  valid: boolean;
  partnerName?: string | null;
  partnerAvatar?: string | null;
  error?: string;
};

type JoinResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    coupleId: string | null;
  };
  partnerName?: string | null;
};

type FormError =
  | { kind: 'invalidCode' }
  | { kind: 'codeUsed' }
  | { kind: 'alreadyPaired' }
  | { kind: 'rateLimited' }
  | { kind: 'network' };

const emptyCells = (): string[] => Array.from({ length: CODE_LEN }, () => '');

function sanitize(raw: string): string {
  // Strip non-hex (handles spaces, dashes, casing wrap), uppercase the rest,
  // cap at CODE_LEN. Mirrors what users get when they paste an invite link's
  // `?code=` query value or the formatted `XXXX XXXX` from PairInvite.
  const hex: string[] = [];
  for (const ch of raw) {
    if (HEX_RE.test(ch)) hex.push(ch);
    if (hex.length >= CODE_LEN) break;
  }
  return hex.join('').toUpperCase();
}

function fillCells(code: string): string[] {
  const cells = emptyCells();
  for (let i = 0; i < Math.min(code.length, CODE_LEN); i += 1) {
    cells[i] = code[i];
  }
  return cells;
}

export function usePairJoinViewModel() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ code?: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [cells, setCells] = useState<string[]>(emptyCells);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannedRef = useRef(false);
  const inputRefs = useRef<(TextInput | null)[]>(Array.from({ length: CODE_LEN }, () => null));

  const code = useMemo(() => cells.join(''), [cells]);
  const canSubmit = code.length === CODE_LEN && !submitting;

  // Route-param prefill (deep-link consumed via PairChoice → here). Ran once
  // on mount; route param is sanitized on the way in too in case the share
  // link comes in lowercased or with stray chars.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current) return;
    const raw = typeof params.code === 'string' ? params.code : null;
    if (!raw) return;
    const sanitized = sanitize(raw);
    if (!sanitized) return;
    prefilledRef.current = true;
    setCells(fillCells(sanitized));
  }, [params.code]);

  // Debounced validate — fires only when code is full. We don't show inline
  // errors on validate failure (saves a noisy red flash mid-typing); join
  // handler maps the real failure path to formError.
  useEffect(() => {
    if (code.length !== CODE_LEN) {
      setPartnerName(null);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const res = await apiClient.get<ValidateResponse>(
          `/api/couple/validate-invite?code=${encodeURIComponent(code.toLowerCase())}`,
          { skipAuth: true },
        );
        if (cancelled) return;
        if (res.valid) {
          setPartnerName(res.partnerName ?? null);
        } else {
          setPartnerName(null);
        }
      } catch {
        // Silent — inline preview is best-effort. Submit still gates the flow.
        if (!cancelled) setPartnerName(null);
      }
    }, VALIDATE_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [code]);

  const focusCell = useCallback((index: number) => {
    const target = inputRefs.current[index];
    if (target) target.focus();
  }, []);

  const setCellRef = useCallback((index: number, ref: TextInput | null) => {
    inputRefs.current[index] = ref;
  }, []);

  const onChangeCell = useCallback(
    (index: number, value: string) => {
      // Paste path: any input >1 char (or any sanitized output >1) means a
      // multi-char paste landed in this cell — fan out across cells starting
      // here, focus next-empty.
      const sanitized = sanitize(value);
      if (sanitized.length === 0) {
        // Pure-deletion or non-hex char: clear THIS cell only.
        setCells((prev) => {
          if (!prev[index]) return prev;
          const next = [...prev];
          next[index] = '';
          return next;
        });
        setFormError(null);
        return;
      }
      if (sanitized.length === 1 && value.length <= 1) {
        // Normal single-char entry — write + advance.
        setCells((prev) => {
          const next = [...prev];
          next[index] = sanitized;
          return next;
        });
        setFormError(null);
        if (index < CODE_LEN - 1) focusCell(index + 1);
        return;
      }
      // Paste — distribute across cells from `index`, ignore overflow.
      setCells((prev) => {
        const next = [...prev];
        for (let i = 0; i < sanitized.length && index + i < CODE_LEN; i += 1) {
          next[index + i] = sanitized[i];
        }
        return next;
      });
      setFormError(null);
      const landing = Math.min(index + sanitized.length, CODE_LEN - 1);
      focusCell(landing);
    },
    [focusCell],
  );

  const onKeyPress = useCallback(
    (index: number, key: string) => {
      // Backspace on an empty cell → jump to previous and clear it. Mirrors
      // iOS native OTP behavior so users don't get stuck deleting char-by-char.
      if (key !== 'Backspace') return;
      setCells((prev) => {
        if (prev[index]) {
          const next = [...prev];
          next[index] = '';
          return next;
        }
        if (index === 0) return prev;
        const next = [...prev];
        next[index - 1] = '';
        return next;
      });
      if (!cells[index] && index > 0) focusCell(index - 1);
    },
    [cells, focusCell],
  );

  const submitCode = useCallback(
    async (target: string) => {
      if (target.length !== CODE_LEN) return;
      setFormError(null);
      setSubmitting(true);
      try {
        const res = await apiClient.post<JoinResponse>('/api/couple/join', {
          inviteCode: target.toLowerCase(),
        });
        await setSession({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          user: {
            id: res.user.id,
            email: res.user.email,
            name: res.user.name,
            avatarUrl: res.user.avatar,
            coupleId: res.user.coupleId,
          },
        });
        // Both inviter and joiner walk T286 (Personalize → Permissions →
        // OnboardingDone) — display name + permissions are per-user, and
        // OnboardingDone owns the explicit setOnboardingComplete(true) commit.
        // Spec: docs/specs/sprint-60-pairing.md §"Joiner flow".
        router.replace('/(auth)/personalize');
      } catch (err) {
        if (err instanceof ApiError) {
          // BE collapses all logical join failures into 400 with distinct
          // messages (see backend/src/services/CoupleService.ts#joinCouple).
          // Pattern-match the message; fall back to invalidCode for any 4xx
          // we can't classify so the user knows to recheck the code.
          if (err.status === 0) {
            setFormError({ kind: 'network' });
          } else if (err.status === 429) {
            setFormError({ kind: 'rateLimited' });
          } else if (err.status === 400) {
            const msg = err.message.toLowerCase();
            if (msg.includes('already part of a couple')) setFormError({ kind: 'alreadyPaired' });
            else if (msg.includes('already has 2 members')) setFormError({ kind: 'codeUsed' });
            else setFormError({ kind: 'invalidCode' });
          } else if (err.status >= 500) {
            setFormError({ kind: 'network' });
          } else {
            setFormError({ kind: 'invalidCode' });
          }
        } else {
          setFormError({ kind: 'network' });
        }
      } finally {
        setSubmitting(false);
      }
    },
    [router, setSession],
  );

  const onSubmit = useCallback(() => {
    if (!canSubmit) return;
    void submitCode(code);
  }, [canSubmit, code, submitCode]);

  // T289 §4 — "Scan their QR code". Camera permission is requested lazily on
  // tap (Boss preference: never prompt before user expresses intent). Three
  // outcomes:
  //   granted → open scanner overlay
  //   denied (can ask again) → re-request, fall through if granted
  //   denied (canAskAgain=false) → settings-deeplink dialog
  const onOpenScanner = useCallback(async () => {
    if (scanning) return;
    let perm = cameraPermission;
    if (!perm || (!perm.granted && perm.canAskAgain)) {
      perm = await requestCameraPermission();
    }
    if (perm?.granted) {
      scannedRef.current = false;
      setScanning(true);
      return;
    }
    Alert.alert(
      t('onboarding.pairing.join.scan.permissionTitle'),
      t('onboarding.pairing.join.scan.permissionBody'),
      [
        { text: t('onboarding.pairing.join.scan.permissionCancel'), style: 'cancel' },
        {
          text: t('onboarding.pairing.join.scan.permissionOpenSettings'),
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ],
    );
  }, [cameraPermission, requestCameraPermission, scanning, t]);

  const onCloseScanner = useCallback(() => {
    setScanning(false);
  }, []);

  // expo-camera fires onBarcodeScanned for every frame that contains a code —
  // gate via scannedRef so we only handle the first hit per session. Accepts
  // both Universal Link payloads and plain hex (sticker scans, screenshots).
  const onScanned = useCallback(
    (raw: string) => {
      if (scannedRef.current) return;
      const fromUrl = parseMemouraUrl(raw);
      const codeFromUrl = fromUrl?.name === 'pair-join' ? fromUrl.params.code : undefined;
      const candidate = sanitize(codeFromUrl ?? raw);
      if (candidate.length !== CODE_LEN) {
        // Not a Memoura QR — keep scanner open, surface a one-shot toast-like
        // error in the form area so user knows the scan happened.
        setFormError({ kind: 'invalidCode' });
        return;
      }
      scannedRef.current = true;
      setCells(fillCells(candidate));
      setScanning(false);
      void submitCode(candidate);
    },
    [submitCode],
  );

  return {
    cells,
    partnerName,
    submitting,
    canSubmit,
    formError,
    scanning,
    onChangeCell,
    onKeyPress,
    setCellRef,
    onSubmit,
    onOpenScanner,
    onCloseScanner,
    onScanned,
  };
}
