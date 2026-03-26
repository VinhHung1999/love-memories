# Bugs & Lessons Learned

## Resolved Bugs

### BottomSheetTextInput required inside @gorhom/bottom-sheet (Sprint 48)
- **Cause:** Plain `TextInput` inside bottom sheet doesn't trigger keyboard avoiding
- **Fix:** Use `BottomSheetTextInput` from `@gorhom/bottom-sheet`, or pass `bottomSheet` prop to shared `Input` component

### @rnmapbox/maps UserLocation crash on iOS 26 (Sprint 52)
- **Cause:** `animated` prop triggers `Animated.Value.addListener()` conflicting with Reanimated v4's `__callListeners` patch
- **Fix:** Set `animated={false}` on `<UserLocation>`

### @gorhom/bottom-sheet v5 BottomSheetModal unresponsive on iOS (Sprint 51)
- **Cause:** `transparentModal` native screen container intercepts all touches on the portal layer
- **Fix:** Add `containerComponent` using `FullWindowOverlay` from `react-native-screens` (iOS only) in `AppBottomSheet.tsx`

### xcodebuild exportArchive: P8 key format + ASC API key role (Sprint 55)
- **Cause 1:** Apple P8 key downloaded as SEC1 format (`BEGIN EC PRIVATE KEY`) — xcodebuild CryptoKit rejects it with `invalidASN1Object`
- **Fix 1:** Convert with `openssl pkcs8 -topk8 -nocrypt -in key.p8 -out key_pkcs8.p8`; or place key in `~/.private_keys/` (xcodebuild default path, Apple provides PKCS#8 there)
- **Cause 2:** ASC API key with insufficient role ("Developer") → "No Accounts with App Store Connect Access"
- **Fix 2:** ASC portal → Users & Access → Integrations → API Key → role must be **App Manager** or **Admin**

### useAppColors() inside Reanimated worklets (Sprint 49)
- **Cause:** Hook values must be captured outside `useAnimatedStyle` — can't call hooks inside worklets
- **Fix:** Call `const colors = useAppColors()` in component scope, then reference `colors.primary` inside the worklet

### react-native-config not loading in builds (Sprint 53)
- **Cause:** Build phase script wasn't running every build in Xcode
- **Fix:** Force react-native-config build phase to run every build (not just when changed)

### REACT_NATIVE_PRODUCTION=1 in Podfile crashes iOS 26 (Sprint 53)
- **Cause:** Adding this flag globally to all pod targets causes EXC_BAD_ACCESS in SafeAreaProvider on iOS 26/Xcode 26
- **Fix:** Never add this flag globally — standard Debug/Release configs don't need it

### Mapbox token in Info.plist triggers GitHub secret scanning
- **Cause:** Real `pk.*` token committed to Info.plist
- **Fix:** Use `$(MAPBOX_ACCESS_TOKEN)` placeholder — set real token in Xcode build settings or xcconfig (gitignored)

### iOS release build blocked by expired cert + missing Associated Domains (Sprint 55)
- **Cause:** Apple Development cert expired/revoked; provisioning profile missing Associated Domains entitlement (needed for universal links)
- **Fix:** Boss opens Xcode → project → Signing & Capabilities → enable "Automatically manage signing" → Xcode regenerates valid cert + profile
- **Lesson:** Disabling entitlements does NOT fix cert expiry — the two issues are independent. Always check the actual error: "Signing certificate is invalid" = cert problem (needs Xcode regeneration), not an entitlements problem
- **Lesson 2:** Portal fix ≠ Mac keychain fix. Even after revoking/regenerating on developer.apple.com, the Mac still has the old revoked certs. Boss must open Xcode → Settings → Accounts → Manage Certificates → '+' → Apple Development to install the new cert locally. Use `security find-identity -v -p codesigning` to verify — all entries must NOT have CSSMERR_TP_CERT_REVOKED before building.

---

## Lessons Learned

### NativeWind: new components default to style props — must be converted (Sprint 55)
- **Pattern:** AI-generated components often use `style={{}}` for everything — violates Boss rule
- **Rule:** Only 2 exceptions allowed: `Animated.Value` transforms/opacity + dynamic runtime values (e.g. `top: insets.top + 8`)
- **Fix:** Replace all other style props with `className` before committing

### handleAttachToMoment must capture image before navigating (Sprint 55)
- **Wrong:** `navigation.navigate('MainTabs')` — discards the photo
- **Correct:** `const uri = await captureImage(); navigation.navigate('MomentsTab', { screen: 'BottomSheet', params: { screen: CreateMomentSheet, props: { initialPhoto: { uri, mimeType: 'image/jpeg' } } } })`

### i18n interpolation uses double braces
- `react-i18next` requires `{{variableName}}` — single braces `{n}` render literally

### Dark mode colors need separate tailwind tokens
- Light tokens (e.g. `bg-bgCard`) don't auto-invert — must use explicit `dark:bg-darkBgCard` tokens
- Dark palette tokens defined in `tailwind.config.js` as `darkBaseBg`, `darkBgCard`, etc.

### Reanimated v4 + useAnimatedStyle
- Values from hooks must be destructured before the worklet — they cannot be read inside `useAnimatedStyle(() => {...})`

### LinearGradient style prop behaves inconsistently
- **Cause:** `react-native-linear-gradient`'s `LinearGradient` does not apply `style` like a `View` — layout, border, and padding may break
- **Fix:** Move styles to an inner `<View>` wrapper instead of placing them on `LinearGradient` directly
  ```tsx
  // ❌ Wrong
  <LinearGradient colors={...} style={{ borderRadius: 12, padding: 16 }}>
  // ✅ Correct
  <LinearGradient colors={...}>
    <View style={{ borderRadius: 12, padding: 16 }}>
  ```

### react-native-view-shot RN 0.84 incompatibility
- See [viewshot-rn084.md](viewshot-rn084.md) — view-shot@4.x uses `RCTScrollView` removed in RN 0.84 Fabric; upgrade to `react-native-view-shot@5.0.0-alpha.3` or later

### NitroAudioRecorderPlayer + react-native-vision-camera: no iOS Simulator support
- **Cause:** Both are native-only modules — linker fails on `iphonesimulator` target
- **Fix:** Never run `npx react-native run-ios` to verify flows using these modules; always test on physical device
- **Workaround:** Release build with `generic/platform=iOS` succeeds; install via `xcrun devicectl`

### RN tab navigation must go through MainTabs (Sprint 55)
- See [rn-tab-navigation-from-stack.md](rn-tab-navigation-from-stack.md) — navigating to tab screens from AppStack level silently fails unless wrapped in `MainTabs`; tab screens are children of MainTabs, not direct children of AppStack

### Shadow + overflow:hidden must be on separate elements (Sprint 55)
- **Cause:** Putting `shadow*` props and `overflow: 'hidden'` on the same element causes borderRadius clipping to fail (shadow gets clipped or gradient shape breaks)
- **Fix:** Shadow on outer `Animated.View`, `overflow: 'hidden'` on inner `Pressable`/`View` that directly wraps `LinearGradient`
- **Pattern:**
  ```tsx
  <Animated.View style={{ borderRadius: SIZE/2, shadowColor: '...', shadowOpacity: 0.4 }}>
    <Pressable style={{ borderRadius: SIZE/2, overflow: 'hidden' }}>
      <LinearGradient style={{ flex: 1 }}>...</LinearGradient>
    </Pressable>
  </Animated.View>
  ```
