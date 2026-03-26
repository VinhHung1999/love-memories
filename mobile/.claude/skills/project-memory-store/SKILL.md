---
name: Project Memory Store
description: Update project memory files in .claude/memory/ after completing meaningful work. Use when the Stop hook reminds you, or when user says "--project-store". Skip for trivial changes.
---

# Project Memory Store

**Purpose**: Update memory files in `.claude/memory/` when meaningful changes happen in the project.

## Memory Files

| File | Content | When to update |
|------|---------|----------------|
| `.claude/memory/bugs-and-lessons/README.md` | RN crashes, gotchas, non-obvious fixes | Bug fixed or surprising behavior discovered |
| `.claude/memory/design-decisions/README.md` | UI/UX decisions, color choices, component patterns | Design or theme changed, new component pattern established |
| `.claude/memory/architecture/README.md` | Navigation structure, module boundaries, key patterns | New module added, architectural pattern changed |

## Workflow

1. Review what was done in the session
2. Decide which file(s) need updating (may be 0 if trivial)
3. Read the target file first (avoid duplicates)
4. Append/edit new content
5. If major architecture change → also update `CLAUDE.md`

## Entry Format

```markdown
### Short title
- What happened
- Lesson / decision made
```

## Examples

**Good entry** (bugs-and-lessons):
```markdown
### BottomSheetTextInput required inside @gorhom/bottom-sheet
- Cause: Plain TextInput doesn't trigger keyboard avoiding inside bottom sheets
- Fix: Use BottomSheetTextInput or Input with bottomSheet prop
```

**Good entry** (design-decisions):
```markdown
### ProfileScreen = design benchmark
- Boss approved ProfileScreen style — all new screens must follow this visual language
- Clean, minimal, no card+shadow overload
```

## Decision Criteria: Store or Skip?

| Scenario | Action |
|----------|--------|
| Fixed a non-obvious RN bug | **Store** in bugs-and-lessons |
| Made a UI/design decision with trade-offs | **Store** in design-decisions |
| Added new screen pattern or navigation structure | **Store** in architecture |
| Fixed a typo, renamed a variable | **Skip** |
| Standard implementation with no surprises | **Skip** |

## Rules

- **Only update when meaningful** — skip for trivial changes
- **Keep it short** — max 3-4 lines per entry
- **No duplicates** — read the file before adding
- **Preserve history** — don't delete old entries, update them
