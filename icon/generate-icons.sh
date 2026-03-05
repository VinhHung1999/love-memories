#!/bin/bash
# Generate all iOS + Android app icons from source image
# Source: love-memories-icon.png (1024x1024)

set -e

SOURCE="$(dirname "$0")/love-memories-icon.png"
MOBILE="$(dirname "$0")/../mobile"
IOS_DIR="$MOBILE/ios/LoveScrum/Images.xcassets/AppIcon.appiconset"
ANDROID_DIR="$MOBILE/android/app/src/main/res"

echo "Source: $SOURCE"
echo "Generating icons..."

# ── iOS sizes ──────────────────────────────────────────────────────────────
ios_sizes=(
  "20:Icon-20.png"
  "29:Icon-29.png"
  "40:Icon-40.png"
  "58:Icon-58.png"
  "60:Icon-60.png"
  "76:Icon-76.png"
  "80:Icon-80.png"
  "87:Icon-87.png"
  "120:Icon-120.png"
  "152:Icon-152.png"
  "167:Icon-167.png"
  "180:Icon-180.png"
  "1024:Icon-1024.png"
)

mkdir -p "$IOS_DIR"
for entry in "${ios_sizes[@]}"; do
  size="${entry%%:*}"
  filename="${entry##*:}"
  npx sharp-cli -i "$SOURCE" -o "$IOS_DIR/$filename" resize "$size" "$size"
  echo "  iOS: $filename (${size}x${size})"
done

# ── Android sizes ──────────────────────────────────────────────────────────
declare -A android_sizes
android_sizes["mipmap-mdpi"]="48"
android_sizes["mipmap-hdpi"]="72"
android_sizes["mipmap-xhdpi"]="96"
android_sizes["mipmap-xxhdpi"]="144"
android_sizes["mipmap-xxxhdpi"]="192"

for dir in "${!android_sizes[@]}"; do
  size="${android_sizes[$dir]}"
  mkdir -p "$ANDROID_DIR/$dir"
  npx sharp-cli -i "$SOURCE" -o "$ANDROID_DIR/$dir/ic_launcher.png" resize "$size" "$size"
  npx sharp-cli -i "$SOURCE" -o "$ANDROID_DIR/$dir/ic_launcher_round.png" resize "$size" "$size"
  echo "  Android: $dir/ic_launcher.png (${size}x${size})"
done

echo ""
echo "Done! All icons generated."
