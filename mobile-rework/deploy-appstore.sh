#!/usr/bin/env bash
# deploy-appstore.sh — Build + upload Memoura to the internal App Store
# (app-store.hungphu.work).
#
# Internal App Store is the OTA-install path Boss uses for smoke tests —
# faster than TestFlight (no Apple processing wait) and works for non-TF
# testers. iOS ships an ad-hoc .ipa; Android ships a release .apk.
#
# Sprint 67 T450 — DUAL FLAVOR SUPPORT.
#
#   Variant         Bundle ID                       Display name   API host
#   prod (default)  com.hungphu.memoura             Memoura        api.memoura.app
#   dev             com.hungphu.memoura.dev         Memoura Dev    dev-api.memoura.app
#
# Usage:
#   ./deploy-appstore.sh              # iOS prod + dev (default = all)
#   ./deploy-appstore.sh prod         # iOS prod only
#   ./deploy-appstore.sh dev          # iOS dev only
#   ./deploy-appstore.sh all          # iOS prod + dev (alias of default)
#   ./deploy-appstore.sh android      # Android prod only (dev parked — see below)
#   ./deploy-appstore.sh prod --skip-upload
#
# Implementation notes (T450):
#   • PRODUCT_BUNDLE_IDENTIFIER is overridden at the xcodebuild command line.
#     Info.plist already uses $(PRODUCT_BUNDLE_IDENTIFIER), so the override
#     propagates without touching the pbxproj.
#   • CFBundleDisplayName is hardcoded "Memoura" in Info.plist and Xcode does
#     NOT honour `INFOPLIST_KEY_CFBundleDisplayName` when the source plist
#     already defines the key. Instead we PlistBuddy-edit the source plist
#     in place per build and restore on exit (trap). Safer than committing
#     two divergent plists.
#   • APP_VARIANT is exported before xcodebuild so the JS bundling phase
#     (`react-native-xcode.sh` → `expo export:embed`) reads app.config.ts
#     with the right variant — extra.apiUrl + extra.variant land in the
#     bundle.
#   • ExportOptionsAdHoc.plist uses signingStyle=automatic with no
#     per-bundle-ID provisioning map. Xcode picks the matching ad-hoc
#     profile at export time via `-allowProvisioningUpdates`. Both
#     profiles (com.hungphu.memoura and com.hungphu.memoura.dev) live in
#     the Apple Developer Portal — Boss confirmed 2026-04-27 (Q1).
#
# Pre-flight (iOS):
#   Both ad-hoc profiles need the target tester UDID registered. Bundle
#   sharing with the legacy `mobile/` track applies to prod only; the dev
#   bundle was newly registered for Sprint 67 — Boss verified UDIDs are in.
#
# Pre-flight (Android):
#   No app/release keystore for mobile-rework yet — gradle signs with debug
#   keystore (B20 backlog). Android dev flavor isn't wired here yet — keep
#   parking until B20 ships a real release keystore. Tracked separately as
#   T450-android follow-up.
#
# Rate limits:
#   app-store.hungphu.work has no Apple-style cap — upload freely. Files
#   >100MB must go via localhost:3457 (Cloudflare edge rejects >100MB
#   multipart).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_STORE_URL="${APP_STORE_URL:-http://localhost:3457}"
UPLOAD_SCRIPT="$HOME/.claude/skills/app-store-ops/scripts/upload.sh"
DESCRIPTION_BASE="Memoura rework $(date +%Y-%m-%d\ %H:%M)"

INFO_PLIST="$SCRIPT_DIR/ios/Memoura/Info.plist"
PROD_DISPLAY_NAME="Memoura"

TARGET="${1:-all}"
SKIP_UPLOAD=false
for arg in "$@"; do
  [[ "$arg" == "--skip-upload" ]] && SKIP_UPLOAD=true
done

echo "════════════════════════════════════════"
echo "  Memoura rework → internal App Store"
echo "  Target: $TARGET"
echo "  Store:  $APP_STORE_URL"
echo "════════════════════════════════════════"

FAILED=0
INSTALL_URLS=()

# ── Restore-on-exit trap ─────────────────────────────────────────────────────
# PlistBuddy edits CFBundleDisplayName in place; trap guarantees restoration
# even if the build aborts halfway. Backup is created lazily in build_ios.
restore_info_plist() {
  if [[ -n "${INFO_PLIST_BAK:-}" && -f "${INFO_PLIST_BAK}" ]]; then
    mv "${INFO_PLIST_BAK}" "$INFO_PLIST"
    echo "🔄 Info.plist restored"
  fi
}
trap restore_info_plist EXIT INT TERM

INFO_PLIST_BAK=""

