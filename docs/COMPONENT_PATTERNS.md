# Component Patterns

Reusable patterns to keep visual consistency across pages. When you find yourself building a similar UI a second time, check here first.

## ToolStackChips — the most reused component

A horizontal row of chips representing a project's tool stack. One primary (filled indigo) + N add-ons (green outline) separated by `+` markers.

```tsx
type Props = {
  toolStack: ToolStackEntry[];
  tools: Tool[];           // for name + iconHint lookup
  size?: 'sm' | 'md';
  showLabels?: boolean;    // show usageNote next to add-on chip
};

<ToolStackChips toolStack={project.toolStack} tools={tools} />
```

Renders to:

```
[● Copilot Studio]  +  [SharePoint]  +  [Power Automate]
   indigo filled        green outline       green outline
```

Reused in:
- Project header card (`MOCKUP-PROJECT-DETAIL`)
- Selected Stack Summary bar (`MOCKUP-RECOMMENDATIONS`)
- Customise Stack dialog's stack summary panel (`MOCKUP-CUSTOMISE-STACK`)
- Projects list table (compact mode, e.g. "Copilot Studio +2")

## Card

Default card pattern used everywhere except dialogs:

```tsx
<div className="bg-white border-[0.5px] border-stone-200 rounded-lg p-4">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-xs font-medium">Card title</h3>
    <span className="text-[10px] text-stone-500">Right-side meta</span>
  </div>
  {/* body */}
</div>
```

For wider padding use `p-5` instead of `p-4`. Section header always has the title left, meta right, separated by `justify-between`.

## Stepper (used in submission wizard and project detail)

Three states per step circle:
- **Completed**: solid indigo circle (`bg-brand-indigo text-white`) with `<Check size={13} />`.
- **Active**: light indigo bg, 2px indigo border, slightly larger (32px vs 28px), with a soft outer glow (box-shadow indigo at 12% opacity, 4px spread).
- **Locked / Not Started**: light gray bg, 1.5px gray border, gray number text.

For the Project Detail lifecycle stepper specifically, the active state uses **amber** because it represents "In Progress" not "current form step". Same shape, different palette:
- Amber-light bg, 2.5px amber-dark border, amber Play icon, amber outer glow.

Connectors between steps:
- Behind the active = indigo (or green if completed).
- Ahead of the active = gray `border-stone-200`.

## Stat callout strip (dashboard row 1)

A colored strip drawing attention to a pending action. Always rendered when a role has work waiting for them.

```tsx
<div className={cn(
  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-md mb-3.5",
  variant === 'indigo' && "bg-brand-indigo-light border-[0.5px] border-brand-indigo-mid text-indigo-900",
  variant === 'green' && "bg-[#EAF3DE] border-[0.5px] border-[#B8D99A] text-[#2E5219]",
  variant === 'red' && "bg-brand-red-light border-[0.5px] border-red-200 text-brand-red",
)}>
  <Icon size={16} />
  <span className="text-xs"><strong>Pending:</strong> {count} projects awaiting your review</span>
  <span className="ml-auto text-[11px] cursor-pointer">Review →</span>
</div>
```

## Status badge

A small colored pill for status / role / category. Always paired with text — never use color alone.

```tsx
<span className={cn(
  "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-sm",
  variantClasses
)}>
  {label}
</span>
```

Variant mapping:
- `Completed` / `Qualified` → green
- `InProgress` → amber
- `Submitted` / `Draft` / `NotStarted` → gray
- `Blocked` / `Rejected` → red
- `OnHold` → orange
- `Decommissioned` → stone

Always uppercase the label in the span ("IN PROGRESS", "COMPLETED").

## RoleBadge / GroupBadge

Colored pills specifically for roles and groups. Color mapping comes from `DESIGN_TOKENS.md`. Always include role/group humanized name (no acronyms in display).

```tsx
<RoleBadge role="GovernanceLead" />  // → "Governance Lead" in indigo-light
<GroupBadge group="PROGs" />          // → "PROGs" in green
```

## Avatar

Circular avatar with initials background-colored to match the user's role.

```tsx
<Avatar size={28} user={user} />
// renders a 28x28 circle, role-tinted background, two-letter initials (first letter of first + last name)
```

Sizes used: 20px (in activity rows), 22px (in compact lists), 24px (in contributor list), 28px (in topbar), 32px (in detail headers if needed).

## Tooltip with disabled buttons

