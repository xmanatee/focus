# Fucus Project Manifest

## Modules Summary

### 1. @fucus/ui-kit (`src/shared/components`)
- **Atomic UI**: Buttons, Toggles, Inputs.
- **Theme**: Dark/Light mode management.
- **Layouts**: Stack, Grid, Screen container.

### 2. @fucus/blocker-core (`src/features/blocker`)
- **App Picker**: Interaction with `FamilyActivityPicker`.
- **Logic**: Rule validation (can we block this?).
- **Sync Engine**: Periodically checks focus blocks and updates the native bridge.

### 3. @fucus/sync-engine (`src/features/schedule`)
- **Block Logic**: Pure functions for determining if a block is currently active.
- **Materializer**: Converts high-level block definitions into atomic native monitoring plans.

### 4. @fucus/lock-in (`src/features/settings`)
- **Policy**: Weekly "Setup Blocks" where changes are permitted.
- **Enforcement**: State machine for global read-only mode.

## Implementation Roadmap

- **Step 1: Scaffolding** (Complete)
- **Step 2: Native Bridge Development** (Complete)
- **Step 3: Core UI Development** (Complete)
- **Step 4: Focus Blocks & Lock-in Engine** (Complete)
- **Step 5: Testing & Production Hardening** (In Progress)