# ── iOS per-flavor ───────────────────────────────────────────────────────────
build_ios() {
  local FLAVOR="$1"
  local BUNDLE_ID DISPLAY_NAME URL_SCHEME ARCHIVE_NAME EXPORT_NAME UPLOAD_LABEL

  case "$FLAVOR" in
    prod)
      BUNDLE_ID="com.hungphu.memoura"
      DISPLAY_NAME="Memoura"
      URL_SCHEME="memoura"
      ARCHIVE_NAME="Memoura"
      EXPORT_NAME="export-adhoc-prod"
      UPLOAD_LABEL="iOS prod"
      ;;
    dev)
      BUNDLE_ID="com.hungphu.memoura.dev"
      DISPLAY_NAME="Memoura Dev"
      URL_SCHEME="memouradev"
      ARCHIVE_NAME="Memoura-Dev"
      EXPORT_NAME="export-adhoc-dev"
      UPLOAD_LABEL="iOS dev"
      ;;
    *)
      echo "❌ unknown iOS flavor: $FLAVOR"
      return 1
      ;;
  esac

  cd "$SCRIPT_DIR/ios"

  local SCHEME="Memoura"
  local CONFIG="Release"
  local WORKSPACE="Memoura.xcworkspace"
  local TEAM_ID="DHGY59PZWW"
  local BUILD_DIR="./build"
  local ARCHIVE_PATH="$BUILD_DIR/${ARCHIVE_NAME}.xcarchive"
  local EXPORT_PATH="$BUILD_DIR/${EXPORT_NAME}"
  local EXPORT_PLIST="./ExportOptionsAdHoc.plist"

  # Bump build number once per script invocation, reused across flavors so
  # both binaries land at the same internal-store "release". Set BUILD_BUMPED
  # marker so the second flavor doesn't double-bump.
  local CURRENT_BUILD NEW_BUILD
  CURRENT_BUILD=$(agvtool what-version -terse)
  if [[ -z "${BUILD_BUMPED:-}" ]]; then
    NEW_BUILD=$((CURRENT_BUILD + 1))
    echo ""
    echo "⬆  iOS build: $CURRENT_BUILD → $NEW_BUILD (shared by all flavors this run)"
    agvtool new-version -all "$NEW_BUILD" > /dev/null
    export BUILD_BUMPED="$NEW_BUILD"
  else
    NEW_BUILD="$BUILD_BUMPED"
    echo ""
    echo "↪  Reusing iOS build $NEW_BUILD for $FLAVOR"
  fi

  # PlistBuddy edits to source Info.plist:
  #   • CFBundleDisplayName flips per flavor ("Memoura" ↔ "Memoura Dev")
  #     so the home-screen label distinguishes the two binaries.
  #   • CFBundleURLTypes[0].CFBundleURLSchemes[0,1] flip per flavor
  #     ("memoura" + "com.hungphu.memoura" ↔ "memouradev" +
  #     "com.hungphu.memoura.dev") so each binary registers its OWN
  #     custom URL scheme. Without this, both binaries would register
  #     `memoura://` and iOS would route to whichever was installed last.
  #   • Google OAuth reverse client ID (CFBundleURLTypes[1]) is left
  #     untouched — same Google iOS client ID used across both flavors
  #     for v1; dev-specific OAuth client deferred to backlog
  #     B-dev-google-oauth (P2). Dev binary's Google login will fail
  #     until that lands. Apple Sign In + email/password still work.
  #
  # Backup once per script run; trap restores prod-default on exit.
  if [[ -z "$INFO_PLIST_BAK" ]]; then
    INFO_PLIST_BAK="${INFO_PLIST}.bak"
    cp "$INFO_PLIST" "$INFO_PLIST_BAK"
  fi
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName ${DISPLAY_NAME}" "$INFO_PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:0 ${URL_SCHEME}" "$INFO_PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:1 ${BUNDLE_ID}" "$INFO_PLIST"

  echo "📦 Archiving $FLAVOR — bundleId=${BUNDLE_ID}, displayName=${DISPLAY_NAME}…"
  rm -rf "$ARCHIVE_PATH"
  APP_VARIANT="$FLAVOR" xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIG" \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_STYLE=Automatic \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    archive \
    -allowProvisioningUpdates \
    -quiet
  echo "✅ ${FLAVOR} archive"

  echo "📤 Exporting ad-hoc IPA (${FLAVOR})…"
  rm -rf "$EXPORT_PATH"
  xcodebuild \
    -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_PLIST" \
    -exportPath "$EXPORT_PATH" \
    -allowProvisioningUpdates \
    2>&1 | grep -v "^warning:" || true

  local IPA
  IPA=$(find "$EXPORT_PATH" -maxdepth 1 -name '*.ipa' | head -1)
  if [[ -z "$IPA" ]]; then
    echo "❌ ${FLAVOR} IPA not produced — check signing/profile for ${BUNDLE_ID}"
    return 1
  fi
  echo "✅ ${FLAVOR} IPA: $IPA"

  # Sanity: confirm the IPA actually carries the expected bundle ID +
  # display name. Catch a misconfigured override before uploading.
  local TMP_VERIFY="$BUILD_DIR/verify-${FLAVOR}"
  rm -rf "$TMP_VERIFY"
  mkdir -p "$TMP_VERIFY"
  unzip -q "$IPA" -d "$TMP_VERIFY"
  local APP_DIR
  APP_DIR=$(find "$TMP_VERIFY/Payload" -maxdepth 1 -name '*.app' | head -1)
  if [[ -n "$APP_DIR" && -f "$APP_DIR/Info.plist" ]]; then
    local IPA_BUNDLE_ID IPA_NAME
    IPA_BUNDLE_ID=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$APP_DIR/Info.plist" 2>/dev/null || echo "?")
    IPA_NAME=$(/usr/libexec/PlistBuddy -c "Print :CFBundleDisplayName" "$APP_DIR/Info.plist" 2>/dev/null || echo "?")
    echo "🔍 IPA verify: bundle=${IPA_BUNDLE_ID}, name=${IPA_NAME}"
    if [[ "$IPA_BUNDLE_ID" != "$BUNDLE_ID" ]]; then
      echo "❌ IPA bundle ID mismatch — expected ${BUNDLE_ID}, got ${IPA_BUNDLE_ID}"
      rm -rf "$TMP_VERIFY"
      return 1
    fi
    if [[ "$IPA_NAME" != "$DISPLAY_NAME" ]]; then
      echo "⚠  IPA display name mismatch — expected '${DISPLAY_NAME}', got '${IPA_NAME}'"
    fi
  fi
  rm -rf "$TMP_VERIFY"

  if $SKIP_UPLOAD; then
    echo "⏭  ${FLAVOR} upload skipped"
    return 0
  fi

  echo "🚀 Uploading ${FLAVOR} IPA to ${APP_STORE_URL}…"
  bash "$UPLOAD_SCRIPT" "$IPA" "${DESCRIPTION_BASE} (${UPLOAD_LABEL} build $NEW_BUILD)" "" "$APP_STORE_URL"
  INSTALL_URLS+=("${UPLOAD_LABEL}: see app-store.hungphu.work for new build $NEW_BUILD")
  echo "✅ ${FLAVOR} uploaded (build $NEW_BUILD)"
}

