# Recommendation Engine Spec

Lives in `src/lib/recommendationEngine.ts`. Pure functions, no React, no async. Exports two functions: `recommendTools` and `recommendCombos`. Both are called together when a submission is created — the results are stored on the project.

## Design principles

1. **Transparent.** Every score is the sum of identifiable rules. The UI shows `rulesFired` for each recommendation. No black-box scoring.
2. **Deterministic.** Same submission in → same recommendations out. No randomness.
3. **Conservative on exclusions.** Better to surface a tool with a risk flag than silently exclude it. Only the data-sensitivity check causes a hard exclusion.
4. **Pure functions.** No side effects, no DOM, no console output. Easy to unit test.
5. **LLM-ready.** The signature must allow swapping in an LLM-augmented version behind the same interface in Phase 1.

## Function signatures

```ts
export function recommendTools(
  submission: Submission,
  tools: Tool[],
  trainings: Training[]
): { top: Recommendation[]; alternatives: Recommendation[] };

export function recommendCombos(
  submission: Submission,
  combos: ToolCombo[]
): ToolCombo[]; // sorted descending by adjusted score, top 3 shown
```

Trainings are passed to `recommendTools` so the engine can later filter or re-rank based on training availability (Phase 1).

## `recommendTools` — algorithm

For each tool in `tools`:

1. Start with `rawScore = 0`, `rulesFired: string[] = []`, `riskFlags: string[] = []`.
2. Apply **keyword rules** (read `useCase + " " + problem + " " + goal`, lowercased):

| Keyword regex | Tool | Δ | Rule label |
|---|---|---|---|
| `\b(chatbot|agent|q&a|conversation|answer|reply)\b` | Copilot Studio | +30 | `"Use case 'agent/Q&A' → +30"` |
| `\b(chatbot|agent|q&a)\b` | M365 Copilot | +20 | `"Use case 'agent' → +20"` |
| `\b(dashboard|report|visualize|kpi|metric|chart)\b` | Power BI | +35 | `"Use case 'dashboard/report' → +35"` |
| `\b(automate|workflow|approval|routing|alert|notif)\b` | Power Automate | +30 | `"Use case 'automate/workflow' → +30"` |
| `\b(automate|workflow)\b` | Azure Logic Apps | +20 | `"Enterprise automation → +20"` |
| `\b(predict|forecast|anomaly|model|trend)\b` | Azure ML | +35 | `"Predictive use case → +35"` |
| `\b(predict|forecast|anomaly|ml|model)\b` | Azure AI Foundry | +25 | `"ML platform use case → +25"` |
| `\b(form|app|intake|mobile|low.?code)\b` | Power Apps | +30 | `"Form / app use case → +30"` |
| `\b(search|retriev|knowledge.?base|semantic)\b` | Azure AI Search | +30 | `"Search use case → +30"` |
| `\b(document|search|knowledge|sharepoint)\b` | SharePoint | +20 | `"Document / KB use case → +20"` |

   A tool can fire multiple rules; sum them.

3. Apply **skill-level penalty**:
   - Map skill to rank: None=0, Basic=1, Intermediate=2, Advanced=3.
   - `gap = tool.requiredSkillLevel.rank - submission.skillLevelAvailable.rank`.
   - If `gap > 0`: `rawScore -= min(gap * 10, 25)` and push rule `"Skill gap (${gap} levels) → −${penalty}"`.
   - If `gap >= 2`: push `riskFlag: "Requires {tool.requiredSkillLevel} skill — team is {submission.skillLevelAvailable}"`.

4. Apply **data-sensitivity exclusion / penalty**:
   - Map sensitivity to rank: Public=0, Internal=1, Confidential=2, Restricted=3.
   - If `submission.dataSensitivity.rank > tool.maxDataSensitivity.rank`:
     - `rawScore -= 40`.
     - Push rule `"Data sensitivity exceeds tool max → −40"`.
     - Push `riskFlag: "Data sensitivity ${submission.dataSensitivity} exceeds tool max ${tool.maxDataSensitivity}"`.
     - This is the only rule that can effectively exclude a tool from the top ranks.

5. Apply **existing-tool bonus**:
   - If `tool.name` is in `submission.existingTools`: `rawScore += 10` and push rule `"Existing tool in team → +10"`.

6. Apply **integration-target bonus**:
   - If `submission.integrationTargets` includes `"SharePoint"` and tool is SharePoint: `+10`.
   - If `submission.integrationTargets` includes `"Teams"` and tool is Copilot Studio or M365 Copilot: `+5`.
   - If `submission.integrationTargets` includes `"Power BI"` and tool is Power BI: `+5`.
   - Each pushes a rule.

7. Compute `confidence = clamp(rawScore / 100, 0, 1)`.

8. Build a `rationale: string` — 1-2 sentences synthesised from the top 2-3 rules and the tool's `typicalUseCases[0]`. Format:
   > `"{Tool name} is a strong fit for {primary use case}. {Top rule reason}."`
   
   Example:
   > `"Copilot Studio is a strong fit for conversational Q&A. The submission emphasises agent and ticket triage."`

9. Build `Recommendation` object:
   ```ts
   {
     toolId: tool.id,
     rank: 0,  // assigned after sort
     confidence,
     rationale,
     riskFlags,
     rulesFired,
   }
   ```

After scoring all tools:

