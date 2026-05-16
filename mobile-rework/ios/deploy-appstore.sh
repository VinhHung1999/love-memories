#!/usr/bin/env bash
# deploy-appstore.sh — Dual-flavor archive + export for Memoura rework.
# Built per `FLAVORS.md` (Sprint 67 T448 → completed Sprint 70 T472).
#
# What it does:
#   - Picks one of {dev, prod, all}, defaults to `all`.
#   - For each flavor: APP_VARIANT export → Info.plist PlistBuddy patches →
#     xcodebuild archive (with PRODUCT_BUNDLE_IDENTIFIER override) →
#     xcodebuild exportArchive (ad-hoc method) → .ipa at ./build/export-<flavor>/.
#   - Backups Info.plist on entry; restores on EXIT/INT/TERM via trap.
#   - One agvtool build-number bump per script invocation (both flavors share
#     the number for the run).
#   - Default = both flavors. Mid-sprint Boss rule (memory:
#     in_sprint_dev_ipa_only) → call with just `dev`; never `prod` or `all`
#     until sprint_N merges main.
#
# What it does NOT do:
#   - Upload to app-store.hungphu.work. That's an explicit follow-up via the
#     `app-store-ops` skill (or Boss's preferred upload CLI). Reasons: (a)
#     archive + export is deterministic native work; upload is a separate
#     service contract that may change. (b) Operator can re-upload an
#     existing .ipa without re-archiving. After this script: `ls
#     ./build/export-dev/*.ipa` → run /app-store-ops to push it.
#
# Usage:
#   ./deploy-appstore.sh                    # both flavors, archive + export
#   ./deploy-appstore.sh dev                # dev only
#   ./deploy-appstore.sh prod               # prod only
#   ./deploy-appstore.sh all                # explicit both
#   ./deploy-appstore.sh dev --skip-export  # archive only (debug; no .ipa)
#
# Pre-flight (one-time, see FLAVORS.md):
#   - Xcode signed into Apple ID on team DHGY59PZWW
#   - Apple Distribution cert generated from RSA 2048 CSR (memory:
#     bugs_apple_csr_rsa2048)
#   - Both ad-hoc provisioning profiles (com.hungphu.memoura +
#     com.hungphu.memoura.dev) registered with tester UDIDs
#   - mobile-rework/.env populated with MAPBOX_ACCESS_TOKEN (Memory Map needs
#     it at runtime; missing token = blank map tiles in production)

set -euo pipefail
cd "$(dirname "$0")"

WORKSPACE="Memoura.xcworkspace"
SCHEME="Memoura"
CONFIG="Release"
BUILD_DIR="./build"
EXPORT_PLIST="./ExportOptionsAdHoc.plist"
INFO_PLIST="Memoura/Info.plist"
INFO_PLIST_BAK="$INFO_PLIST.bak"
TEAM_ID="DHGY59PZWW"

# ── Flavor table — keep in sync with app.config.ts → VARIANT_CONFIG ──────────
PROD_BUNDLE_ID="com.hungphu.memoura"
PROD_DISPLAY_NAME="Memoura"
PROD_URL_SCHEME="memoura"

DEV_BUNDLE_ID="com.hungphu.memoura.dev"
DEV_DISPLAY_NAME="Memoura Dev"
DEV_URL_SCHEME="memouradev"

# ── Args ─────────────────────────────────────────────────────────────────────
TARGET="${1:-all}"
SKIP_EXPORT=false
for arg in "$@"; do
  [[ "$arg" == "--skip-export" ]] && SKIP_EXPORT=true
done

case "$TARGET" in
  dev|prod|all) ;;
  *)
    echo "❌ Unknown target: $TARGET (expected dev|prod|all)" >&2
    exit 2
    ;;
esac

# ── Restore Info.plist on any exit path ──────────────────────────────────────
# trap fires on EXIT (normal + error), INT (Ctrl-C), TERM (kill). FLAVORS.md
# warns: never run two copies of this script against the same checkout — the
# second run would race the first's PlistBuddy edits.
restore_info_plist() {
  if [[ -f "$INFO_PLIST_BAK" ]]; then
    mv "$INFO_PLIST_BAK" "$INFO_PLIST"
    echo "↩  Info.plist restored from backup."
  fi
}
trap restore_info_plist EXIT INT TERM
cp "$INFO_PLIST" "$INFO_PLIST_BAK"

# ── Bump build number ONCE for the whole invocation ──────────────────────────
CURRENT_BUILD=$(agvtool what-version -terse)
NEW_BUILD=$((CURRENT_BUILD + 1))
echo "⬆  Build number: $CURRENT_BUILD → $NEW_BUILD"
agvtool new-version -all "$NEW_BUILD" > /dev/null

