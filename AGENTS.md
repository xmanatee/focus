# Project Instructions

Before broad work, read parent `AGENTS.md` files up to the mono root; nearest scoped instructions apply last.

## Validation

`npm run check` runs fast static and unit checks; CI then runs `npm run build`
to export Android and iOS JavaScript bundles. `npm run check:all` also runs the native
Android verification locally. Signed Android/iOS builds remain release work.
