# HMHA Design System

A token-driven Angular 20+ design system and component library: DTCG token
source, the Style Dictionary build, the two token CI guards, and (phase 2) the
Angular workspace itself — `hmha-ui` (the component library) and `sandbox` (the
zoneless dog-food app). `CLAUDE.md` records the architectural invariants;
`DECISIONS.md` records why.

## Repository layout

```
tokens/                   DTCG JSON — source of truth (primitive + semantic tiers)
libs/
  tokens/                 build output (git-ignored) → @halfmanhalfape/hmha-tokens
  ui/                      Angular components         → @halfmanhalfape/hmha-ui
apps/
  sandbox/                 the dog-food app; runs zoneless
infra/
  site.yml                 CloudFormation for the demo site (see "Demo site")
scripts/
  concat-layers.mjs        deterministic layer concatenation (order is load-bearing)
  check-contrast.mjs       resolves var() chains, fails CI on a bad pair
style-dictionary.config.mjs five filtered output layers + the TS type format
.stylelintrc.json         bans hex, raw colour functions, stray px units, ::ng-deep
reference/
  tokens.css               expected token build output
  hmha-tokens.ts            expected generated types
sandbox/index.html         static, component-free proof of the token/theming
                            architecture (the phase 1 gate) — kept for reference
```

## Getting started

```bash
npm install                # also generates the icon registry (postinstall)
npm run tokens             # writes libs/tokens/src/lib/_all.css
npm run tokens:contrast    # asserts every declared fill/foreground pair, both modes
npm start                  # serves the sandbox app at http://localhost:4200
```

Diff a fresh token build against `reference/tokens.css` — it should match modulo
whitespace; if it does not, the layer order or `outputReferences` is wrong, and
both matter more than they look.

`libs/ui/src/lib/icon/icon-registry.ts` is generated and git-ignored, like the
token output. `npm install` writes it; if it goes missing (a `git clean`, say)
and `./icon-registry` stops resolving, run `npm run icons`.

## Commands

```bash
npm run tokens             # build the 5 token layers, concatenate in order
npm run tokens:contrast    # assert every declared fill/foreground pair, both modes
npm run tokens:watch       # rebuild tokens on token edits
npm run icons              # regenerate the icon registry from scripts/icons/allowlist.json
npm run lint:css           # the no-literals guard (libs/ui only)
npm run lint:standalone    # fails if any @NgModule shows up in libs/ or apps/
npm run build:lib          # ng build hmha-ui (ng-packagr, partial-Ivy)
npm test                   # ng test
npm run ci                 # everything above, in CI order
npm run build:site         # tokens, icons, library, sandbox and Storybook builds
npm run deploy:site        # build:site, then upload to https://cswilson.site
```

## Demo site

The sandbox is served at <https://cswilson.site> and Storybook at
<https://cswilson.site/storybook/>, from a private S3 bucket behind
CloudFront. `infra/site.yml` is the whole of it (bucket, certificate,
distribution, DNS records, and the role GitHub Actions deploys with),
deployed as the `hmha-site` CloudFormation stack in `us-east-1`:

```bash
aws cloudformation deploy --region us-east-1 --stack-name hmha-site \
  --template-file infra/site.yml --capabilities CAPABILITY_IAM \
  --parameter-overrides HostedZoneId=<the cswilson.site hosted zone ID>
```

To publish a new build, run the **Deploy site** workflow from the Actions
tab on `main`, or run `npm run deploy:site` locally with AWS credentials.
`build:site` rewrites `dist/hmha-ui`, so stop `npm start` first or the dev
server reports every library import as missing until it is restarted.

## Status

**v1 is released** on npm — `@halfmanhalfape/hmha-tokens` and
`@halfmanhalfape/hmha-ui` — and supports **Angular 20, 21 and 22**, each
verified by the CI install matrix (`scripts/verify-install-matrix.sh`).

Phases 1 and 2 (the token foundation, the zoneless workspace and the install
matrix) and six component waves are done: Icon, Button/IconButton (with a
pressed toggle state), Card, Field, Input/Textarea (with a character
counter), Checkbox, Radio, Switch, Dialog/Drawer, Menu, Tooltip, Toast,
Tabs, Select, Combobox, Pagination, Table, Data Grid, Chip, Expansion
Panel/Accordion, Stepper, Divider, Slider, Progress Bar, Spinner,
Skeleton, Avatar, Badge, File Upload, Alert, Empty State, Segmented
Control and Nav List. `libs/ui/README.md` has the full
consumer-facing catalog; `DECISIONS.md` has each wave's step tracker and the
reasoning behind every component.
