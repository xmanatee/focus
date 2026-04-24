# Fucus Project Manifest

## Modules Summary

### 1. @fucus/ui-kit (`src/shared/components`)
- **Atomic UI**: Buttons, Toggles, Inputs.
- **Theme**: Dark/Light mode management.
- **Layouts**: Stack, Grid, Screen container.

### 2. @fucus/blocker-core (`src/features/blocker`)
- **App Picker**: Interaction with `FamilyActivityPicker`.
- **Logic**: Rule validation (can we block this?).
- **Sync Engine**: Periodically checks schedules and updates the native bridge.

### 3. @fucus/scheduler (`src/features/schedule`)
- **Logic**: Recurring days/hours calculation.
- **Persistence**: Supabase sync.

### 4. @fucus/auth (`src/features/auth`)
- **Providers**: Apple & Google.
- **Logic**: Session token management with Supabase.

## Project Roadmap

- **Step 1: Scaffolding** (Current Status)
- **Step 2: Native Bridge Development** (Screen Time basics)
- **Step 3: Core UI Development** (Auth & Dashboard)
- **Step 4: Scheduling & Background Sync**
- **Step 5: Testing & Release**
