#!/usr/bin/env bash
# build-testflight.sh — Archive, export & upload mobile-rework to TestFlight.
#
# Single-flavor: bundle ID `com.hungphu.memoura` — same App Store Connect app
# as the old mobile/ track, but MARKETING_VERSION=2.0.0 (in app.config.ts) so
# rework builds are distinguishable from the 1.0 (40) mobile/ history on
# TestFlight. A dedicated dev flavor was scoped out for Sprint 59 to avoid
# registering a new ASC app.
#
# Usage:
#   ./build-testflight.sh                  # Archive + upload
#   ./build-testflight.sh --skip-upload    # Archive only, no upload
#
# ── Pre-flight (one-time) ───────────────────────────────────────────────────
# 1. Xcode ▸ Settings ▸ Accounts — sign in with an Apple ID on team DHGY59PZWW.
#    API key alone is NOT enough for exportArchive — xcodebuild needs an Xcode
#    session with signing credentials cached locally. (memory: bugs_xcodebuild_export_login)
# 2. Apple Developer → Distribution cert must be generated from an **RSA 2048**
#    CSR. Elliptic-curve CSRs will fail upload with an opaque error.
#    (memory: bugs_apple_csr_rsa2048)
# 3. App Store Connect app with bundle ID `com.hungphu.memoura` exists (shared
#    with old mobile/).
# 4. DEVELOPMENT_TEAM is injected into xcodebuild below, so you do NOT need to
#    touch Xcode's Signing & Capabilities tab. `-allowProvisioningUpdates` asks
#    Apple for the provisioning profile at build time.
#
# ── After `expo prebuild --clean` ────────────────────────────────────────────
# `prebuild --clean` nukes ios/ and regenerates from app.config.ts. After that:
#   • `cd ios && pod install` (CocoaPods runs automatically after prebuild, but
#     re-run if you edit Podfile).
#   • `git checkout HEAD -- mobile-rework/ios/build-testflight.sh
#     mobile-rework/ios/ExportOptions.plist` — prebuild removes the whole ios/
#     dir, so these two files need restoring from the last commit.
#   • Signing is re-injected each build via DEVELOPMENT_TEAM below — no Xcode
#     GUI setup to redo.
#
# ── Rate-limit warning ───────────────────────────────────────────────────────
# App Store Connect caps ~10 uploads/day per bundle ID. Batch fixes before
# building — don't fire this script after every edit.
# (memory: bugs_testflight_upload_limit)

set -euo pipefail
cd "$(dirname "$0")"

SCHEME="Memoura"
CONFIG="Release"
WORKSPACE="Memoura.xcworkspace"
BUILD_DIR="./build"
ARCHIVE_PATH="$BUILD_DIR/Memoura.xcarchive"
EXPORT_PATH="$BUILD_DIR/export"
EXPORT_PLIST="./ExportOptions.plist"
TEAM_ID="DHGY59PZWW"

SKIP_UPLOAD=false
for arg in "$@"; do
  [[ "$arg" == "--skip-upload" ]] && SKIP_UPLOAD=true
done

# ── Bump build number ────────────────────────────────────────────────────────
# agvtool reads/writes CFBundleVersion across all targets in the workspace.
CURRENT_BUILD=$(agvtool what-version -terse)
NEW_BUILD=$((CURRENT_BUILD + 1))
echo "⬆  Build number: $CURRENT_BUILD → $NEW_BUILD"
agvtool new-version -all "$NEW_BUILD" > /dev/null

# ── Archive ──────────────────────────────────────────────────────────────────
echo ""
echo "📦 Archiving $SCHEME ($CONFIG)…"
rm -rf "$ARCHIVE_PATH"
# DEVELOPMENT_TEAM + CODE_SIGN_STYLE are passed here (not pbxproj) so
# `expo prebuild --clean` can nuke the ios/ folder without us having to
# reconfigure Xcode signing each time. Team ID lives at the top of this script.
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

echo "✅ Archive: $ARCHIVE_PATH"

# ── Export + upload ──────────────────────────────────────────────────────────
rm -rf "$EXPORT_PATH"

if $SKIP_UPLOAD; then
  echo "⏭  Skipping upload (--skip-upload). Archive ready at $ARCHIVE_PATH"
  exit 0
fi

echo ""
echo "🚀 Exporting + uploading to TestFlight…"
# `destination=upload` in ExportOptions.plist makes exportArchive both export
# and ship the .ipa in one shot — no separate `xcrun altool` call needed.
set +e
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_PLIST" \
  -exportPath "$EXPORT_PATH" \
  -allowProvisioningUpdates \
  2>&1 | grep -v "^warning: exportArchive Upload Symbols Failed"
EXIT=${PIPESTATUS[0]}
set -e

echo ""
echo "════════════════════════════════════════"
if [[ $EXIT -eq 0 ]]; then
  echo "  ✅ Memoura build $NEW_BUILD uploaded to TestFlight"
  echo "  Processing takes ~5–15 min before it appears in TestFlight."
else
  echo "  ❌ Upload failed (exit $EXIT)"
  echo "  Check: Xcode Apple ID login, rate limit, provisioning."
fi
echo "════════════════════════════════════════"
exit $EXIT
