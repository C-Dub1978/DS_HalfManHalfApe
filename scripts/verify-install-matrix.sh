#!/usr/bin/env bash
# Phase 2 gate: prove @halfmanhalfape/hmha-ui's partial-Ivy build installs and renders in a
# fresh Angular app on both the version floor (20) and the current release,
# without ever raising the workspace's own Angular version (invariant 1).
#
# Rendering is asserted with a real headless-browser navigation (via this
# repo's own Playwright install) rather than `ng test`, because each Angular
# version's default test runner and its setup (Karma today, Vitest+browser
# mode from v21 on) is not something this check should depend on.
#
# Usage: scripts/verify-install-matrix.sh <angular-cli-version-or-tag>
set -euo pipefail

VERSION="${1:?usage: verify-install-matrix.sh <angular-cli-version-or-tag>}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "── Building and packing @halfmanhalfape/hmha-ui ────────────────────────"
(cd "$ROOT" && npm run icons && npm run build:lib)
TARBALL_NAME="$(cd "$ROOT/dist/hmha-ui" && npm pack --silent)"
TARBALL_PATH="$ROOT/dist/hmha-ui/$TARBALL_NAME"
echo "Packed: $TARBALL_PATH"

echo "── Scaffolding a smoke app on @angular/cli@${VERSION} ───────────────"
cd "$WORKDIR"
npx --yes "@angular/cli@${VERSION}" new smoke \
  --defaults --skip-git --style=css --package-manager=npm --skip-install

cd smoke
# --legacy-peer-deps sidesteps a known npm Arborist crash seen when resolving
# some newer Angular scaffolds' own devDependency peer graph — unrelated to
# hmha-ui, but harmless to apply throughout.
npm install --legacy-peer-deps
npm install --legacy-peer-deps "$TARBALL_PATH"
npm install --legacy-peer-deps "@angular/cdk@>=20.0.0 <22.0.0"

cat > src/app/app.ts <<'EOF'
import { Component } from '@angular/core';
import { HmhaButton } from '@halfmanhalfape/hmha-ui';

@Component({
  selector: 'app-root',
  imports: [HmhaButton],
  template: '<button hmhaButton data-testid="smoke-button">Smoke test</button>',
})
export class App {}
EOF
rm -f src/app/app.html src/app/app.css src/app/app.spec.ts

echo "── Building the smoke app ────────────────────────────────────────────"
npx ng build

echo "── Rendering the smoke app in a real headless browser ────────────────"
node "$ROOT/scripts/render-check.mjs" "$WORKDIR/smoke/dist/smoke/browser"

echo "✓ @halfmanhalfape/hmha-ui installs, builds and renders against @angular/cli@${VERSION}"
