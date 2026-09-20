# @halfmanhalfape/hmha-ui

Standalone Angular components for the Half Man Half Ape design system. See the
repository root `CLAUDE.md` for the architectural invariants (standalone only,
signals only, zoneless-safe, no hard-coded values, component tokens as the
override API) and `DECISIONS.md` for why.

Build: `npm run build:lib` (ng-packagr, partial-Ivy, from the repo root).

## Components

| Component | Selector | Docs |
| --- | --- | --- |
| Button | `button[hmhaButton]` | [`src/lib/button/README.md`](./src/lib/button/README.md) |

Each component documents its inputs and its component-token override API
alongside its source, per the contract in `DECISIONS.md` fork 05.
