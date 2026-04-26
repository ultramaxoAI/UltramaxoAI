#!/bin/bash
# ============================================================
# UltramaxoAI - Generate Release Keystore for Google Play Store
# ============================================================
#
# Run this script ONCE on your local machine to generate a keystore.
# Then add the output as GitHub Secrets for CI signing.
#
# Usage:
#   chmod +x mobile/scripts/generate-keystore.sh
#   mobile/scripts/generate-keystore.sh
#
# ============================================================

set -e

KEYSTORE_FILE="mobile/ultramaxo-release.jks"
KEY_ALIAS="ultramaxo"

echo "🔐 Generating release keystore for UltramaxoAI..."
echo ""

# Generate keystore
keytool -genkey -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass ultramaxo2026 \
  -keypass ultramaxo2026 \
  -dname "CN=Ultramaxo, OU=Development, O=Ultramaxo, L=Jakarta, ST=DKI Jakarta, C=ID"

echo ""
echo "✅ Keystore generated: $KEYSTORE_FILE"
echo ""

# Base64 encode for GitHub Secrets
KEYSTORE_BASE64=$(base64 -w 0 "$KEYSTORE_FILE")

echo "=================================================="
echo "📋 Add these as GitHub Repository Secrets:"
echo "=================================================="
echo ""
echo "1. KEYSTORE_BASE64:"
echo "$KEYSTORE_BASE64" | head -c 80
echo "..."
echo "(Full value saved to: mobile/keystore-base64.txt)"
echo ""
echo "2. KEY_ALIAS: $KEY_ALIAS"
echo "3. KEY_PASSWORD: ultramaxo2026"
echo "4. STORE_PASSWORD: ultramaxo2026"
echo ""
echo "=================================================="
echo ""

# Save base64 to file (for easy copy-paste)
echo "$KEYSTORE_BASE64" > mobile/keystore-base64.txt

echo "⚠️  IMPORTANT:"
echo "  - Keep $KEYSTORE_FILE safe! You need it to update the app."
echo "  - Add 'mobile/ultramaxo-release.jks' to .gitignore"
echo "  - Add 'mobile/keystore-base64.txt' to .gitignore"
echo "  - Never commit the keystore to git!"
echo ""
echo "🏪 To publish to Google Play Store:"
echo "  1. Go to https://play.google.com/console"
echo "  2. Create a new app"
echo "  3. Upload the signed APK from GitHub Actions artifacts"
echo ""
