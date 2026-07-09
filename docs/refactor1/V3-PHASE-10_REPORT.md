# V3-PHASE-10 Report — Delivery-Role Slots (DE / PM / M&S)

> Executed from `docs/refactor1/V3-PHASE-10_Delivery_Role_Slots.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (61 specs)  
> Git: **committed, not pushed** (remediation sequence; push once at Phase 13).

## Fields added

| Field | Purpose |
|-------|---------|
| `Project.dataEngineerId` | Lead builder (Development) |
| `Project.programManagerId` | Deployment / program lead |
| `Project.maintenanceOwnerId` | Live ops owner (Use) |

Initialized `null` in `emptyV3Fields` / `v3Defaults`. CI: `dataEngineerName`, `programManagerName`, `maintenanceOwnerName`.

## Assignment + `canAssignRole`

`src/lib/deliverySlots.ts`:
- **Governance** (Admin / GovernanceLead / AIProgramManager): assign or clear any DE/PM/M&S slot (same as BA).
- **Self-claim:** matching role may assign **themselves only** (cannot clear or assign others).
- BA remains governance-only via `canAssignBusinessAnalyst` (re-exported from `baArtifacts`).

Store actions: `assignDataEngineer`, `assignProgramManager`, `assignMaintenanceOwner` (audit + `lastActivityAt`). Qualify payload accepts optional `dataEngineerId` / `programManagerId`.

UI: qualification pickers (BA/DE/PM); header `DeliverySlotSelect` for all four slots; Overview amber hint when Active + no M&S owner.

## Queues + URL filters

| Role | Queue stats | Deep-link |
|------|-------------|-----------|
| DE | `deDevelopmentQueue` (assigned + Active + Development) | `?stage=Development&assigned=de` |
| PM | `pmReviewQueue` (all Submitted) + `pmDeploymentQueue` (assigned + Deployment) | Submitted or `?stage=Deployment&assigned=pm` |
| M&S | `msActiveQueue` + `msIdleAssignedQueue` | `?assigned=ms` |

`useFilteredProjects` now supports `?tier=` and `?assigned=ba|de|pm|ms`. Projects list has a Tier filter. R&C Tier3 callout → `/projects?tier=Tier3`.

## Notifications (assigned vs role-wide)

New kinds: `development-started`, `deployment-started`, `go-live`.  
`assignedOrRole(id, role)` prefers named lead; falls back to all users of that role.

| Event | TO |
|-------|----|
| Enter Development | assigned DE (or all DE) |
| Enter Deployment | assigned PM (or all PM) |
| Go-live (`approved` no-EHS / `ehs-approved`) | assigned M&S (or all M&S) |
| `requirements-confirmed` / `uat-signed-off` | prefer assigned DE/PM |

Aging TO still includes M&S (assigned preferred).

## Seeds

Assigned `usr-data` / `usr-pm` / `usr-maint` on Active/Completed/Idle demos with BA; left **prj-042** M&S null (go-live hint) and **prj-061** DE null (claim demo).

## Tests

`deliverySlots.test.ts`, store assign/self-claim, notification targeting, dashboard queue scoping. Fixtures updated for new Project fields.

## Skipped / flagged

Nothing skipped. No new stage artifacts (DE verification → Phase 12; M&S Use content → Phase 11).

Closes the systemic delivery-role slot for DE/PM/M&S (BA already done in Phase 8).