Whenever you disable a button due to role gating, wrap in a Tooltip explaining why:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span tabIndex={0}>
      <Button disabled className="...">Mark Complete</Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>Only {humanizeRole(stage.primaryOwnerRole)} or supporting roles can act on this stage.</TooltipContent>
</Tooltip>
```

The `<span tabIndex={0}>` is required because disabled buttons don't fire pointer events.

## Confirmation Dialog

Use the shadcn `Dialog` component for confirmations. Never use `window.confirm`. Standard shape:

```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete this tool?</DialogTitle>
      <DialogDescription>This removes "{tool.name}" from the catalog. Projects that reference it will keep the reference. This action cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost" onClick={close}>Cancel</Button>
      <Button variant="destructive" onClick={confirm}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Wrap as `<ConfirmDialog title, body, confirmLabel, onConfirm />` in `components/dialogs/`.

## Form field

```tsx
<div className="space-y-1.5">
  <Label htmlFor={id} className="text-[11px] font-medium">
    {label} {required && <span className="text-brand-red">*</span>}
  </Label>
  <Input id={id} value={value} onChange={e => setValue(e.target.value)} className="text-xs" />
  {error && <p className="text-[10px] text-brand-red">{error}</p>}
  {help && <p className="text-[10px] text-stone-500">{help}</p>}
</div>
```

Required asterisks are red, hints are tertiary gray.

## Empty state

```tsx
<EmptyState
  icon={<FolderOpen size={32} className="text-stone-400" />}
  title="No projects match your filters"
  description="Try clearing some filters or use the search box."
  action={<Button onClick={clearFilters}>Clear filters</Button>}
/>
```

Always centered, always offers a clear next action. Empty states are an invitation, not a dead end.

## Section header inside a tab

Used inside Project Detail tabs:

```tsx
<div className="text-xs font-medium mb-2.5 flex items-center gap-1.5 cursor-pointer">
  <ChevronDown size={13} className="text-brand-indigo" />
  Section name
  {meta && <span className="text-[10px] text-stone-500 font-normal ml-1">{meta}</span>}
</div>
```

Chevron rotates to right (`ChevronRight`) when collapsed; color goes from indigo to tertiary.

## Activity row (audit log items)

```tsx
<div className="flex gap-2.5 py-1.5 border-b border-stone-100 last:border-b-0">
  <Avatar size={22} user={transition.actor} />
  <div className="flex-1 min-w-0">
    <p className="text-[11px]">
      <strong>{transition.actor.firstName}.</strong> {actionLabel(transition)}{' '}
      <span className="text-blue-700">{project.title}</span>
    </p>
    <p className="text-[10px] text-stone-500 mt-0.5">
      {formatRelative(transition.timestamp)} · {transition.actor.group}
    </p>
  </div>
</div>
```

Sub-label is always `time · group`, never `time · role`.

## Tab bar (inner, project detail)

```tsx
<div className="flex border-b border-stone-200 bg-stone-50">
  {tabs.map(t => (
    <button
      key={t.id}
      onClick={() => setActive(t.id)}
      className={cn(
        "px-4 py-2.5 text-xs transition-colors border-b-2 border-transparent",
        active === t.id
          ? "bg-white text-brand-indigo border-brand-indigo font-medium"
          : "text-stone-600 hover:text-stone-900"
      )}
    >
      {t.label}
      {t.badge && <span className="ml-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-indigo-light text-indigo-900">{t.badge}</span>}
    </button>
  ))}
</div>
```

## Progress bar

```tsx
<div className="h-1 bg-stone-100 rounded-full overflow-hidden">
  <div
    className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-indigo"
    style={{ width: `${pct}%` }}
  />
</div>
```

For solid-color bars (like KPI sparklines), drop the gradient.

## Page-level skeleton (responsive)

Pages must work down to 768px. Below that:
- Sidebar collapses into a Sheet opened from the topbar.
- Multi-column grids collapse to single column.
- Filter bars wrap.
- Tab bars stay horizontal but scroll.

The mockups show desktop only. Use these defaults for mobile fallback — do not invent new layouts.

## When to use shadcn vs custom

- Forms, dialogs, dropdowns, tooltips, toasts, tabs, select, checkbox, table → shadcn/ui.
- Charts → recharts.
- Anything else (avatars, badges with custom palettes, tool stack chips, role badges, group badges, stepper, activity rows) → build custom in `components/common/`. shadcn is foundation; identity comes from custom common components.
