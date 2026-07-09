# V3-PHASE-11 Report — AI Use Overlay for M&S

> Executed from `docs/refactor1/V3-PHASE-11_MS_Use_Overlay.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅ (69 specs)  
> Git: **committed, not pushed** (remediation sequence; push once at Phase 13).

## Data model

| Type | Values / shape |
|------|----------------|
| `HealthState` | `Healthy` \| `Watch` \| `Incident` |
| `DriftState` | `None` \| `Suspected` \| `Confirmed` |
| `Incident` | id, openedAt, severity, summary, status Open/Closed, closedAt, note |
| `Project.operations` | `{ health, incidents, drift, driftNote, lastReviewedAt } \| null` |

Null until go-live; `activateProjectFields` seeds `emptyOperations()`.

## `operations.ts`

- `canOperate` — assigned `maintenanceOwnerId` or Admin; if unassigned, any M&S.
- `deriveHealth` — auto-`Incident` while open incidents exist.
- `openIncidentCount` / `hasOpenIncident` / CI labels.
- **No stage-transition gates** on health/incidents (monitoring only).

## Store actions

`setHealthStatus`, `logIncident`, `closeIncident` (→ Watch when last open closes), `setDrift`, `recordUseReview` — all `canOperate`-gated, audit + `lastActivityAt`, init ops if null.

## UI

- `OperationsPanel` on Lifecycle **Use** card + Overview when Use/Active with ops.
- `HealthChip` on header + projects list.
- Edit for assigned M&S / Admin / unassigned-fallback M&S; others read-only.

## Notifications & queues

| Kind | TO / CC |
|------|---------|
| `incident-opened` | M&S · CC Gov+PM |
| `incident-closed` | owners+M&S · CC Gov |
| `drift-flagged` | M&S · CC Gov+DE |

M&S dashboard callout adds open-incident + drift-flagged counts (`msIncidentQueue`, `msDriftQueue`).

## Drift ownership (`lifecycle.ts`)

Use stage: primary **M&S**; supporting **RiskCompliance + DataEngineering** (DE for Confirmed-drift remediation CC path). Description updated to cite drift ownership.

## CI + seeds

CI columns: **Health**, **Drift**.  
Seeds: `prj-042` open High incident; `prj-051` Healthy; `prj-019` Watch+closed incident; `prj-066` drift Suspected; `prj-008` Healthy closed ops.

## Tests

`operations.test.ts` (canOperate, deriveHealth); store go-live init / incident / drift notify; notification targeting.

## Flagged

Product may later want “can’t complete/close with open incidents” — **not** implemented (per prompt).

Closes the M&S empty Use-phase gap.
