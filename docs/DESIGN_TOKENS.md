# Design Tokens — GCS AI Project Portal

These tokens are authoritative. Components never use raw hex values; they map through the Tailwind config below.

## Color palette

### Neutrals (backgrounds & text)

| Token | Hex | Tailwind class | Use |
|---|---|---|---|
| `bg-primary` | `#FFFFFF` | `bg-white` | Cards, dialog bodies, primary surfaces |
| `bg-secondary` | `#F7F6F2` | `bg-stone-50` (approx) | Sidebar footer, hint boxes, subtle panels |
| `bg-tertiary` | `#F1EFE8` | `bg-stone-100` (approx) | Page background, locked-step placeholders |
| `text-primary` | `#1A1918` | `text-stone-900` | Headings, primary body text |
| `text-secondary` | `#5F5E5A` | `text-stone-600` | Subtitles, secondary body |
| `text-tertiary` | `#888780` | `text-stone-500` | Helper text, metadata, muted labels |
| `border` | `#E2E0D8` | `border-stone-200` | Card borders, separators |
| `border-subtle` | `#EEECE6` | `border-stone-100` | Very light dividers |

### Brand accent — Indigo (primary action color)

| Token | Hex | Tailwind class | Use |
|---|---|---|---|
| `indigo` | `#534AB7` | `bg-indigo-600` / `text-indigo-600` | Primary buttons, active nav, primary chips |
| `indigo-light` | `#EEEDFE` | `bg-indigo-50` | Selected state backgrounds, badges |
| `indigo-mid` | `#CECBF6` | `border-indigo-200` | Borders on indigo-tinted surfaces |
| `indigo-dark` | `#3C3489` | `text-indigo-900` | Text on indigo-light backgrounds |

Use indigo sparingly. It is the one accent that says "this is the brand." Everything else should be quiet.

### Semantic colors

| Purpose | Token | Hex | Use |
|---|---|---|---|
| Success / Completed | `green` | `#1D9E75` | Completed stages, validated, add-on chips |
| Success light | `green-light` | `#F0FBF6` | Add-on chip backgrounds |
| Success border | `green-border` | `#A8DFC8` | Add-on chip borders |
| Success text | `green-text` | `#0F6E56` | Text on green-light |
| Warning / In Progress | `amber-dark` | `#EF9F27` | Active stage circle |
| Warning bg | `amber-light` | `#FBEDD8` | Active stage background, warning callouts |
| Warning text | `amber-text` | `#BA7517` | Text on amber backgrounds |
| Danger / Blocked / High risk | `red` | `#A32D2D` | Blocked stages, critical risks |
| Danger light | `red-light` | `#FCEBEB` | Risk-flag backgrounds |
| Skill-gap orange | `orange` | `#B85C1A` | Skill gap warnings in stack dialog |
| Skill-gap light | `orange-light` | `#FEF3EC` | Skill gap card backgrounds |
| Skill-gap border | `orange-border` | `#F9C89B` | Skill gap borders |
| Demo banner bg | `warning-bg` | `#FAEEDA` | Top demo banner only |
| Demo banner text | `warning-text` | `#633806` | Text on demo banner |

### Role palette (RoleBadge component)

Pair every role with a consistent badge background + text color:

| Role | Background | Text |
|---|---|---|
| GovernanceLead | `#EEEDFE` (indigo-light) | `#3C3489` |
| RiskCompliance | `#FCEBEB` (red-light) | `#A32D2D` |
| DataEngineering | `#E6F1FB` | `#185FA5` |
| BusinessAnalyst | `#F4E8F3` | `#6B4181` |
| AIProgramManager | `#FBEDD8` (amber-light) | `#BA7517` |
| MaintenanceSustainability | `#D5EBE0` | `#0F6E56` |
| Submitter | `#F1EFE8` (bg-tertiary) | `#5F5E5A` |
| Sponsor | `#EAF3DE` | `#3B6D11` |
| Admin | `#F1EFE8` | `#1A1918` |

### Group palette (GroupBadge component)

| Group | Color | Use |
|---|---|---|
| Engineering | `#534AB7` (indigo) | Dashboard charts, group badge |
| PROGs | `#1D9E75` (green) | Dashboard charts, group badge |
| Field | `#6B8FBF` (blue-gray) | Dashboard charts, group badge |
| Marketing | `#D4537E` (pink) | Dashboard charts, group badge |

### Site palette (location adoption chart)

| Site | Color |
|---|---|
| Japan | `#C53030` |
| Korea | `#2B6CB0` |
| Costa Rica | `#1D9E75` |
| Cebu | `#B58A2D` |

### Ranking medals (Top Contributors)

