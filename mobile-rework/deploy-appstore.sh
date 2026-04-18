#!/usr/bin/env bash
# deploy-appstore.sh — Build + upload Memoura to the internal App Store
# (app-store.hungphu.work).
#
# Internal App Store is the OTA-install path Boss uses for smoke tests —
# faster than TestFlight (no Apple processing wait) and works for non-TF
# testers. iOS ships an ad-hoc .ipa; Android ships a release .apk.
#
# Usage:
#   ./deploy-appstore.sh              # iOS + Android (default)
#   ./deploy-appstore.sh ios          # iOS only
#   ./deploy-appstore.sh android      # Android only
#   ./deploy-appstore.sh ios --skip-upload
#
# ── Pre-flight ───────────────────────────────────────────────────────────────
# iOS ad-hoc signing requires the target device's UDID registered in Apple
# Developer Portal under the ad-hoc provisioning profile for
# com.hungphu.memoura. Automatic signing + `-allowProvisioningUpdates` will
# fetch the latest profile at build time — but if the tester's UDID isn't in
# the profile, the resulting .ipa silently fails to install. Bundle is shared
# with the old mobile/ track, so profiles from there still apply.
#
# Android: no app/release keystore has been generated yet for mobile-rework.
# Gradle will sign with the debug keystore by default, which is fine for
# internal distribution but not for Play Store. B20 on the backlog tracks a
# proper release keystore.
#
# ── Rate limits ──────────────────────────────────────────────────────────────
# app-store.hungphu.work has no Apple-style cap — upload freely. Files >100MB
# must go via localhost:3457 (Cloudflare edge rejects >100MB multipart).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_STORE_URL="${APP_STORE_URL:-http://localhost:3457}"
UPLOAD_SCRIPT="$HOME/.claude/skills/app-store-ops/scripts/upload.sh"
DESCRIPTION="Memoura rework $(date +%Y-%m-%d\ %H:%M)"

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

# ── iOS ──────────────────────────────────────────────────────────────────────
build_ios() {
  cd "$SCRIPT_DIR/ios"

  local SCHEME="Memoura"
  local CONFIG="Release"
  local WORKSPACE="Memoura.xcworkspace"
  local TEAM_ID="DHGY59PZWW"
  local BUILD_DIR="./build"
  local ARCHIVE_PATH="$BUILD_DIR/Memoura.xcarchive"
  local EXPORT_PATH="$BUILD_DIR/export-adhoc"
  local EXPORT_PLIST="./ExportOptionsAdHoc.plist"

  local CURRENT_BUILD NEW_BUILD
  CURRENT_BUILD=$(agvtool what-version -terse)
  NEW_BUILD=$((CURRENT_BUILD + 1))
  echo ""
  echo "⬆  iOS build: $CURRENT_BUILD → $NEW_BUILD"
  agvtool new-version -all "$NEW_BUILD" > /dev/null

  echo "📦 Archiving $SCHEME ($CONFIG)…"
  rm -rf "$ARCHIVE_PATH"
  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIG" \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_STYLE=Automatic \
    archive \
    -allowProvisioningUpdates \
    -quiet
  echo "✅ iOS archive"

  echo "📤 Exporting ad-hoc IPA…"
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
    echo "❌ IPA not produced — check signing/profile for com.hungphu.memoura"
    return 1
  fi
  echo "✅ IPA: $IPA"

  if $SKIP_UPLOAD; then
    echo "⏭  iOS upload skipped"
    return 0
  fi

  echo "🚀 Uploading IPA to ${APP_STORE_URL}…"
  bash "$UPLOAD_SCRIPT" "$IPA" "$DESCRIPTION (iOS build $NEW_BUILD)" "" "$APP_STORE_URL"
  echo "✅ iOS uploaded (build $NEW_BUILD)"
}

# ── Android ──────────────────────────────────────────────────────────────────
build_android() {
  if [[ ! -d "$SCRIPT_DIR/android" ]]; then
    echo ""
    echo "⚠  android/ not generated yet. Run:"
    echo "     npx expo prebuild --platform android"
    echo "   then retry. Skipping Android."
    return 0
  fi

  cd "$SCRIPT_DIR/android"

  echo ""
  echo "🤖 Building Android release APK…"
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
  bash "$UPLOAD_SCRIPT" "$APK" "$DESCRIPTION (Android)" "" "$APP_STORE_URL"
  echo "✅ Android uploaded"
}

# ── Dispatch ─────────────────────────────────────────────────────────────────
if [[ "$TARGET" == "ios" || "$TARGET" == "all" ]]; then
  build_ios || FAILED=1
fi

if [[ "$TARGET" == "android" || "$TARGET" == "all" ]]; then
  build_android || FAILED=1
fi

echo ""
echo "════════════════════════════════════════"
if [[ $FAILED -eq 0 ]]; then
  echo "  ✅ Deploy complete — $APP_STORE_URL"
else
  echo "  ❌ One or more targets failed"
fi
echo "════════════════════════════════════════"
exit $FAILED
