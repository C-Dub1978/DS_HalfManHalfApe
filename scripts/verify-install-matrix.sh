#!/usr/bin/env bash
# Phase 2 gate: prove @halfmanhalfape/hmha-ui's partial-Ivy build installs and renders in a
# fresh Angular app on every supported major (the floor, 20, through the
# peer-range ceiling), without ever raising the workspace's own Angular
# version (invariant 1).
#
# Rendering is asserted with a real headless-browser navigation (via this
# repo's own Playwright install) rather than `ng test`, because each Angular
# version's default test runner and its setup (Karma today, Vitest+browser
# mode from v21 on) is not something this check should depend on.
#
# Usage: scripts/verify-install-matrix.sh <angular-major>
set -euo pipefail

VERSION="${1:?usage: verify-install-matrix.sh <angular-major>}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

echo "── Building and packing @halfmanhalfape/hmha-tokens + hmha-ui ──────────"
(cd "$ROOT" && npm run tokens && npm run icons && npm run build:lib)
TOKENS_TARBALL="$ROOT/libs/tokens/$(cd "$ROOT/libs/tokens" && npm pack --silent)"
UI_TARBALL="$ROOT/dist/hmha-ui/$(cd "$ROOT/dist/hmha-ui" && npm pack --silent)"
trap 'rm -rf "$WORKDIR" "$TOKENS_TARBALL" "$UI_TARBALL"' EXIT
echo "Packed: $TOKENS_TARBALL"
echo "Packed: $UI_TARBALL"

echo "── Scaffolding a smoke app on @angular/cli@${VERSION} ───────────────"
cd "$WORKDIR"
npx --yes "@angular/cli@${VERSION}" new smoke \
  --defaults --skip-git --style=css --package-manager=npm --skip-install

cd smoke
# --legacy-peer-deps sidesteps a known npm Arborist crash seen when resolving
# some newer Angular scaffolds' own devDependency peer graph — unrelated to
# hmha-ui, but harmless to apply throughout.
npm install --legacy-peer-deps
# Both packages together, as libs/ui/README.md's Install section says —
# hmha-tokens is a peer of hmha-ui (fork 07 addendum), and the local tarball
# is used rather than the registry so an unreleased token change is tested.
npm install --legacy-peer-deps "$TOKENS_TARBALL" "$UI_TARBALL"
# Pin the CDK to the scaffold's own major. A range here (the old
# ">=20.0.0 <22.0.0") resolves to its highest match, so the floor run was
# silently pairing @angular/core@20 with @angular/cdk@21 — and
# --legacy-peer-deps hid the mismatch instead of failing on it.
npm install --legacy-peer-deps "@angular/cdk@${VERSION}"

# Fail loudly if core and cdk ended up on different majors anyway.
CORE_MAJOR="$(node -p "require('@angular/core/package.json').version.split('.')[0]")"
CDK_MAJOR="$(node -p "require('@angular/cdk/package.json').version.split('.')[0]")"
echo "Resolved @angular/core@${CORE_MAJOR}.x, @angular/cdk@${CDK_MAJOR}.x"
if [[ "$CORE_MAJOR" != "$VERSION" || "$CDK_MAJOR" != "$VERSION" ]]; then
  echo "✗ expected both on major ${VERSION}" >&2
  exit 1
fi

# Exercise every CDK/Angular module hmha-ui depends on, not just Button — a
# component the app doesn't import is tree-shaken away and never linked, so a
# CDK export removed in a new major would otherwise pass this check unseen:
#   Tooltip     → @angular/cdk/overlay + portal + a11y (AriaDescriber)
#   Field/Input → @angular/cdk/a11y (_IdGenerator) + @angular/forms (CVA)
#   Select      → @angular/cdk/listbox + overlay
#   Alert       → @angular/cdk/a11y LiveAnnouncer, plus @angular/cdk/private's
#                 style loader (the underscore API that hides its live region)
cat > src/app/app.ts <<'APP'
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import {
  HmhaAlert,
  HmhaButton,
  HmhaField,
  HmhaInput,
  HmhaSelectListbox,
  HmhaSelectOption,
  HmhaSelectTrigger,
  HmhaTooltip,
} from '@halfmanhalfape/hmha-ui';

@Component({
  selector: 'app-root',
  imports: [
    ReactiveFormsModule,
    CdkListbox,
    CdkOption,
    HmhaAlert,
    HmhaButton,
    HmhaField,
    HmhaInput,
    HmhaSelectListbox,
    HmhaSelectOption,
    HmhaSelectTrigger,
    HmhaTooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button hmhaButton data-testid="smoke-button" hmhaTooltip="Smoke tooltip">Smoke test</button>
    <hmha-field label="Name">
      <input hmhaInput data-testid="smoke-input" [formControl]="name" />
    </hmha-field>
    <button data-testid="smoke-select" [hmhaSelectTrigger]="listbox" [formControl]="choice">
      Choose
    </button>
    <div hmhaAlert tone="info" announce="polite">Smoke alert</div>
    <ng-template #listbox>
      <div hmhaSelectListbox cdkListbox>
        <div hmhaSelectOption cdkOption="a">Alpha</div>
        <div hmhaSelectOption cdkOption="b">Beta</div>
      </div>
    </ng-template>
  `,
})
export class App {
  readonly name = new FormControl('');
  readonly choice = new FormControl<string | null>(null);
}
APP
rm -f src/app/app.html src/app/app.css src/app/app.spec.ts

# Zoneless, matching apps/sandbox (invariant 4) — whatever this major's
# scaffold defaults to, the library must work without zone patching.
cat > src/app/app.config.ts <<'CONFIG'
import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
CONFIG

# Load the token CSS exactly as the README's Quickstart says to.
node -e '
  const fs = require("fs");
  const cfg = JSON.parse(fs.readFileSync("angular.json", "utf8"));
  const opts = cfg.projects.smoke.architect.build.options;
  opts.styles = ["node_modules/@halfmanhalfape/hmha-tokens/src/lib/_all.css", ...(opts.styles ?? [])];
  fs.writeFileSync("angular.json", JSON.stringify(cfg, null, 2));
'

echo "── Building the smoke app ────────────────────────────────────────────"
npx ng build

echo "── Rendering the smoke app in a real headless browser ────────────────"
node "$ROOT/scripts/render-check.mjs" "$WORKDIR/smoke/dist/smoke/browser"

echo "✓ @halfmanhalfape/hmha-ui installs, builds and renders against @angular/cli@${VERSION}"
