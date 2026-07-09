# V3-FIX — Replace Vendor SAQ stand-in text with the real workbook content

> **Cursor — small content fix. Phases 0–13 merged & deployed.**
> Standing rules:
> - Do **not** regenerate files. **Read `src/lib/vendorSaq.ts` first**, then surgical `str_replace`. If the structure differs from what's described, **stop and report**.
> - Never `git add -A` blindly. End at green `npm run build` **and** `npm run test`.
> - **Git:** after green, `git commit -m "fix(saq): replace stand-in SAQ text with real AI-SAQ workbook content"` then **`git push origin main`** (standalone fix; confirm Vercel deploy). Never force-push.
> - Report to **`docs/refactor1/V3-FIX-SAQ_REPORT.md`**.

## Scope
Phase 13 shipped the Vendor AI-SAQ with **ISO-42001-style stand-in** question text because the workbook wasn't in-repo. Replace it with the **real** AI-SAQ content below (verbatim from `AI_Checklists.xlsx` → "Vendor SAQ"). **Text/structure only — do not change** the gate, scoping (`usesExternalVendor`), store actions, panel behaviour, outcomes (Pass/Fail/Waived), notifications, CI, or seeds. Answer semantics stay Yes/No/NA + note.

## Real content — 9 sections, 31 questions
Title: **"AI Supplier Self-Assessment Questionnaire (AI-SAQ)"**. Keep section grouping and question numbering exactly.

**Section 1 — Supplier & AI Service Overview**
1. Legal name of organization
2. Primary business location(s)
3. Description of AI or AI-enabled service(s) provided to Teradyne
4. Intended use case(s) involving Teradyne data or systems
5. AI lifecycle role (select all that apply): Model development / Data processing / Model hosting / inference / System integration / Support / maintenance
6. Will your AI service process or store Teradyne data? (If yes, identify data types — e.g., personal, confidential, proprietary)

**Section 2 — Responsible AI & Ethics**
7. Do you maintain a documented AI ethics or Responsible AI policy?
8. Have you implemented controls to mitigate bias, discrimination, or unethical outcomes in AI systems? (Briefly describe controls implemented)
9. Is human oversight in place for AI decision-making that may impact people, customers, or business operations? (Briefly explain oversight and escalation mechanisms)
10. Do you provide transparency regarding AI outputs, limitations, and intended use?

**Section 3 — Data Governance & Privacy**
11. Are all data sources used for training or operating the AI system documented and legally obtained?
12. Do you restrict secondary use of Teradyne data or AI outputs without written authorization?
13. Are data retention, deletion, and minimization controls formally defined?
14. Is cross-border data transfer involved? (If yes, briefly describe safeguards in place)

**Section 4 — Information Security Controls**
15. Do you maintain an information security management program? (If yes, list certifications — e.g., ISO 27001 — and validity)
16. Are data encryption controls implemented for data at rest and in transit?
17. Are access controls based on least privilege and role-based principles?
18. Do you conduct regular vulnerability assessments and remediation activities?

**Section 5 — AI Model & Technology Risk**
19. Who owns the AI model(s) provided to Teradyne? (Supplier / Teradyne / Shared / Licensed)
20. Do you use third-party or open-source models/components? (If yes, briefly describe vetting and licensing approach)
21. Are model validation, testing, and performance monitoring processes established?
22. Do you monitor for model drift, degradation, or unintended behavior?

**Section 6 — Legal, Contractual & Regulatory Compliance**
23. Do your AI services comply with applicable AI, privacy, and sector regulations?
24. Do contracts include AI-specific clauses covering ethics, IP, data protection, audit rights, and termination?
25. Are you willing to support Teradyne audits or assurance requests related to AI governance?

**Section 7 — Incident Management & Reporting**
26. Do you have a documented AI incident or breach response process?
27. Are you contractually obligated to notify Teradyne of AI-related incidents or data breaches without undue delay?
28. Do you perform root cause analysis and corrective actions following AI incidents?

**Section 8 — Ongoing Monitoring & Assurance**
29. Will you participate in periodic AI risk reassessments as requested by Teradyne?
30. Can you provide independent audit reports or compliance attestations upon request?
31. Will you cooperate with remediation or improvement actions if gaps are identified?

**Section 9 — Supplier Declaration** (not questions — a closing attestation)
Certification statement: "I certify that the information provided in this AI Supplier Self-Assessment Questionnaire is accurate and complete to the best of my knowledge." Fields: Name / Title / Organization / Signature / Date.

## Handling the special-format questions (keep simple)
Most are plain Yes/No/NA + note. For these, keep the Yes/No/NA + note shape but make the **note** carry the extra detail (don't build new widgets):
- **Q5** (multi-select lifecycle role) and **Q19** (ownership) — keep as a single question; put the selectable options in the question text / note guidance. If `SaqAnswer` already has only response+note, leave it and capture the choice in the note. Do **not** expand the data model unless it's already there.
- **Q6, Q14, Q15, Q20** ("if yes, …") — the conditional detail goes in the note field. No conditional UI needed.
- **Section 9** is a declaration, not scored — render as static attestation text (with the name/title/org/signature/date labels) beneath the questions; it is **not** part of `saqComplete` scoring. If the current stand-in encoded Section 9 as answerable questions, convert it to this static declaration and adjust any count so **31 scored questions** remain.

## Steps
1. Read `src/lib/vendorSaq.ts`; locate the stand-in section/question definitions (likely `emptySaq()` / a `SAQ_SECTIONS` constant).
2. `str_replace` the section titles and question text with the above, preserving ids/keys where the code references them by id (renumber text, keep stable ids if seeds/tests depend on them — **check first**).
3. Reconcile **Section 9**: static declaration, not scored; ensure `saqComplete` still expects 31 scored answers.
4. Update any seed SAQ answers (`prj-074/075/076` + backfills) if they referenced old question ids/text, so they still render coherently.
5. Update any test asserting question text/count.
6. `npm run build` ✅ / `npm run test` ✅. Manually: SupplierOversight SAQ panel shows the real 9 sections / 31 questions; gate still blocks until Pass/Waived; internal-only still exempt.
7. Commit + **push**; confirm deploy. Report to `docs/refactor1/V3-FIX-SAQ_REPORT.md`: what changed, whether ids were preserved, Section 9 handling, seeds/tests touched, deploy confirmation.