| Rank | Color |
|---|---|
| 1 (gold) | `#BA7517` |
| 2 (silver) | `#888780` |
| 3 (bronze) | `#B07D4A` |
| 4+ | `text-tertiary` |

## Typography

Use system font stack — no custom font files in Phase 0. The stack reads as Inter on macOS, Segoe UI on Windows, Roboto on Android.

```css
font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
```

### Type scale

| Use | Size | Weight | Tailwind |
|---|---|---|---|
| Page title (H1) | 18px | 500 | `text-lg font-medium` |
| Section title (H2) | 14px | 500 | `text-sm font-medium` |
| Card title | 12px | 500 | `text-xs font-medium` |
| Body | 12px | 400 | `text-xs` |
| Helper / muted | 11px | 400 | `text-[11px]` |
| Caption / metadata | 10px | 400 | `text-[10px]` |
| Eyebrow / label uppercase | 10px | 600 | `text-[10px] font-semibold uppercase tracking-wider` |
| KPI big number | 22px | 500 | `text-[22px] font-medium` |

Body text is intentionally small. The portal is a power-user tool — density matters more than reading comfort.

### Line height

- Body text: 1.5 (`leading-normal`).
- Tight blocks (badges, table cells): 1.3 (`leading-snug`).

## Spacing

Tailwind spacing scale applies. Common values:

| Token | px | Use |
|---|---|---|
| `gap-1` | 4px | Inline icon-to-text |
| `gap-2` | 8px | Form fields, small chips |
| `gap-3` | 12px | Card-to-card in grids |
| `gap-4` | 16px | Section-to-section inside a page |
| `p-3` | 12px | Card padding (compact) |
| `p-4` | 16px | Card padding (standard) |
| `p-5` | 20px | Page container padding |
| `space-y-5` | 20px | Major section spacing on a page |

## Border radii

| Token | px | Use |
|---|---|---|
| `rounded-sm` | 4px | Badges |
| `rounded` | 6px | Buttons, inputs, small cards |
| `rounded-lg` | 10px | Large cards, dialog corners |
| `rounded-full` | full | Avatars, status dots |

## Borders

Use 0.5px tertiary borders everywhere by default. Promote to 1.5px or 2px only when the element is **actively selected** or **active in a flow**.

- Default card: `border-[0.5px] border-stone-200`.
- Selected card: `border-2 border-indigo-600`.
- Active step in stepper: `border-[2.5px] border-amber-500`.

## Shadows

Use sparingly. Default is no shadow.

- Card hover: `shadow-sm` (`0 1px 2px rgba(0,0,0,0.05)`).
- Active recommendation card: `shadow-md` (`0 2px 8px rgba(83,74,183,0.10)`).
- Dialog: `shadow-2xl`.

## Iconography

Use `lucide-react` for icons. Icon sizes:

| Use | Size |
|---|---|
| Nav item | 16px |
| Button inline | 14px |
| Inline body text | 12–13px |
| Section header | 16px |
| KPI card | 14px |
| Avatar fallback | n/a (text initials) |

Icons inside cards use `text-stone-500` by default; switch to a color only when paired with a colored badge.

## Component patterns

### Card

```tsx
<div className="bg-white border-[0.5px] border-stone-200 rounded-lg p-4">
  ...
</div>
```

### Primary button

```tsx
<Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3.5 gap-1.5">
  ...
</Button>
```

### Ghost button

```tsx
<Button variant="ghost" className="border-[0.5px] border-stone-200 text-stone-600 text-xs h-8 px-3 gap-1">
  ...
</Button>
```

### Badge

```tsx
<span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-indigo-50 text-indigo-900">
  ...
</span>
```

### Primary tool chip

```tsx
<span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-sm bg-indigo-600 text-white">
  <Icon size={11} /> {tool.name}
</span>
```

### Add-on tool chip

```tsx
<span className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-sm bg-green-50 text-green-800 border-[0.5px] border-green-200">
  {tool.name}
</span>
```

## Tailwind config

Add to `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      brand: {
        indigo: '#534AB7',
        'indigo-light': '#EEEDFE',
        'indigo-mid': '#CECBF6',
        'indigo-dark': '#3C3489',
        green: '#1D9E75',
        'green-light': '#F0FBF6',
        'green-border': '#A8DFC8',
        'green-text': '#0F6E56',
        amber: '#EF9F27',
        'amber-light': '#FBEDD8',
        'amber-text': '#BA7517',
        red: '#A32D2D',
        'red-light': '#FCEBEB',
        orange: '#B85C1A',
        'orange-light': '#FEF3EC',
        'orange-border': '#F9C89B',
        warning: '#FAEEDA',
        'warning-text': '#633806',
      },
    },
  },
}
```

Component code uses `bg-brand-indigo`, `text-brand-green-text`, etc.
