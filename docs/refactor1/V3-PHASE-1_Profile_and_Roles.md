# V3-PHASE-1 — Profile & Roles

> **Cursor — read this fully before editing. Surgical refactor of the existing app; Phase 0 is already merged.**
> Standing rules for every V3 phase:
> - Do **not** regenerate files. **Read each target file's current contents first**, then use `str_replace`/surgical edits. If a target differs from what's described here or a change would clobber a later fix, **stop and report** — don't overwrite blindly.
> - Never `git add -A` blindly: stage the files you intended to change, and report anything else that shows as modified.
> - End at a green `npm run build` **and** `npm run test`.
> - **Git:** this is a **non-milestone** phase → **commit, do not push.** After green build+tests, `git commit` with `feat(profile): first-login profile setup + profile page [Phase 1]`. **Do not `git push`** — this lands with the Phase 2 milestone deploy. Never force-push or rewrite history.
> - Write your change report to **`docs/refactor1/V3-PHASE-1_REPORT.md`** (per-file summary, anything skipped/flagged, and — importantly — the **actual shape of `authStore`** you found, so the next phase can build on it).

## Scope of this phase
Item 1 of the V3 flow: **each user sets up a profile (skill level + existing tool chain + integration targets), which then pre-fills intake.** Plus the mock M365 "account pending IT approval" step, a Profile page that will also host "My Entries," and a sanity pass on the EHS persona. **No status/transition changes** — do not touch `projectStatus.ts`, the transition graph, or `applyStatusSideEffects`.

## Read first (locate + read before writing)
- `src/stores/authStore.ts` — how `currentUser` is set/persisted and how login selects a persona.
- `src/pages/LoginPage.tsx` — persona selection UI.
- The router/route definitions (likely `src/App.tsx` or `src/routes.tsx`) and the app shell / sidebar / nav component.
- `src/data/seedRoles.ts` (has `usr-ehs` now), `src/pages/SubmitProjectPage.tsx`, `src/lib/submissionWizard.ts` (`EMPTY_WIZARD_FORM`, `INTEGRATION_TARGET_OPTIONS`), `src/stores/catalogStore.ts` (tool list).
- `src/types/index.ts` — the `User` profile fields added in Phase 0 (`skillLevel?`, `toolChain?`, `integrationTargets?`, `profileComplete?`).

---

## Step 1 — Profile store (`src/stores/profileStore.ts`, new)
Decouple profile from auth internals. Zustand + `persist`, key `gcs-ai-portal-profiles`:
- State: `profiles: Record<string /*userId*/, { skillLevel: SkillLevel; toolChain: string[]; integrationTargets: string[]; profileComplete: boolean }>`.
- **Initialise** the map from `SEED_USERS`: for each seed user that carries profile fields, seed those; otherwise omit (→ treated as incomplete).
- Actions: `getProfile(userId)`, `saveProfile(userId, patch)` (sets `profileComplete: true`), `isComplete(userId)`.
- Export a `getProfileDefaults(userId)` helper returning `{ skillLevelAvailable, existingTools, integrationTargets }` shaped for the intake form (empty-safe when no profile).

## Step 2 — Seed two demo profiles (`src/data/seedRoles.ts`)
Give **two** existing seed users completed profiles (e.g. the Data Engineering persona = Advanced with a realistic tool chain; one Submitter = Basic) by populating their `User` profile fields. Leave the rest without profiles so the **first-login setup flow is demoable**. Don't add new users.

## Step 3 — Profile Setup screen + route (`src/pages/ProfileSetupPage.tsx`, new; route `/profile/setup`)
Three inputs, pre-filled from any existing profile:
- **Skill level** — select over `SkillLevel` (`None`→`Advanced`).
- **Existing tool chain** — multi-select from the live catalog tool names + a free-text "Other".
- **Integration targets** — multi-select from `INTEGRATION_TARGET_OPTIONS`.
Reuse existing shadcn form primitives and the app's visual language (match `SubmitProjectPage`). On save → `profileStore.saveProfile(currentUser.id, …)`, toast, and route to `/profile` (or back to the page they came from). Allow a **"Skip for now"** so the demo is never stuck.

## Step 4 — Profile page (`src/pages/ProfilePage.tsx`, new; route `/profile`)
- **Profile summary** (skill level, tool chain, integration targets) with an **Edit** button → `/profile/setup`. If incomplete, show a prompt to complete it.
- **My Entries** — a list of projects owned by `currentUser.id` (`submitterId === currentUser.id`), grouped by whether they're still drafts (`IdeaDraft`/`QualifiedDraft`) vs submitted/active, linking to each project. (This section is the future home of AI-assisted "session history" in Phase 2 — build the container now, populated from existing projects.)

## Step 5 — First-login gate + M365 mock
- On entering the authenticated app, if `!profileStore.isComplete(currentUser.id)`, **redirect once** to `/profile/setup` (respect "Skip for now" for the rest of the session — e.g. a session flag — so it doesn't trap the user), and show a dismissible **banner** in the shell ("Complete your profile to pre-fill new submissions") while incomplete.
- Add **mock M365 copy** on the login/first-run path: a small, clearly-mock note that the user's M365 account is *"pending IT approval"* and that they can set up their profile meanwhile. Cosmetic only — no real auth.

## Step 6 — Nav + EHS persona sanity
- Add a **Profile** link to the sidebar/nav (and/or the user menu) for all roles.
- Confirm the **EHS** persona is coherent: it renders the dashboard/login without error, and is **not** in any `SUBMIT_ROLES` array (EHS is a reviewer, not a submitter) — verify `SubmitProjectPage` and `ProjectsListPage` exclude it. Do **not** wire the EHS review queue yet (Phase 4).

## Step 7 — Pre-fill intake from profile
In `SubmitProjectPage`, initialise the wizard `form` by spreading `getProfileDefaults(currentUser.id)` over `EMPTY_WIZARD_FORM` (so `skillLevelAvailable` / `existingTools` / `integrationTargets` arrive pre-filled, still editable). Keep the `// TODO(V3 Phase 2)` `estimatedUsers` note untouched — the intake realignment itself is Phase 2.

---

## Step 8 — Verify · Git · report
1. `npm run build` ✅ and `npm run test` ✅.
2. Manually: log in as a **no-profile** persona → redirected to setup → save → lands on `/profile`; new submission is pre-filled. Log in as a **seeded-profile** persona → no redirect, profile shows. EHS persona loads and cannot submit.
3. `git add` the intended files → `git commit -m "feat(profile): first-login profile setup + profile page [Phase 1]"`. **No push.**
4. Write **`docs/refactor1/V3-PHASE-1_REPORT.md`**: per-file changes, the real `authStore` shape you built against, the router/shell files touched, and anything skipped or flagged.
