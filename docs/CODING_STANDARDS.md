# Fucus Coding Standards

## 1. The 300-Line Absolute Limit
No file in `src/` may exceed 300 lines (including comments). 
If it grows beyond this:
1. **Extract Hooks**: Move `useEffect`, `useState` logic into a custom `use[Feature].ts` hook.
2. **Atomic Components**: Break the UI into smaller sub-components (e.g., `Header`, `ProgressRing`, `ActionButton`).
3. **Logic Outsourcing**: Move complex calculations into `utils/` or `services/`.

## 2. Feature-Based Architecture
We organize code by feature. Each feature is a mini-app with its types,
validation, and store co-located.

## 3. TypeScript Guidelines
- **No `any`**. Strict typing.
- **Discriminated Unions** for state with distinct shapes.
- **Explicit Return Types** on exported functions and hooks.

## 4. State Management (Zustand)
- One store per major feature.
- All persisted stores go through `src/shared/storage.ts` (AsyncStorage +
  iCloud KV fan-out).
- **Selector Pattern**: always use selectors to prevent re-renders.
  ```typescript
  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  ```

## 5. Portability Layer
All platform-specific code (Screen Time, HealthKit, Notifications) must be wrapped in a generic interface in `src/bridge/`. 
If we move to Android, we should only swap the bridge implementation, not the UI or business logic.
