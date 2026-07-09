# V3-FIX-SAQ Report — Real AI-SAQ workbook text

> Executed from `docs/refactor1/V3-FIX-SAQ_Real_Text.md`.  
> Verification: `npm run build` ✅ · `npm run test` ✅  
> Git: committed + pushed to `origin/main`.

## What changed

| Area | Change |
|------|--------|
| `src/lib/vendorSaq.ts` | Replaced ISO-42001 stand-in with verbatim **AI Supplier Self-Assessment Questionnaire (AI-SAQ)** text from the Vendor SAQ sheet |
| Scored content | **8 sections / 31 questions** (Q1–Q31) |
| Section 9 | Static `SAQ_DECLARATION` (certification + Name/Title/Organization/Signature/Date) — **not scored** |
| `VendorSaqPanel` | Title uses `SAQ_TITLE`; renders Section 9 declaration beneath scored questions |
| Gate / store / CI / notify / seeds logic | **Unchanged** |

## IDs

Preserved stable ids `saq-01` … `saq-31` (same numbering scheme as before). Seeds call `defaultSaqAnswers()` / `emptySaq()`, so Pass/Waived/Pending seeds pick up the new question text automatically — no seed file edits required.

## Special-format questions

- **Q5 / Q19** — options listed in question text; choice captured in the note (no new widgets).  
- **Q6 / Q14 / Q15 / Q20** — “if yes …” detail goes in the note.  
- Answer shape remains Yes/No/NA + note.

## Tests

- `vendorSaq.test.ts` asserts 31 answers, 8 scored sections, first/last question text, and Section 9 declaration fields.

## Deploy

- Commit: `02e347d` — `fix(saq): replace stand-in SAQ text with real AI-SAQ workbook content`  
- Push: `origin/main` (`22250a0..02e347d`)  
- **Vercel:** Deployment completed ([deploy](https://vercel.com/arcelocabangal-9817s-projects/gcs-ai-portal/HxC8opuuNktnnD5SpVJihBiZSnnH))
