# Setup Guide — Where to Put Each File Before Running Prompt 01

This guide tells you exactly how to organise the files on disk before opening Cursor.

## Step 1 — Create the project folder

On your Windows Server 2022 VM, create an empty folder somewhere convenient:

```
C:\Projects\gcs-ai-portal\
```

This is your **project root**. Cursor will open this folder. PROMPT-01 will scaffold the Vite project inside it.

## Step 2 — Drop the context files into the project root

Before running PROMPT-01, the project root should look like this:

```
C:\Projects\gcs-ai-portal\
│
├── .cursorrules                              ← Cursor auto-loads this on every chat
├── README.md                                 ← Dev-facing readme
├── PROMPT-00_Kickoff.md                      ← The first prompt you'll paste
│
├── docs/
│   ├── PROJECT_BRIEF.md
│   ├── DESIGN_TOKENS.md
│   ├── DATA_MODEL.md
│   ├── SEED_DATA_REFERENCE.md
│   ├── RECOMMENDATION_ENGINE_SPEC.md
│   ├── ROLE_LIFECYCLE_RACI.md
│   ├── COMPONENT_PATTERNS.md
│   ├── COPY_GUIDELINES.md
│   └── DEMO_DATA_SCENARIOS.md
│
├── mockups/
│   └── MOCKUP-GCS-AI-Portal.html            ← The 7-tab interactive mockup
│
└── prompts/                                  ← Your 13 prompt files (run in order)
    ├── PROMPT-01_Project_Setup_and_Folder_Structure.md
    ├── PROMPT-02_Type_Definitions_and_Seed_Data.md
    ├── PROMPT-03_Zustand_Stores_with_localStorage.md
    ├── PROMPT-04_Mock_Authentication_Role_Selector.md
    ├── PROMPT-05_App_Shell_Sidebar_Topbar_DemoBanner.md
    ├── PROMPT-06_Dashboard_Page_with_Charts.md
    ├── PROMPT-07_Lifecycle_Module_and_Role_Gating.md
    ├── PROMPT-08_Submission_Form_4Step_Wizard.md
    ├── PROMPT-09_Recommendation_Engine_Results_CustomiseStack.md
    ├── PROMPT-10_Projects_List_and_Project_Detail.md
    ├── PROMPT-11_Training_Catalog_Page.md
    ├── PROMPT-12_Admin_Page_Catalog_Management.md
    └── PROMPT-13_Polish_README_Demo_Walkthrough.md
```

## Step 3 — After PROMPT-01 runs

PROMPT-01 scaffolds the Vite project **into the same folder**. The structure becomes:

```
C:\Projects\gcs-ai-portal\
│
├── .cursorrules                              ← still here, auto-loaded
├── README.md                                 ← Cursor may overwrite — that's fine, ours is better; we'll restore
├── PROMPT-00_Kickoff.md
├── docs/                                     ← still here
├── mockups/                                  ← still here
├── prompts/                                  ← still here
│
├── .gitignore                                ← created by Vite
├── package.json                              ← created by Vite
├── package-lock.json                         ← created by npm install
├── tsconfig.json                             ← created by Vite
├── tsconfig.node.json                        ← created by Vite
├── vite.config.ts                            ← created by Vite
├── tailwind.config.ts                        ← created during shadcn init
├── postcss.config.js                         ← created during shadcn init
├── components.json                           ← shadcn/ui config
├── index.html                                ← Vite entry
├── public/                                   ← Vite static assets
├── node_modules/                             ← npm
│
└── src/                                      ← the actual app
    ├── components/
    ├── pages/
    ├── stores/
    ├── data/
    ├── lib/
    ├── types/
    ├── routes/
    ├── App.tsx
    ├── main.tsx
    └── index.css
```

**Important**: if PROMPT-01 generates a README.md, it will likely overwrite the one you placed. After PROMPT-01, restore the documentation README.md from `cursor-context/README.md` so the docs stay aligned with what you wrote. Alternatively, run PROMPT-01 first then drop in the docs after — the order doesn't strictly matter, but doing it before is cleaner because `.cursorrules` is then loaded into Cursor's context from the very first prompt.

## Step 4 — Cursor settings

In Cursor, open the project folder (`File → Open Folder` → `C:\Projects\gcs-ai-portal`).

Verify:

1. `.cursorrules` shows in the file tree at the project root.
2. The `docs/`, `mockups/`, and `prompts/` folders are all visible.
3. The Cursor status bar shows the project is loaded.

## Step 5 — Run the kickoff

Open a new Cursor chat. **Attach these files** before sending your message:

