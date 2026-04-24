#!/usr/bin/env bash
# Text-level rename: fucus -> Focus Blocks, com.yourbound.fucus -> love.nemi.focus.
# Run from repo root: `bash publishing/rename.sh`
# Directory moves are NOT performed here. See publishing/rename-checklist.md §2.

set -euo pipefail

if [ ! -f "app.json" ] || [ ! -d "ios" ]; then
  echo "Run this from the repo root (where app.json lives)." >&2
  exit 1
fi

echo "==> Close Xcode before running this script. Press Enter to continue."
read -r

# Portable in-place sed (Linux vs. macOS).
sed_i() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

# Everything under the repo root, skipping build/dependency output.
# Longest patterns first so we don't corrupt subsequent replacements.
FILES=$(grep -rli \
  --exclude-dir=node_modules \
  --exclude-dir=Pods \
  --exclude-dir=build \
  --exclude-dir=.git \
  --exclude-dir=publishing \
  -e 'fucus' -e 'yourbound' .)

if [ -z "$FILES" ]; then
  echo "No references found. Nothing to do."
  exit 0
fi

echo "==> Rewriting $(echo "$FILES" | wc -l | tr -d ' ') files"

for f in $FILES; do
  sed_i \
    -e 's#group\.com\.yourbound\.fucus#group.love.nemi.focus#g' \
    -e 's#iCloud\.com\.yourbound\.fucus#iCloud.love.nemi.focus#g' \
    -e 's#com\.yourbound\.fucus#love.nemi.focus#g' \
    -e 's#com/yourbound/fucus#love/nemi/focus#g' \
    -e 's#com\.yourbound#love.nemi#g' \
    -e 's#yourbound\.fucus#nemi.focus#g' \
    -e 's#"name": "fucus"#"name": "Focus Blocks"#g' \
    -e 's#"slug": "fucus"#"slug": "focus-blocks"#g' \
    -e 's#"scheme": "fucus"#"scheme": "focusblocks"#g' \
    -e 's#FUCUS#FOCUS_BLOCKS#g' \
    -e 's#Fucus#FocusBlocks#g' \
    -e 's#fucus#focusblocks#g' \
    "$f"
done

# package.json name must stay npm-safe (lowercase, dash-allowed).
sed_i 's#"name": "focusblocks"#"name": "focus-blocks"#g' package.json

# The iCloud plugin filename-in-import if we end up renaming it — leave the
# plugin body replacements to the loop above.

echo "==> Done. Next steps:"
echo "    1. Review the diff:            git diff --stat"
echo "    2. Rename directories:         see publishing/rename-checklist.md §2"
echo "    3. Open Xcode workspace and run a clean build"
echo "    4. Verify no refs remain:      grep -rli 'fucus\\|yourbound' ."
