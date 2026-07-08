# V3 Model — Implemented Capstone (1.0)

Concise map of what shipped in Phases 0–7. Not a rewrite of the phase prompts.

## Status spine (16)

| Status | Category | Typical next |
|--------|----------|--------------|
| IdeaDraft | intake | ForAssessment, Cancelled |
| ForAssessment | intake | Qualified, NotQualified, Cancelled |
| NotQualified | intake | ForAssessment (revise), Cancelled |
| Cancelled | lifecycle | — |
| Qualified | intake | QualifiedDraft, Submitted |
| QualifiedDraft | intake | Submitted |
| Submitted | review | ForEHSReview / Active, Rejected |
| Rejected | review | Submitted (resubmit), Cancelled |
| ForEHSReview | review | Active, EHSRejected |
| EHSRejected | review | Submitted, Cancelled |
| Active | active | ForSponsorApproval, Idle (aging) |
| ForSponsorApproval | closure | Completed, Disapproved |
| Disapproved | closure | Active (revise) |
| Completed | closure | — |
| Idle | lifecycle | Active (reactivate), Deactivated (aging) |
| Deactivated | lifecycle | Active (reactivate) |

Source of truth: `src/lib/projectStatus.ts` (`PROJECT_STATUSES`, `STATUS_META`, transitions, stage anchors).

## Two-axis mapping

- **V3 status** = operational gate vocabulary (who acts next).
- **ISO lifecycle** = `currentStage` + `stageStatus` (Assessment → … → Decommissioning + Enablement).
- Pre-Active statuses pin stage via `STATUS_STAGE_ANCHOR`. Under **Active**, ISO stages walk independently.
- Side effect kept: **Decommissioning + stage Completed → Deactivated** (governance retirement). Aging can also Deactivate.

## Tiers + stack ownership

| Tier | Risk | Stack owners |
|------|------|--------------|
| Tier1 Self-build | Low | Submitter (owner) + DataEngineering + Admin |
| Tier2 Collaborative | Medium | DE + AIProgramManager + BA + Admin |
| Tier3 Team-led | High | AIProgramManager + DE + Admin |

`canOwnStack` / `getStackOwnerRoles` in `src/lib/tiering.ts`. Qualification sets tier + reward; risk checklist drives suggested tier.

## Gate roles

| Gate | Roles | Store actions |
|------|-------|---------------|
| Qualification | GovernanceLead, RiskCompliance, Admin | `qualifyProject`, `rejectQualification`, `cancelProject` |
| Tool / submit | stack owners by tier | `saveQualifiedDraft`, `submitForReview` |
| Review approve/reject | GovernanceLead, AIProgramManager, Admin | `approveSubmission`, `rejectSubmission` |
| EHS | EHS (+ Admin) | `ehsApprove`, `ehsReject` — EHS never submits |
| Sponsor closure | assigned Sponsor / Admin | `submitForSponsorApproval`, `sponsorApprove`, `sponsorDisapprove` |
| Reactivate | Governance / PM / Admin (+ owners) | `reactivateProject` |

## Aging + demo clock

- Anchor: `DEMO_TODAY` = 2026-06-20 (`seedProjects.ts`).
- Offset: `demoClockStore` days from anchor; `nowIso` / `formatRelative` use demo time.
- Ladder: reminder 7d → Idle 14d → alert 180d → Deactivate 187d (`src/lib/aging.ts`).
- `runAging` on bootstrap; Admin Demo Controls advance clock.

## Notifications + CI mirror

- `notificationsStore` + `notify` / `recipientsFor` (`notificationRules.ts`).
- Kinds cover intake → review → EHS → sponsor → aging / reactivate.
- `ciPortal: CiPortalAdapter` → `LocalMirrorAdapter` (`ciPortalAdapter.ts`); swap later without call-site changes.

## Dashboard (Phase 7)

KPI: total, Active, Completed, hours saved (sponsor-validated). Queues deep-link: ForAssessment, ForEHSReview, ForSponsorApproval, Idle, Deactivated. Status pipeline + tier distribution; adoption excludes IdeaDraft / NotQualified / Cancelled.