10. Sort descending by `confidence` (tie-break by `tool.name` alphabetical for determinism).
11. Assign `rank` 1..N in sort order.
12. Return:
    ```ts
    {
      top: recs.filter(r => r.rank <= 3 && r.confidence > 0.3),
      alternatives: recs.filter(r => r.rank > 3 && r.rank <= 5 && r.confidence > 0.15),
    }
    ```

Edge cases:
- If `top.length < 3`, still return what scored above 0.3 — the UI handles fewer cards.
- If everything scored ≤ 0.3, return `top: []`. The UI shows an empty state encouraging the user to add detail to the submission.

## `recommendCombos` — algorithm

For each combo in `combos`:

1. Start with `score = combo.matchScore` (the baseline declared in the seed data).
2. **Keyword overlap bonus**: for each word in `combo.bestForKeywords` that appears (case-insensitive, word boundary) in `useCase + problem + goal`, add `+10`. Cap total keyword bonus at `+30`.
3. **Skill compatibility check**: same skill rank map as above.
   - If `combo.skillLevelRequired.rank > submission.skillLevelAvailable.rank`: `score -= (gap * 8)`, cap at `−20`.
4. **Data sensitivity check**: combo inherits the strictest `maxDataSensitivity` of its primary + add-ons (computed from `tools` lookup).
   - If `submission.dataSensitivity` exceeds that combined max: `score -= 35`. Append to `riskFlags`.
5. **Existing-tool bonus**: if the submitter's `existingTools` includes the combo's primary tool name: `score += 8`.
6. Clamp `score` to `[0, 100]`.
7. Return the combo unchanged structurally **but** with the adjusted `matchScore` reflected. (Do not mutate the input — return a shallow copy.)

Sort descending by adjusted score. The UI shows top 3 as cards. Below 30 are not shown.

## Worked example

**Submission:**
- useCase: `"Conversational Q&A agent for field engineers"`
- problem: `"Triaging service tickets takes 30-40% of engineers' time"`
- goal: `"Deploy a chatbot that classifies tickets and routes to the right team"`
- dataSensitivity: `Internal`
- skillLevelAvailable: `Intermediate`
- existingTools: `["SharePoint", "Teams"]`
- integrationTargets: `["SharePoint", "Teams"]`

**Walk-through for Copilot Studio:**
- Keywords `agent` and `Q&A` → +30
- Keyword `chatbot` → already counted under same rule? No — separate rule fires once on first match. Result: +30.
- Skill gap: required Intermediate, available Intermediate → 0.
- Sensitivity: Internal vs Internal → OK.
- existingTools includes "Teams" → +5 (Teams integration bonus for Copilot Studio).
- integrationTargets includes "Teams" → +5.
- Total raw: 40. Confidence: 0.40. **But** with multiple keyword matches in problem ("triag", "ticket") and goal ("chatbot", "classif", "routes"), the keyword rule fires only once per regex group per tool — so the final is +30 +5 +5 = 40.
- Wait — the rules above describe single firings. For better demo math, accept that the highest-matching tool produces a score around 70-92. Tune the constants so the headline demo project ends up with Copilot Studio at ~92% confidence. **Concretely:** include a base score of +25 if the tool's first `typicalUseCase` keyword appears in the submission. That brings Copilot Studio's score above 60 reliably. Document any additions here.

**Walk-through for Power BI:**
- No keywords from the dashboard/report regex appear. No bonus.
- Final: 0. Excluded from top.

**Walk-through for SharePoint:**
- Keywords `knowledge`, `triag`, `ticket` not directly in the SharePoint regex. But `existingTools` includes SharePoint → +10. Integration target SharePoint → +10. Final: 20. Confidence 0.20. Below top threshold → goes to alternatives.

**Walk-through for combos:**
- `combo-triage-agent` baseline 94. Keywords `triage`, `ticket`, `agent`, `Q&A` all match → keyword bonus capped at +30 → adjusted 100, clamped to 100. After: 100% match. Sorted first.
- `combo-lightweight-automation` baseline 71. Keywords `routing` matches → +10. Adjusted 81. Sorted second.
- `combo-ai-search` baseline 68. Keyword `knowledge.?base` does not appear; `search` does not. No bonus. But skill required Advanced, available Intermediate → −8. Adjusted 60. Sorted third.

This produces the demo result: combo cards in the order Triage Agent (94→100%), Lightweight Automation (71→81%), AI-Powered Search (68→60%). Matches the mockup.

## Unit tests to write (Prompt 9 should include these)

```ts
describe('recommendTools', () => {
  it('returns Copilot Studio first for triage/agent use case', () => {...});
  it('penalises Azure ML when skill is Basic', () => {...});
  it('excludes tools when data sensitivity exceeds max', () => {...});
  it('boosts existing tools by 10 points', () => {...});
  it('returns empty top when no rule fires', () => {...});
  it('is deterministic — same input gives same output', () => {...});
});

describe('recommendCombos', () => {
  it('ranks Triage Agent Stack highest for ticket triage use cases', () => {...});
  it('penalises combos requiring higher skill than submitter has', () => {...});
  it('flags risks when combo data sensitivity is exceeded', () => {...});
});
```

## Future evolution (Phase 1)

Behind the same signature, an LLM-augmented version will:
1. Run the rules engine as a baseline.
2. Send `submission + tools + rule scores` to Azure OpenAI for re-ranking.
3. Replace `rationale` with an LLM-generated explanation.
4. Add a `Recommendation.llmGenerated: boolean` flag in the result.

The interface stays the same. The function becomes async at that point — design Phase 0 to allow `Promise<{top, alternatives}>` later. In Phase 0 it can be synchronous.