# ── Android (prod only — dev parked behind B20 keystore) ─────────────────────
build_android() {
  if [[ ! -d "$SCRIPT_DIR/android" ]]; then
    echo ""
    echo "⚠  android/ not generated yet. Run:"
    echo "     APP_VARIANT=prod npx expo prebuild --platform android"
    echo "   then retry. Skipping Android."
    return 0
  fi

  cd "$SCRIPT_DIR/android"

  echo ""
  echo "🤖 Building Android release APK (prod only — dev parked behind B20)…"
  ./gradlew assembleRelease -q
  echo "✅ Gradle build"

  local APK
  APK=$(find app/build/outputs/apk -name 'app-release.apk' -o -name 'app-*-release.apk' | head -1)
  if [[ -z "$APK" ]]; then
    echo "❌ APK not produced"
    return 1
  fi
  echo "✅ APK: $APK"

  if $SKIP_UPLOAD; then
    echo "⏭  Android upload skipped"
    return 0
  fi

  echo "🚀 Uploading APK to ${APP_STORE_URL}…"
  bash "$UPLOAD_SCRIPT" "$APK" "${DESCRIPTION_BASE} (Android prod)" "" "$APP_STORE_URL"
  INSTALL_URLS+=("Android prod: see app-store.hungphu.work")
  echo "✅ Android uploaded"
}

# ── Dispatch ─────────────────────────────────────────────────────────────────
case "$TARGET" in
  prod)
    build_ios prod || FAILED=1
    ;;
  dev)
    build_ios dev || FAILED=1
    ;;
  all)
    # Sequential: prod first (default app), dev second. PlistBuddy edits
    # restore between flavors so dev's display-name change doesn't bleed
    # into prod (and vice versa via the trap).
    build_ios prod || FAILED=1
    # Manually restore between flavors so build_ios's idempotent display-
    # name write starts from a clean prod baseline.
    if [[ -n "$INFO_PLIST_BAK" && -f "$INFO_PLIST_BAK" ]]; then
      cp "$INFO_PLIST_BAK" "$INFO_PLIST"
    fi
    build_ios dev || FAILED=1
    ;;
  ios)
    # Backwards-compat alias: old usage `./deploy-appstore.sh ios` → prod
    # only (this is what the script did before T450 dual-flavor refactor).
    echo "⚠  'ios' target is legacy; use 'prod' (or 'all' for both flavors)."
    build_ios prod || FAILED=1
    ;;
  android)
    build_android || FAILED=1
    ;;
  *)
    echo "❌ unknown target: $TARGET"
    echo "   valid: prod, dev, all (default), android"
    exit 2
    ;;
esac

echo ""
echo "════════════════════════════════════════"
if [[ $FAILED -eq 0 ]]; then
  echo "  ✅ Deploy complete — $APP_STORE_URL"
  for url in "${INSTALL_URLS[@]:-}"; do
    [[ -n "$url" ]] && echo "    • $url"
  done
else
  echo "  ❌ One or more targets failed"
fi
echo "════════════════════════════════════════"
exit $FAILED
