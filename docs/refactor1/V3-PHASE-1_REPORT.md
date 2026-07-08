# V3-PHASE-1 Report — Profile & Roles

> Executed from `docs/refactor1/V3-PHASE-1_Profile_and_Roles.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (3 specs)  
> Git: committed locally, **not pushed** (non-milestone phase).

## Actual `authStore` shape (found / unchanged)

`src/stores/authStore.ts` remains a thin mock-auth store:

```ts
interface AuthStore {
  currentUser: User | null
  loginAs: (user: User) => void
  logout: () => void
}
// persist key: 'gcs-ai-portal-auth'
// helper: useIsAuthenticated() => currentUser !== null
```

Login selects a seed `User` from `SEED_USERS` on `LoginPage` and calls `loginAs(user)`. Profile data is **not** stored on auth — it lives in the new `profileStore` keyed by `userId`.

## Per-file summary

### New
| File | Change |
|------|--------|
| `src/stores/profileStore.ts` | Persisted profiles map (`gcs-ai-portal-profiles`); `getProfile` / `saveProfile` / `isComplete` / `resetProfiles`; `getProfileDefaults` for intake |
| `src/pages/ProfileSetupPage.tsx` | Skill + tool chain + integrations setup; Skip for now; mock M365 note |
| `src/pages/ProfilePage.tsx` | Profile summary + Edit; My Entries (drafts vs submitted/active) |
| `src/components/layout/ProfileIncompleteBanner.tsx` | Dismissible shell banner while profile incomplete |

### Seed / bootstrap / UI store
| File | Change |
|------|--------|
| `src/data/seedRoles.ts` | Completed profiles on `usr-submitter` (Basic) and `usr-data` (Advanced); others incomplete |
| `src/stores/bootstrapStores.ts` | Rehydrate + seed profiles; clear-all wipes profiles key |
| `src/stores/uiStore.ts` | Session flags: `profileSetupSkipped`, `profileBannerDismissed` (+ reset on sign-out) |

### Router / shell / nav
| File | Change |
|------|--------|
| `src/routes/AppRoutes.tsx` | `/profile`, `/profile/setup` |
| `src/routes/ProtectedRoute.tsx` | First-login redirect to setup (respects skip); still wraps `AppShell` |
| `src/components/layout/AppShell.tsx` | Renders `ProfileIncompleteBanner` |
| `src/components/layout/Sidebar.tsx` | Profile nav item (all roles) |
| `src/components/layout/Topbar.tsx` | “My profile” menu item; clears session profile flags on sign-out |
| `src/pages/LoginPage.tsx` | Mock M365 “pending IT approval” note |
| `src/pages/SubmitProjectPage.tsx` | Wizard form initialised from `getProfileDefaults` |
| `src/components/admin/AdminDemoControlsTab.tsx` | Reset profiles + clear-all includes profiles |

## EHS sanity

- EHS persona (`usr-ehs`) remains in login grid and loads dashboard.
- **Not** in any `SUBMIT_ROLES` (`SubmitProjectPage`, `ProjectsListPage`, `DashboardPage`, Sidebar submit link) — EHS cannot submit.
- No EHS review queue wired (Phase 4).

## Confirmations

- [x] No changes to `projectStatus.ts`, transition graph, or `applyStatusSideEffects`
- [x] `estimatedUsers` TODO(V3 Phase 2) left untouched
- [x] Skip-for-now avoids redirect trap for the rest of the session
- [x] Seeded-profile personas (Maria / Nico) skip first-login redirect
- [x] Incomplete personas redirect once to `/profile/setup`

## Skipped / flagged

1. Did **not** add a dedicated “Reset profiles” icon beyond reusing `RotateCcw` in Admin (visual consistency over new icon dependency).
2. Submit empty-state on Profile “My Entries” does not deep-link for non-submit roles (EmptyState only) — intentional; EHS/Sponsor won’t have submitter entries.
3. Profile fields on `User` in seed are mirrored into `profileStore` on init; runtime edits go to the store only (auth `currentUser` object is not mutated). Next phases should keep reading profiles from `profileStore`, not from `currentUser.skillLevel`.
4. Existing localStorage without `gcs-ai-portal-profiles` will seed on bootstrap; Admin → Clear all / Reset profiles refreshes demo state.
