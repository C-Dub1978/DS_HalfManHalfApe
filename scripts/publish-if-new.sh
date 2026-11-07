#!/usr/bin/env bash
# Publishes the package in the current directory unless its exact version is
# already on npm. Used by .github/workflows/publish.yml, once per package, so
# a release that only bumps one package doesn't fail trying to republish the
# other (npm rejects a duplicate version outright).
set -euo pipefail

NAME="$(node -p "require('./package.json').name")"
VERSION="$(node -p "require('./package.json').version")"

if npm view "${NAME}@${VERSION}" version >/dev/null 2>&1; then
  echo "↷ ${NAME}@${VERSION} is already on npm — skipping"
  exit 0
fi

echo "── Publishing ${NAME}@${VERSION} ──"
# Provenance is attached automatically under trusted publishing for a public
# package from a public repo; no --provenance flag or token needed.
npm publish --access public
echo "✓ Published ${NAME}@${VERSION}"
