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
cat > src/app/app.ts <<'APP'
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkListbox, CdkOption } from '@angular/cdk/listbox';
import {
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

echo "── Building the smoke app ────────────────────────────────────────────"
npx ng build

echo "── Rendering the smoke app in a real headless browser ────────────────"
node "$ROOT/scripts/render-check.mjs" "$WORKDIR/smoke/dist/smoke/browser"

echo "✓ @halfmanhalfape/hmha-ui installs, builds and renders against @angular/cli@${VERSION}"
