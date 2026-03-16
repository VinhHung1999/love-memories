#!/bin/bash
# Copy the correct GoogleService-Info.plist based on scheme
# This script should be added as a Build Phase "Run Script" in Xcode
# Run it BEFORE the "Compile Sources" phase

SCHEME="$SCHEME_NAME"

if [[ "$SCHEME" == *"Dev"* ]]; then
    cp "${SRCROOT}/LoveScrum/GoogleService-Info-Dev.plist" "${SRCROOT}/LoveScrum/GoogleService-Info.plist"
    echo "Using Dev GoogleService-Info.plist"
else
    echo "Using Prod GoogleService-Info.plist (no copy needed)"
fi
