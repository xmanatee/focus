# Fucus Coding Standards

## 1. The 300-Line Absolute Limit
No file in `src/` may exceed 300 lines (including comments). 
If it grows beyond this:
1. **Extract Hooks**: Move `useEffect`, `useState` logic into a custom `use[Feature].ts` hook.
2. **Atomic Components**: Break the UI into smaller sub-components (e.g., `Header`, `ProgressRing`, `ActionButton`).
3. **Logic Outsourcing**: Move complex calculations into `utils/` or `services/`.

## 2. Feature-Based Architecture
We organize code by "Feature," not by "Type." Each feature is a mini-app:
- `features/blocker/`: Picker UI, blocker logic, store.
- `features/auth/`: Login screens, session management.
- `features/status/`: Main dashboard, focus timer.

## 3. TypeScript Guidelines
- **No `any`**: Use strict typing.
- **Discriminated Unions**: For `status` ('idle', 'loading', 'active').
- **Explicit Return Types**: On all hooks and API functions.

## 4. State Management (Zustand)
- One store per major feature.
- **Selector Pattern**: Always use selectors to prevent unnecessary re-renders.
  ```typescript
  const isActive = useBlockerStore((s) => s.isActive);
  ```

## 5. Portability Layer
All platform-specific code (Screen Time, HealthKit, Notifications) must be wrapped in a generic interface in `src/bridge/`. 
If we move to Android, we should only swap the bridge implementation, not the UI or business logic.
