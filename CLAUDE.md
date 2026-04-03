# CLAUDE.md — KidStar App

## Project Overview

KidStar is a cross-platform family task/reward app built with **Expo + React Native** (iOS, Android, Web). Parents manage activities, rewards, and kids; kids earn points and redeem rewards. The backend is entirely Firebase (Auth, Firestore, Storage) with no REST API layer.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React Native 0.81.5 + Expo ~54 |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| Backend | Firebase 12 (Auth, Firestore, Storage) |
| Auth providers | Email/Password, Google OAuth, Apple Sign-In |
| Build/Deploy | EAS (Expo Application Services) + Firebase Hosting |
| Web bundler | Expo Metro |

---

## Repository Structure

```
kidstar-app/
├── App.tsx              # Root component: auth gating + navigation tree
├── index.ts             # Expo entry point
├── types.ts             # All shared TypeScript interfaces
├── assets/              # Static images (splash, icon, favicon)
├── components/          # Reusable UI components
├── constants/           # Colors, spacing, layout scaling utilities
├── context/             # React context providers (Family, Toast)
├── hooks/               # Custom hooks (data fetching via Firestore onSnapshot)
├── screens/             # Screen components (18 total)
├── services/            # Firebase service functions (no direct SDK calls in screens)
├── app.json             # Expo configuration
├── eas.json             # EAS build channels (development/preview/production)
├── firebase.json        # Firebase Hosting config
├── firestore.rules      # Firestore security rules
└── firestore.indexes.json
```

---

## Architecture Conventions

### Data Flow

```
Screen → Custom Hook (onSnapshot) → Firestore
Screen → Service Function → Firestore (writes)
Screen → Context (FamilyContext / ToastContext)
```

- **Never call Firebase SDK directly from screens or components.** All reads go through custom hooks in `hooks/`; all writes go through service functions in `services/`.
- Hooks use `onSnapshot` for real-time updates and return plain arrays/objects.
- Services export plain async functions; they never return Firestore `DocumentReference` types to callers.

### Service Layer (`services/`)

Each file corresponds to a domain:

| File | Domain |
|---|---|
| `firebase.ts` | Exports `auth`, `db`, `storage` singletons |
| `auth.ts` | Sign-in/out/up, profile update, password reset |
| `family.ts` | Family CRUD, join codes, member management |
| `kids.ts` | Kid CRUD, avatar upload |
| `activities.ts` | Activity CRUD |
| `completions.ts` | Recording completions |
| `classes.ts` | Class schedule CRUD |
| `rewards.ts` | Reward CRUD |
| `journal.ts` | Journal entry CRUD |
| `members.ts` | Family member operations |
| `invitations.ts` | Invitation management |
| `account.ts` | Account deletion, profile |

### Custom Hooks (`hooks/`)

All hooks subscribe to Firestore in real time:

- `useAppState` — central auth + user context (auth state, familyId, role, kidId, isAdmin)
- `useKids` / `useActivities` / `useClasses` / `useRewards` / `useMembers` / `useRewards` — collection queries
- `useTodayCompletions` — completions filtered to today's date
- `useJournal` — journal entries for a kid

### Context (`context/`)

- **FamilyContext** — provides `familyId`, `familyName`, `role`, `kidId`, `isAdmin`, `userFamilies[]`
  - Access via hooks: `useFamilyId()`, `useRole()`, `useIsAdmin()`, etc.
- **ToastContext** — provides `showToast(message, type)` for "success" | "error" | "info" toasts

### Navigation (`App.tsx`)

Navigation tree based on auth state:

```
Unauthenticated → Landing → Login
Authenticated, no family → CreateFamily | JoinFamily
Authenticated, role=parent → ParentTabNavigator (Dashboard, Activities, Classes, Rewards, Family)
Authenticated, role=kid → KidViewScreen
```

Deep links are configured for: `https://kidstar-app.web.app`, `localhost:8081`, `localhost:19006`, `kidstar://`

---

## Firestore Data Model

```
/users/{uid}              # User profile (familyId, role, kidId, activeFamilyId)
/families/{familyId}
  /kids/{kidId}           # Kid profiles (points, streak, level, emoji, color, photo)
    /journal/{entryId}    # Journal entries (text, photos, mood, date)
  /activities/{actId}     # Activity definitions (title, points, category, emoji)
  /completions/{compId}   # Activity completions — APPEND ONLY (no updates/deletes)
  /classes/{classId}      # Recurring class schedules (day of week, time)
  /rewards/{rewId}        # Reward definitions (title, points cost, emoji)
  /redemptions/{redId}    # Reward redemptions — APPEND ONLY (no updates/deletes)
  /members/{memberId}     # Family membership records
  /invitations/{invId}    # Pending invitations
/invitations/{invId}      # Top-level copy for email-based queries
```

