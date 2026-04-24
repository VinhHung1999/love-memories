import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AnniversarySheet,
  type AnniversarySheetHandle,
  ComingSoonSheet,
  type ComingSoonSheetHandle,
  EditCoupleIdentitySheet,
  type EditCoupleIdentitySheetHandle,
  EditProfileSheet,
  type EditProfileSheetHandle,
} from '@/components';
import {
  type T367Anomaly,
  type T367Event,
  t367Analyze,
  t367StartRecording,
  t367StopRecording,
} from '@/devtools/t367Log';

// T367 recon harness — standalone route so we can repro the BottomSheet
// auto-reopen bug without navigating through auth → tabs → profile. Mount
// the 4 candidate sheets with dummy props + auto-fire a 3-timing × 20-cycle
// matrix on screen mount. Screen is __DEV__-only at the RootStack auth gate
// (see app/_layout.tsx:useAuthGate) so this route never ships to prod.
//
// Variants — we only test Variant A (imperative handle .close() →
// .dismiss()) because that's the production code path. Variant B
// (gesture-based close via .forceClose() / snapToIndex(-1)) would require
// expose the internal bsRef outside each sheet — too invasive for a recon
// pass, and @gorhom's imperative .dismiss() is the same native API a
// gesture-close triggers anyway.
//
// Matrix: 3 timings (50 / 150 / 350ms) × 4 sheets × 20 cycles = 240 events
// just from presentations (+ ~240 from dismisses + ~240 from onChange +
// ~240 from onDismiss = ~960 events/batch). Total runtime ≈
//   (open + sleep + close + sleep) × 4 sheets × 20 cycles × 3 timings
//   ≈ (2 × sleep) × 4 × 20 × 3 = 480 × sleep
//   → 50ms: 24s · 150ms: 72s · 350ms: 168s · total ≈ 4 min

type TimingProfile = { name: string; sleepMs: number };

const PROFILES: readonly TimingProfile[] = [
  { name: 'Tight 50ms', sleepMs: 50 },
  { name: 'Medium 150ms', sleepMs: 150 },
  { name: 'Slack 350ms', sleepMs: 350 },
];

const CYCLES_PER_SHEET = 20;

type BatchResult = {
  profile: string;
  totalEvents: number;
  cyclesCompleted: number;
  anomalies: T367Anomaly[];
  events: T367Event[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export default function T367HarnessScreen() {
  const insets = useSafeAreaInsets();
  const editIdentityRef = useRef<EditCoupleIdentitySheetHandle>(null);
  const anniversaryRef = useRef<AnniversarySheetHandle>(null);
  const editProfileRef = useRef<EditProfileSheetHandle>(null);
  const comingSoonRef = useRef<ComingSoonSheetHandle>(null);

  const [status, setStatus] = useState<string>('Warming up (2s)...');
  const [results, setResults] = useState<BatchResult[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function runBatch(profile: TimingProfile): Promise<BatchResult> {
      t367StartRecording();
      let cyclesCompleted = 0;

      for (let i = 0; i < CYCLES_PER_SHEET; i++) {
        if (cancelled) break;
        // EditCoupleIdentity
        editIdentityRef.current?.open('', '');
        await sleep(profile.sleepMs);
        editIdentityRef.current?.close();
        await sleep(profile.sleepMs);
        // Anniversary
        anniversaryRef.current?.open(null);
        await sleep(profile.sleepMs);
        anniversaryRef.current?.close();
        await sleep(profile.sleepMs);
        // EditProfile
        editProfileRef.current?.open();
        await sleep(profile.sleepMs);
        editProfileRef.current?.close();
        await sleep(profile.sleepMs);
        // ComingSoon
        comingSoonRef.current?.open();
        await sleep(profile.sleepMs);
        comingSoonRef.current?.close();
        await sleep(profile.sleepMs);

        cyclesCompleted = i + 1;
        setStatus(
          `${profile.name} — cycle ${cyclesCompleted}/${CYCLES_PER_SHEET}`,
        );
      }

      const events = t367StopRecording();
      const anomalies = t367Analyze(events);
      return {
        profile: profile.name,
        totalEvents: events.length,
        cyclesCompleted,
        anomalies,
        events,
      };
    }

    async function runMatrix() {
      // Give the 4 sheets a moment to mount and register their refs before
      // we start firing open() calls at them. Gorhom's BottomSheetModal
      // requires the provider to see the ref in its stack first.
      await sleep(2000);
      if (cancelled) return;

      const collected: BatchResult[] = [];
      for (const profile of PROFILES) {
        if (cancelled) break;
        setStatus(`Running ${profile.name}...`);
        const result = await runBatch(profile);
        collected.push(result);
        setResults([...collected]);
        // Between profiles let the gorhom stack fully settle.
        await sleep(800);
      }
      setStatus('Done');
      setDone(true);

      // Dump a grep-friendly report to console so metro log capture is enough.
      console.log('===== T367 HARNESS REPORT =====');
      collected.forEach((r) => {
        console.log(
          `[T367 REPORT] ${r.profile} | cycles ${r.cyclesCompleted}/${CYCLES_PER_SHEET} | events ${r.totalEvents} | anomalies ${r.anomalies.length}`,
        );
        r.anomalies.forEach((a, idx) => {
          console.log(
            `  #${idx + 1} sheet=${a.sheet} lastOpenAgoMs=${a.lastOpenPresentAgoMs ?? 'null'} precedingSame=${a.precedingSameSheet ?? 'null'}`,
          );
        });
      });
      console.log('===== T367 HARNESS END =====');
    }

    void runMatrix();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <View className="px-5">
        <Text className="font-displayMedium text-ink text-[22px]">
          T367 Harness
        </Text>
        <Text className="mt-1 font-body text-ink-soft text-[13px]">
          {status}
        </Text>
      </View>

      <ScrollView className="mt-4 px-5">
        {results.map((r) => (
          <View
            key={r.profile}
            className="mb-4 p-3 rounded-2xl border border-line-on-surface bg-surface"
          >
            <Text className="font-bodyBold text-ink text-[14px]">
              {r.profile}
            </Text>
            <Text className="font-body text-ink-soft text-[12px] mt-1">
              Cycles: {r.cyclesCompleted}/{CYCLES_PER_SHEET} · Events:{' '}
              {r.totalEvents} · Anomalies: {r.anomalies.length}
            </Text>
            {r.anomalies.slice(0, 5).map((a, i) => (
              <Text
                key={i}
                className="font-body text-primary-deep text-[11px] mt-1"
              >
                #{i + 1} {a.sheet} · lastOpen {a.lastOpenPresentAgoMs ?? 'null'}
                ms · preceding {a.precedingSameSheet ?? 'null'}
              </Text>
            ))}
          </View>
        ))}
        {done ? (
          <Text className="font-bodyBold text-ink text-[13px] mt-2">
            Dump emitted to console — grep {`"T367 REPORT"`}.
          </Text>
        ) : null}
      </ScrollView>

      {/* Offscreen sheet instances — never directly user-interacted; the
          effect above drives them via imperative handles. */}
      <EditCoupleIdentitySheet
        ref={editIdentityRef}
        onSavedName={() => {}}
        onSavedSlogan={() => {}}
      />
      <AnniversarySheet ref={anniversaryRef} onSaved={async () => {}} />
      <EditProfileSheet ref={editProfileRef} />
      <ComingSoonSheet ref={comingSoonRef} />
    </View>
  );
}
