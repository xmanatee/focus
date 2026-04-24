# Fucus: Next-Gen App & Web Blocker (Design Doc)

## 1. Executive Summary
Fucus is a productivity application for iOS, iPadOS, and macOS designed to help users regain focus by blocking distracting apps and websites. Built with **React Native**, it leverages Apple's modern **Screen Time API** (introduced in iOS 15/16) to provide native-level blocking without the need for VPNs or MDM profiles.

---

## 2. Research & Competitive Analysis

### 2.1 Existing Solutions
| App | Tech | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Opal** | Native (Swift) | High polish, deep Screen Time integration. | Subscription heavy, closed source. |
| **Freedom** | VPN/Profile | Cross-platform (Windows/Mac/Mobile). | VPN can be unstable; privacy concerns. |
| **Digital Break** | RN (Open Source) | Proof of concept for React Native Screen Time. | Basic UI, limited scheduling. |

### 2.2 Core Technical Hurdles
1. **Entitlements:** Accessing the `ManagedSettings` framework requires the `com.apple.developer.family-controls` entitlement, which must be requested manually from Apple.
2. **Extensions:** System-level blocking occurs in separate processes (App Extensions). React Native logic does not run here; these must be lightweight Swift targets.
3. **Website Blocking:** Limited to 50 specific domains at a time via `webContent.blockedByFilter`.

---

## 3. Technical Architecture

### 3.1 Tech Stack
*   **Framework:** React Native (CLI or Expo with Config Plugins).
*   **Language:** TypeScript (Strict Mode).
*   **State Management:** Zustand (Lightweight, efficient for small files).
*   **Database/Auth:** Supabase (Auth, RLS, and syncing schedules).
*   **Styling:** Vanilla CSS-in-JS (StyleSheet) or Tailwind (NativeWind).

### 3.2 Native Integration (The "Bridge")
We will use a hybrid approach. While most of the app is React Native, the following modules require Swift:
*   **`ScreenTimeModule`**: Requests permissions and sets/clears block lists.
*   **`DeviceActivityMonitorExtension`**: A Swift target that triggers when a "Block Session" starts or ends.
*   **`ShieldConfigurationExtension`**: A Swift target to customize the "App Blocked" screen.

### 3.3 Project Structure (300-Line Rule)
To maintain the **strict 300-line file limit**, we will use a **Feature-Based Atomic Architecture**:

```text
src/
├── features/
│   ├── auth/
│   │   ├── components/       # LoginButton.tsx (Max 50 lines)
│   │   ├── hooks/            # useAppleAuth.ts, useGoogleAuth.ts
│   │   └── services/         # authService.ts
│   ├── blocker/
│   │   ├── components/       # AppPicker.tsx, ScheduleList.tsx
│   │   ├── hooks/            # useBlockerActions.ts
│   │   ├── native/           # ScreenTimeBridge.swift
│   │   └── store/            # blockerStore.ts
├── shared/
│   ├── ui/                   # Reusable atomic components (Button, Input)
│   └── utils/                # formatTime.ts, validation.ts
└── App.tsx
```

---

## 4. Product Features & UX

### 4.1 Authentication
*   **Apple Sign-In:** Mandatory for iOS apps with social login.
*   **Google Sign-In:** Secondary option for cross-platform sync.
*   **Anonymous Mode:** Allow users to try blocking before creating an account.

### 4.2 Blocking Logic
*   **Categories:** Block all "Social Media" or "Games" with one click.
*   **Individual Apps:** Granular selection via `FamilyActivityPicker`.
*   **Websites:** Manual domain entry (e.g., `twitter.com`).

### 4.3 Scheduling (The "Fucus" Mode)
*   **Quick Start:** "Focus for 25 minutes" (Pomodoro style).
*   **Recurring Schedules:** "Mon-Fri, 9:00 - 17:00".
*   **Deep Work:** A mode where the user *cannot* disable the block until the timer ends (requires strict `DeviceActivity` monitoring).

---

## 5. Development Roadmap

### Phase 1: Foundation (Research & Setup)
*   Register App ID and request Screen Time entitlements.
*   Scaffold RN project with TypeScript and Folder structure.
*   Implement Auth (Apple/Google).

### Phase 2: Native Bridge
*   Implement `ScreenTimeModule` in Swift.
*   Create `DeviceActivityMonitor` and `ShieldConfiguration` extensions.
*   Verify basic app blocking on a physical device.

### Phase 3: UX & Logic
*   Build the Category/App picker UI.
*   Implement scheduling logic and persistence in Supabase.
*   Add Pomodoro/Quick Start functionality.

### Phase 4: Polish & MacOS
*   Enable Mac Catalyst support for MacBook compatibility.
*   Refine UI for iPad/Mac screen sizes.
*   Final Performance optimization.

---

## 6. Constraints & Compliance
*   **Privacy:** No user data (app usage logs) is sent to the server. All monitoring happens on-device via Apple's private APIs.
*   **Stability:** Use `Zustand` for state to prevent unnecessary re-renders in the main UI thread.
*   **Maintenance:** Strict linting rules to enforce the 300-line file limit and prevent "prop drilling".
