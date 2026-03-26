#!/bin/bash
# deploy-appstore.sh — Build iOS + Android and upload to internal App Store
# Usage:
#   ./deploy-appstore.sh all          # Build & upload iOS + Android (default)
#   ./deploy-appstore.sh ios          # iOS only
#   ./deploy-appstore.sh android      # Android only
#   ./deploy-appstore.sh ios --skip-upload    # Build only, no upload
#   ./deploy-appstore.sh android prod         # Android prod flavor only
#   ./deploy-appstore.sh android dev          # Android dev flavor only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_STORE_URL="${APP_STORE_URL:-http://localhost:3457}"
UPLOAD_SCRIPT="$HOME/.claude/skills/app-store-ops/scripts/upload.sh"

TARGET="${1:-all}"
FLAVOR="${2:-all}"
SKIP_UPLOAD=false
for arg in "$@"; do
  [[ "$arg" == "--skip-upload" ]] && SKIP_UPLOAD=true
done

FAILED=0
DESCRIPTION="Memoura Sprint build $(date +%Y-%m-%d)"

echo "========================================"
echo "  Memoura Deploy to App Store"
echo "  Target: $TARGET | Flavor: $FLAVOR"
echo "  App Store: $APP_STORE_URL"
echo "========================================"

# ── iOS ──────────────────────────────────────────────────────────────────────

build_ios() {
  echo ""
  echo "📱 Building iOS..."
  cd "$SCRIPT_DIR/ios"

  local WORKSPACE="LoveScrum.xcworkspace"
  local BUILD_DIR="./build"
  local ADHOC_PLIST="$BUILD_DIR/ExportOptions-adhoc.plist"

  # Bump build number
  local CURRENT_BUILD=$(agvtool what-version -terse)
  local NEW_BUILD=$((CURRENT_BUILD + 1))
  echo "⬆  iOS build number: $CURRENT_BUILD → $NEW_BUILD"
  agvtool new-version -all "$NEW_BUILD" > /dev/null

  # Archive prod
  echo "📦 Archiving iOS (Prod)..."
  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "LoveScrum" \
    -configuration "Prod Release" \
    -destination "generic/platform=iOS" \
    -archivePath "$BUILD_DIR/LoveScrum.xcarchive" \
    archive \
    -allowProvisioningUpdates \
    -quiet
  echo "✅ iOS archive succeeded"

  # Export IPA (ad-hoc for internal distribution)
  echo "📤 Exporting IPA (ad-hoc)..."
  rm -rf "$BUILD_DIR/export-adhoc"
  xcodebuild \
    -exportArchive \
    -archivePath "$BUILD_DIR/LoveScrum.xcarchive" \
    -exportOptionsPlist "$ADHOC_PLIST" \
    -exportPath "$BUILD_DIR/export-adhoc" \
    -allowProvisioningUpdates \
    2>&1 | grep -v "^warning:" || true
  echo "✅ IPA exported"

  local IPA_PATH="$BUILD_DIR/export-adhoc/Memoura.ipa"
  if [[ ! -f "$IPA_PATH" ]]; then
    echo "❌ IPA not found at $IPA_PATH"
    return 1
  fi

  # Upload
  if ! $SKIP_UPLOAD; then
    echo "🚀 Uploading iOS to App Store..."
    bash "$UPLOAD_SCRIPT" "$IPA_PATH" "$DESCRIPTION" "" "$APP_STORE_URL"
    echo "✅ iOS uploaded (build $NEW_BUILD)"
  else
    echo "⏭  Upload skipped"
  fi

  cd "$SCRIPT_DIR"
}

# ── Android ──────────────────────────────────────────────────────────────────

build_android() {
  local flavor="${1:-all}"

  echo ""
  echo "🤖 Building Android (flavor: $flavor)..."
  cd "$SCRIPT_DIR/android"

  if [[ "$flavor" == "dev" || "$flavor" == "all" ]]; then
    echo "📦 Building Android Dev Release..."
    ./gradlew assembleDevRelease -q
    echo "✅ Android Dev APK built"

    local DEV_APK="app/build/outputs/apk/dev/release/app-dev-release.apk"
    if ! $SKIP_UPLOAD; then
      echo "🚀 Uploading Android Dev..."
      curl -s -X POST "$APP_STORE_URL/api/apps/upload" \
        -F "file=@$DEV_APK" \
        -F "description=$DESCRIPTION (dev)" \
        | python3 -m json.tool 2>/dev/null || echo "(upload response not JSON)"
      echo "✅ Android Dev uploaded"
    fi
  fi

  if [[ "$flavor" == "prod" || "$flavor" == "all" ]]; then
    echo "📦 Building Android Prod Release..."
    ./gradlew assembleProdRelease -q
    echo "✅ Android Prod APK built"

    local PROD_APK="app/build/outputs/apk/prod/release/app-prod-release.apk"
    if ! $SKIP_UPLOAD; then
      echo "🚀 Uploading Android Prod..."
      curl -s -X POST "$APP_STORE_URL/api/apps/upload" \
        -F "file=@$PROD_APK" \
        -F "description=$DESCRIPTION (prod)" \
        | python3 -m json.tool 2>/dev/null || echo "(upload response not JSON)"
      echo "✅ Android Prod uploaded"
    fi
  fi

  cd "$SCRIPT_DIR"
}

# ── Run targets ──────────────────────────────────────────────────────────────

if [[ "$TARGET" == "ios" || "$TARGET" == "all" ]]; then
  build_ios || FAILED=1
fi

if [[ "$TARGET" == "android" || "$TARGET" == "all" ]]; then
  build_android "$FLAVOR" || FAILED=1
fi

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""
echo "========================================"
if [[ $FAILED -eq 0 ]]; then
  echo "  Deploy complete ✅"
else
  echo "  Some builds/uploads failed ❌"
fi
echo "  App Store: $APP_STORE_URL"
echo "========================================"

exit $FAILED