# ── Per-flavor build ─────────────────────────────────────────────────────────
build_flavor() {
  local flavor="$1"
  local bundle_id="$2"
  local display_name="$3"
  local url_scheme="$4"

  local archive_path="$BUILD_DIR/Memoura-$flavor.xcarchive"
  local export_path="$BUILD_DIR/export-$flavor"

  echo ""
  echo "═══ Building $flavor ($bundle_id) ═══"

  # 1. Patch Info.plist for this flavor (display name + URL scheme).
  #    CFBundleIdentifier already references $(PRODUCT_BUNDLE_IDENTIFIER) so the
  #    xcodebuild override below propagates without an extra PlistBuddy edit.
  /usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $display_name" "$INFO_PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:0 $url_scheme" "$INFO_PLIST"
  /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:1 $bundle_id" "$INFO_PLIST"

  # 2. Archive. APP_VARIANT exported so the embedded react-native-xcode.sh
  #    re-evaluates app.config.ts with the right flavor (api host, scheme,
  #    extra.mapboxToken, extra.mapboxStyleUrl). PRODUCT_BUNDLE_IDENTIFIER
  #    override + DEVELOPMENT_TEAM are passed via xcodebuild build settings so
  #    `expo prebuild --clean` can nuke ios/ without breaking signing config.
  #
  # We deliberately DO NOT pass `-quiet` — `set -e` is disabled inside this
  # function because the caller invokes it with `|| FAILED=1`, so we must
  # check xcodebuild's exit code explicitly. `-quiet` would also hide the
  # actual Swift / linker error if archive failed.
  echo "📦 Archiving…"
  rm -rf "$archive_path"
  APP_VARIANT="$flavor" xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIG" \
    -destination "generic/platform=iOS" \
    -archivePath "$archive_path" \
    PRODUCT_BUNDLE_IDENTIFIER="$bundle_id" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_STYLE=Automatic \
    archive \
    -allowProvisioningUpdates
  local archive_rc=$?
  if [[ $archive_rc -ne 0 ]]; then
    echo "❌ Archive failed for $flavor (xcodebuild exit $archive_rc)" >&2
    return 1
  fi
  echo "✅ Archive: $archive_path"

  # 3. Export ad-hoc .ipa. Skipped when --skip-export so a flaky export
  #    doesn't waste an archive.
  if $SKIP_EXPORT; then
    echo "⏭  Skipping export ($flavor)."
    return 0
  fi

  echo "📤 Exporting ad-hoc .ipa…"
  rm -rf "$export_path"
  xcodebuild \
    -exportArchive \
    -archivePath "$archive_path" \
    -exportOptionsPlist "$EXPORT_PLIST" \
    -exportPath "$export_path" \
    -allowProvisioningUpdates \
    2>&1 | grep -v "^warning: exportArchive Upload Symbols Failed" || true
  local export_rc=${PIPESTATUS[0]}
  if [[ $export_rc -ne 0 ]]; then
    echo "❌ Export failed for $flavor (xcodebuild exit $export_rc)" >&2
    return 1
  fi

  # 4. Verify the IPA's CFBundleIdentifier matches the expected bundle ID.
  #    Catches a misconfigured override BEFORE the bytes leave the laptop.
  local ipa
  ipa=$(ls "$export_path"/*.ipa 2>/dev/null | head -1)
  if [[ -z "$ipa" ]]; then
    echo "❌ No .ipa found at $export_path" >&2
    return 1
  fi

  local tmpdir
  tmpdir=$(mktemp -d)
  unzip -q "$ipa" -d "$tmpdir"
  local actual_bundle_id
  actual_bundle_id=$(/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" \
    "$tmpdir"/Payload/*.app/Info.plist)
  rm -rf "$tmpdir"

  if [[ "$actual_bundle_id" != "$bundle_id" ]]; then
    echo "❌ IPA bundle ID mismatch — expected $bundle_id, got $actual_bundle_id" >&2
    return 1
  fi
  echo "✅ $flavor IPA verified: $ipa (CFBundleIdentifier=$actual_bundle_id)"
}

# ── Build targets ────────────────────────────────────────────────────────────
mkdir -p "$BUILD_DIR"
FAILED=0

if [[ "$TARGET" == "dev" || "$TARGET" == "all" ]]; then
  build_flavor dev "$DEV_BUNDLE_ID" "$DEV_DISPLAY_NAME" "$DEV_URL_SCHEME" || FAILED=1
fi

if [[ "$TARGET" == "prod" || "$TARGET" == "all" ]]; then
  build_flavor prod "$PROD_BUNDLE_ID" "$PROD_DISPLAY_NAME" "$PROD_URL_SCHEME" || FAILED=1
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  Build $NEW_BUILD complete"
if $SKIP_EXPORT; then
  echo "  Archives ready under $BUILD_DIR/ (export skipped)"
else
  if [[ $FAILED -eq 0 ]]; then
    echo "  IPAs ready under $BUILD_DIR/export-<flavor>/"
    echo ""
    echo "  Next: upload via the app-store-ops skill, e.g."
    echo "    /app-store-ops upload --ipa $BUILD_DIR/export-dev/Memoura.ipa --app memoura-dev"
  else
    echo "  Some flavors failed — check output above ❌"
  fi
fi
echo "════════════════════════════════════════"

exit $FAILED
