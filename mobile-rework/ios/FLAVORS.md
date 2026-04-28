# Memoura iOS — Dual flavor build flow

Sprint 67 introduced two iOS binaries that coexist on a tester's device:

| Variant | Bundle ID                  | Display name | URL scheme   | API host                | Universal Link |
| ------- | -------------------------- | ------------ | ------------ | ----------------------- | -------------- |
| `prod`  | `com.hungphu.memoura`      | Memoura      | `memoura`    | `api.memoura.app`       | `memoura.app`  |
| `dev`   | `com.hungphu.memoura.dev`  | Memoura Dev  | `memouradev` | `dev-api.memoura.app`   | `dev.memoura.app` |

Same icon — distinguishing only via display name (Boss directive 2026-04-27).

## Build + upload (internal app store)

```bash
cd mobile-rework
./deploy-appstore.sh           # both flavors (default)
./deploy-appstore.sh prod      # iOS prod only
./deploy-appstore.sh dev       # iOS dev only
./deploy-appstore.sh prod --skip-upload   # archive only
```

Both IPAs upload to `app-store.hungphu.work` for OTA install.

## How the script switches flavors

The Xcode project has ONE scheme + ONE source `Info.plist`. The dual-flavor
build uses **xcodebuild build-setting overrides + PlistBuddy edits** instead
of per-flavor schemes / xcconfigs. Reasoning: minimal native config churn
(no prebuild, no per-flavor xcconfig files to drift), and the existing
project layout has no manual native edits to preserve.

For each flavor:

1. **JS bundle:** `APP_VARIANT=<flavor>` exported before `xcodebuild`. The
   "Bundle React Native code and images" build phase runs
   `react-native-xcode.sh` → `expo export:embed`, which re-evaluates
   `app.config.ts` with the right variant. `extra.apiUrl` + `extra.variant`
   land in the JS bundle. (Variant table lives in `app.config.ts →
   VARIANT_CONFIG`.)
2. **Native bundle ID:** `xcodebuild ... PRODUCT_BUNDLE_IDENTIFIER=<id>`
   override propagates because `Info.plist` declares
   `CFBundleIdentifier=$(PRODUCT_BUNDLE_IDENTIFIER)`.
3. **Display name:** `PlistBuddy -c "Set :CFBundleDisplayName ..."` patches
   the source `Info.plist` in place. Backed up to `Info.plist.bak` and
   restored on script exit (trap on EXIT/INT/TERM).
4. **URL scheme:** PlistBuddy patches
   `:CFBundleURLTypes:0:CFBundleURLSchemes:0` → `memoura` / `memouradev` and
   `:CFBundleURLTypes:0:CFBundleURLSchemes:1` → bundle ID. The Google OAuth
   reverse client ID at `:CFBundleURLTypes:1:...` is left untouched (same
   iOS client ID for both flavors v1 — see "Known limitations" below).
5. **Signing:** `ExportOptionsAdHoc.plist` uses `signingStyle=automatic` with
   no per-bundle-ID provisioning map. `-allowProvisioningUpdates` makes
   Xcode pick the matching ad-hoc profile from Apple Developer Portal at
   export time. Both profiles
   (`com.hungphu.memoura` and `com.hungphu.memoura.dev`) are pre-registered
   with the target tester UDIDs (Boss confirm 2026-04-27 Q1).
6. **Build number:** `agvtool what-version -terse` + bump once per script
   invocation; both flavors share the same build number for the run.
7. **Verify before upload:** unzip the IPA, read `Info.plist` via
   PlistBuddy, fail loudly if `CFBundleIdentifier` doesn't match the
   expected bundle ID. Catches a misconfigured override before the bytes
   leave the laptop.

The trap-based restore guarantees `Info.plist` returns to the prod default
even if the script aborts mid-build. Because of this, **never run two
copies of the script in parallel against the same checkout** — the second
run would race the first's PlistBuddy edits.

## Known limitations (v1)

| Item | Status | Notes |
| ---- | ------ | ----- |
| Google Sign-In on dev | broken | Same iOS OAuth client used for both flavors. Dev binary's Google login fails with "Audience is not a valid client ID". Backlog `B-dev-google-oauth` (P2) — register dev iOS OAuth client when needed. Apple Sign In + email/password work. |
| Push notifications on dev | needs BE env | Dev BE must run with `APNS_BUNDLE_ID=com.hungphu.memoura.dev` (currently set to prod bundle on the dev BE). See `.claude/rules/backend.md → APNS_BUNDLE_ID rule`. Backlog `B-dev-apns-bundle-id` (P2). |
| Universal Links | both domains in entitlements | `Memoura.entitlements` claims both `applinks:memoura.app` AND `applinks:dev.memoura.app` for both binaries. Refine to per-flavor if cross-binary routing becomes ambiguous. |
| Android dual flavor | parked | No release keystore yet (B20). `deploy-appstore.sh android` builds prod-only via gradle debug-keystore signing. Re-visit when B20 ships. |

## Testing two binaries on the same device

After `./deploy-appstore.sh all` succeeds, both IPAs land at
`app-store.hungphu.work`. Install both from the OTA links — iOS treats
them as separate apps because the bundle IDs differ. Home screen shows two
icons labeled `Memoura` and `Memoura Dev`. Each opens its own data store
(zero shared state), and each hits its respective API host.

## Common failures

- **"No matching provisioning profile found"** — UDID missing from the
  matching ad-hoc profile. Add the device in Apple Developer Portal under
  the right App ID, regenerate the profile, retry. `-allowProvisioningUpdates`
  picks it up automatically.
- **"BadDeviceToken" on push** — `APNS_BUNDLE_ID` on the BE doesn't match
  the IPA's bundle. Update the BE env var and `pm2 restart`.
- **App opens but stays on splash** — JS bundle missing the variant config.
  Confirm `APP_VARIANT` was exported before xcodebuild; without it,
  `app.config.ts → resolveVariant()` falls back to `prod` and the dev
  binary points at prod API.
- **Two binaries fight over `memoura://`** — URL scheme patch didn't apply.
  Inspect the IPA via `unzip` + PlistBuddy `Print :CFBundleURLTypes` to
  verify the per-flavor scheme baked in.