**Key constraints (enforced in security rules):**
- Completions and Redemptions are append-only; never update or delete them.
- Only family members can read family sub-collections.
- Only parents can write kids, activities, classes, and rewards.
- Journal entries: parents write, all members read.

**Activity categories:** `"chore" | "homework" | "behavior" | "class"`
**User roles:** `"parent" | "kid"`
**Member roles:** `"admin" | "parent"`
**Journal moods:** `"positive" | "neutral" | "needs-work"`

---

## Styling Conventions

- Every component uses `StyleSheet.create()` at the bottom of the file — no inline styles.
- Import colors from `constants/colors.ts`, spacing from `constants/index.ts`, scaling utilities from `constants/layout.ts`.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| primary | `#2563EB` | Buttons, highlights |
| secondary | `#F97316` | Accent orange |
| accent | `#7C3AED` | Purple accent |
| background | `#F8FAFC` | Screen backgrounds |
| surface | `#FFFFFF` | Cards, modals |
| text | `#0F172A` | Primary text |
| error | `#EF4444` | Error states |
| success | `#10B981` | Success states |

### Spacing Scale

`xs`=4, `sm`=8, `md`=16, `lg`=24, `xl`=32, `xxl`=48 (all in px)

### Layout Scaling

Use utilities from `constants/layout.ts` for responsive sizing:
- `scale(size)` — linear scale based on iPhone 14 screen width
- `moderateScale(size, factor?)` — gentler scaling for font sizes
- `horizontalPad` — adaptive horizontal padding for different screen sizes

---

## TypeScript Conventions

- Strict mode is enabled (`tsconfig.json` extends Expo base).
- All shared types live in `types.ts` at the root. Do not define types locally if they are shared.
- Use explicit return types on service functions.
- Do not use `any`; use `unknown` when the type is truly unknown, then narrow.

---

## Environment Variables

All variables are prefixed `EXPO_PUBLIC_` so they're bundled into the client. Copy `.env.example` to `.env`:

```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
```

---

## Development Workflow

### Running Locally

```bash
npm install
cp .env.example .env   # fill in Firebase values
npm start              # Expo dev server (scan QR with Expo Go)
npm run ios            # iOS simulator
npm run android        # Android emulator
npm run web            # Web at localhost:8081
```

### Builds (EAS)

```bash
eas build --profile development   # Dev client build (simulator)
eas build --profile preview       # Internal distribution
eas build --profile production    # App Store / Play Store submission
```

### Firebase

```bash
firebase deploy --only firestore:rules    # Deploy security rules
firebase deploy --only firestore:indexes  # Deploy composite indexes
firebase deploy --only hosting            # Deploy web build (from dist/)
```

---

## Key Patterns to Follow

1. **Real-time data:** Use `onSnapshot` in hooks. Never use `getDoc`/`getDocs` for data that should stay live.
2. **Cascading deletes:** When removing a kid, also delete their journal entries, completions, redemptions, and storage avatar (see `services/kids.ts`).
3. **Multi-family support:** Users can belong to multiple families. Use `activeFamilyId` (or fallback `familyId`) from the user doc to determine the active family.
4. **Admin check:** Use `useIsAdmin()` before rendering admin-only UI. The security rules also enforce this server-side.
5. **Join codes:** Family join codes are 6-character alphanumeric strings generated in `services/family.ts`.
6. **Points:** Points are stored on the kid document and should only be incremented when a completion is recorded, never set directly.
7. **Date handling:** `getTodayDate()` from `services/completions.ts` returns today's date as `YYYY-MM-DD`. Use this consistently for all date comparisons.

---

## What Does NOT Exist (Don't Assume)

- No test files or test framework (no Jest, Vitest, Detox).
- No REST API or backend server — Firebase only.
- No Redux or Zustand — context + hooks only.
- No CSS modules, Tailwind, or styled-components — `StyleSheet.create()` only.
- No ORM — direct Firestore SDK calls in services.
- No monorepo tooling (no Turborepo, nx, etc.).

---

## Branch / Commit Conventions

- Feature branches: descriptive names, no strict prefix convention observed.
- Commit messages: descriptive, feature-focused (e.g., `"Add multi-family, remove child, delete account, leave family, transfer admin"`).
- Development branch for AI tasks: `claude/add-claude-documentation-OTlcU`.
