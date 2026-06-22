# GCS AI Project Portal — Cursor Prompt 11

> **Context:** This prompt is part of a sequence. See the Mockup Reference Guide below before starting.

---

## Mockup Reference Guide

Keep the mockup file (`MOCKUP-GCS-AI-Portal.html`) open in your browser while running this prompt. The table below maps mockup tab names to prompts:

| Mockup Tab Name | Used in Prompt |
|---|---|
| MOCKUP-LOGIN | Prompt 4 |
| MOCKUP-DASHBOARD | Prompt 6 |
| MOCKUP-SUBMISSION-WIZARD | Prompt 8 |
| MOCKUP-RECOMMENDATIONS | Prompt 9 |
| MOCKUP-CUSTOMISE-STACK | Prompt 9 |
| MOCKUP-PROJECT-DETAIL | Prompt 10 |
| MOCKUP-TRAINING-CATALOG | Prompt 11 |

---

## Prompt 11 — Training Catalog Page

```
Continue building the GCS AI Project Portal demo.

Build the Training Catalog. Browsable by all roles.

**Reference: MOCKUP-TRAINING-CATALOG.** Match the "Recommended for you" strip, filter bar, 3-column grid, and the "Coming soon" card state.

`src/pages/TrainingCatalogPage.tsx`:

1. **PageHeader row**:
   - Title "Training Catalog", subtitle "Curated learning paths for GCS AI tools and skills — N trainings available" (N = count of `availability === 'Available'`).
   - Right side: refresh icon + "Last updated {date}" muted text.

2. **Recommended for you strip** (only shows if current user has at least one project where they are submitter or sponsor):
   - Section header: sparkles icon (amber) + "Recommended for you" + subtitle "— based on your active projects".
   - Horizontally scrollable row of training cards (each 200px wide, flex-shrink-0, gap 10px).
   - Cards for trainings linked to tools in the user's project tool stacks get a 2px indigo border AND a "For your project" badge at the top-right (indigo bg, white text, small radius bottom).
   - Filler cards (if fewer than 4 strongly-matched) get a normal 0.5px border and a ghost "Open" button instead of primary indigo.
   - Each strip card is compact: format badge top-left, duration top-right, title (2-line clamp), provider + skill level, tool chips, "Open" button at the bottom.

3. **Filter bar** (flex-wrap row):
   - Search input (flex-1, min-width 180px) with search icon and placeholder "Search trainings…"
   - Tool dropdown ("All tools" by default)
   - Format dropdown ("All formats" by default)
   - Skill level: when a value is selected, render it as an indigo-bordered chip with × to clear (e.g. "Intermediate ×"). Otherwise show "All skill levels" dropdown.
   - "More filters" ghost button (filter icon).
   - Right side (margin-left auto): "Showing N of M" muted count.

4. **Section label**: "All Trainings" — 11px, weight 600, uppercase, letter-spacing 0.05em, color tertiary.

5. **3-column training grid** (gap 12px). Each card:
   - White bg, 0.5px tertiary border, radius large, padding 14px, flex-column.
   - Top row: format badge (color-coded — Self-paced `#EEEDFE`/`#3C3489`, Video `#FCEBEB`/`#A32D2D` or `#FEF3D0`/`#BA7517` for variation, Workshop `#F4E8F3`/`#6B4181`, Instructor-led `#F4E8F3`/`#6B4181`) + duration & skill level (right-aligned, 10px tertiary).
   - Title (12px, weight 600, 2-line clamp).
   - Provider (10px tertiary).
   - Description (11px secondary, 3-line clamp, flex-1 so cards stretch equally).
   - Tool tags (small chips, color-coded by tool category — match the seedTools palette).
   - "Open training" button at the bottom: full-width, indigo bg, white text, with ExternalLink icon. Opens `url` in new tab (`target="_blank" rel="noopener noreferrer"`).

6. **"Coming soon" card state** for trainings where `availability === 'ComingSoon'`:
   - Dashed border instead of solid `border: 0.5px dashed var(--color-border-tertiary)`.
   - `bg-secondary` background, opacity 0.7.
   - Title in tertiary color.
   - All text in muted/tertiary tones.
   - Format badge has a tertiary border instead of color fill.
   - Action button replaced with: ghost-style button with clock icon + `availableFromLabel` text (e.g. "Coming Q3 2026"), cursor-not-allowed.

7. **Pagination** at the bottom (only shown if more than ~9 trainings after filters):
   - "← Prev" ghost button (disabled on first page).
   - 28×28 page number buttons (current page = solid indigo, others = ghost). Use "…" for gaps.
   - "Next →" ghost button.

The catalog is read-only here — adding/editing trainings happens in the Admin page (Prompt 12).
```

---