- `docs/PROJECT_BRIEF.md`
- `docs/DATA_MODEL.md`
- `docs/ROLE_LIFECYCLE_RACI.md`
- `mockups/MOCKUP-GCS-AI-Portal.html`

Then **paste the content of `PROMPT-00_Kickoff.md`** as your first message.

Cursor will:
1. Acknowledge the .cursorrules content.
2. Read the attached docs.
3. Reply with the 8-bullet summary.
4. Ask one clarifying question.

## Step 6 — Run the 13 prompts in order

For each prompt, open a fresh Cursor chat (or continue the same one if it stays focused — fresh is more reliable). Attach these files each time:

**Always attach**:
- `mockups/MOCKUP-GCS-AI-Portal.html`
- `docs/DESIGN_TOKENS.md`

**Attach for relevant prompts**:

| Prompt | Also attach |
|---|---|
| 01 — Project Setup | (no extras) |
| 02 — Types and Seed Data | `docs/DATA_MODEL.md`, `docs/SEED_DATA_REFERENCE.md` |
| 03 — Zustand Stores | `docs/DATA_MODEL.md` |
| 04 — Mock Auth | `docs/COPY_GUIDELINES.md` |
| 05 — App Shell | `docs/COMPONENT_PATTERNS.md` |
| 06 — Dashboard | `docs/SEED_DATA_REFERENCE.md`, `docs/COMPONENT_PATTERNS.md`, `docs/DEMO_DATA_SCENARIOS.md` |
| 07 — Lifecycle Module | `docs/ROLE_LIFECYCLE_RACI.md` |
| 08 — Submission Wizard | `docs/COPY_GUIDELINES.md`, `docs/COMPONENT_PATTERNS.md` |
| 09 — Recommendation Engine | `docs/RECOMMENDATION_ENGINE_SPEC.md`, `docs/SEED_DATA_REFERENCE.md`, `docs/COMPONENT_PATTERNS.md` |
| 10 — Project Detail | `docs/ROLE_LIFECYCLE_RACI.md`, `docs/COMPONENT_PATTERNS.md` |
| 11 — Training Catalog | `docs/SEED_DATA_REFERENCE.md` |
| 12 — Admin Page | `docs/SEED_DATA_REFERENCE.md`, `docs/DEMO_DATA_SCENARIOS.md` |
| 13 — Polish & README | `docs/DEMO_DATA_SCENARIOS.md`, `README.md` |

Then paste the prompt content as the message.

## Step 7 — After each prompt

1. Let Cursor finish generating.
2. Run `npm run build` in the terminal. Fix TypeScript errors if any.
3. Run `npm run dev`. Click through the affected pages.
4. If something looks off vs the mockup, open the relevant mockup tab in Chrome side-by-side and ask Cursor: *"Compare what you generated to the [MOCKUP-NAME] tab in mockups/MOCKUP-GCS-AI-Portal.html and fix the differences."*
5. Commit (optional but recommended) with a message like `"Prompt 06 — Dashboard with 6 charts and recent activity"`.
6. Move to the next prompt.

## Tips

- **Don't skip the kickoff**. The 8-bullet summary catches misalignments early.
- **Keep the mockup file attached every time**. Cursor's adherence to the visual reference drops sharply without it.
- **If Cursor invents something not in the docs**, push back: *"Did you check `docs/DATA_MODEL.md`? It defines the field already."*
- **Use the `.cursorrules` as a ceiling, not a floor**. If Cursor produces something that violates a rule, the rule wins.
- **Demo checkpoints**: After Prompts 6, 9, and 11, the demo should be progressively usable. Stop and click through after each.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Cursor uses wrong colors | Forgot to attach `DESIGN_TOKENS.md` | Attach and re-run |
| Cursor invents user names | Forgot to attach `SEED_DATA_REFERENCE.md` | Attach and ask to use canonical names |
| Cursor adds an unsupported dependency | `.cursorrules` not auto-loaded | Restart Cursor; check `.cursorrules` is at project root, not in a subfolder |
| Cursor's UI doesn't match the mockup | Mockup file not attached, or attached but Cursor ignored it | Attach + explicitly say "use the [MOCKUP-NAME] tab as visual reference; translate the inline styles to Tailwind" |
| `npm run build` fails with type errors | Missing type imports | Tell Cursor to add the missing import; usually a one-line fix |
| `npm run dev` runs but page is blank | Routing or store hydration error | Open browser devtools; the error is usually clear; paste it to Cursor |

---

You're ready. Open Cursor, open the project folder, attach the kickoff files, paste `PROMPT-00_Kickoff.md`, and go.
