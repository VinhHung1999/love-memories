#!/bin/bash
# build-testflight.sh — Archive, export & upload to TestFlight
# Usage:
#   ./build-testflight.sh dev        # Build Dev scheme
#   ./build-testflight.sh prod       # Build Prod scheme
#   ./build-testflight.sh all        # Build both (default)
#   ./build-testflight.sh dev --skip-upload   # Archive only, no upload

set -euo pipefail

cd "$(dirname "$0")"

WORKSPACE="LoveScrum.xcworkspace"
BUILD_DIR="./build"
EXPORT_PLIST="./ExportOptions.plist"

# ── Parse args ────────────────────────────────────────────────────────────────

TARGET="${1:-all}"
SKIP_UPLOAD=false
for arg in "$@"; do
  [[ "$arg" == "--skip-upload" ]] && SKIP_UPLOAD=true
done

# ── Bump build number ────────────────────────────────────────────────────────

CURRENT_BUILD=$(agvtool what-version -terse)
NEW_BUILD=$((CURRENT_BUILD + 1))
echo "⬆  Build number: $CURRENT_BUILD → $NEW_BUILD"
agvtool new-version -all "$NEW_BUILD" > /dev/null

# ── Helper functions ──────────────────────────────────────────────────────────

archive() {
  local scheme="$1"
  local config="$2"
  local archive_path="$3"

  echo ""
  echo "📦 Archiving: $scheme ($config)..."
  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$scheme" \
    -configuration "$config" \
    -destination "generic/platform=iOS" \
    -archivePath "$archive_path" \
    archive \
    -allowProvisioningUpdates \
    -quiet

  echo "✅ Archive succeeded: $archive_path"
}

export_upload() {
  local archive_path="$1"
  local export_path="$2"
  local label="$3"

  rm -rf "$export_path"

  if $SKIP_UPLOAD; then
    echo "⏭  Skipping export/upload for $label (--skip-upload)"
    return 0
  fi

  echo "🚀 Exporting & uploading: $label..."
  xcodebuild \
    -exportArchive \
    -archivePath "$archive_path" \
    -exportOptionsPlist "$EXPORT_PLIST" \
    -exportPath "$export_path" \
    -allowProvisioningUpdates \
    2>&1 | grep -v "^warning: exportArchive Upload Symbols Failed" || true

  if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo "✅ $label uploaded to TestFlight (build $NEW_BUILD)"
  else
    echo "❌ $label upload failed. Check rate limits or signing."
    return 1
  fi
}

# ── Build targets ─────────────────────────────────────────────────────────────

FAILED=0

if [[ "$TARGET" == "prod" || "$TARGET" == "all" ]]; then
  archive "LoveScrum" "Prod Release" "$BUILD_DIR/LoveScrum.xcarchive"
  export_upload "$BUILD_DIR/LoveScrum.xcarchive" "$BUILD_DIR/export" "Prod" || FAILED=1
fi

if [[ "$TARGET" == "dev" || "$TARGET" == "all" ]]; then
  archive "LoveScrum Dev" "Dev Release" "$BUILD_DIR/LoveScrumDev.xcarchive"
  export_upload "$BUILD_DIR/LoveScrumDev.xcarchive" "$BUILD_DIR/export-dev" "Dev" || FAILED=1
fi

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════"
echo "  Build $NEW_BUILD complete"
if $SKIP_UPLOAD; then
  echo "  Archives ready (upload skipped)"
else
  [[ $FAILED -eq 0 ]] && echo "  All uploads succeeded ✅" || echo "  Some uploads failed ❌"
fi
echo "════════════════════════════════════════"

exit $FAILED
