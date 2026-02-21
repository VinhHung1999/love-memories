---
name: Project Memory Store
description: Update project memory files in .claude/memory/ after completing meaningful work. Use when the Stop hook reminds you, or when user says "--project-store". Skip for trivial changes.
---

# Project Memory Store

**Purpose**: Update memory files in `.claude/memory/` when meaningful changes happen in the project.

## Memory Files

| File | Content | When to update |
|------|---------|----------------|
| `.claude/memory/bugs-and-lessons/README.md` | Bugs encountered and lessons learned | Bug fixed or gotcha discovered |
| `.claude/memory/design-decisions/README.md` | UI/UX decisions, color palette, animation philosophy | Design or theme changes |
| `.claude/memory/api-design/README.md` | API endpoints, auth patterns, error handling | New API endpoint or pattern established |
| `.claude/memory/data-model/README.md` | Database schema, ORM patterns, migrations | Schema changed or migration created |
| `.claude/memory/architecture/README.md` | System structure, module boundaries, key patterns | Architecture decision made or module added |

## Workflow

1. Review what was done in the session
2. Decide which file(s) need updating (may be 0 if trivial)
3. Read the target file first (avoid duplicates)
4. Append/edit new content
5. If major architecture change -> also update `CLAUDE.md`

## Entry Format

```markdown
### Short title
- What happened
- Lesson / decision made
```

## Examples

**Good entry** (bugs-and-lessons.md):
```markdown
### API timeout on large queries
- Cause: No pagination on /api/items endpoint
- Fix: Added cursor-based pagination, default limit 50
```

**Good entry** (decisions.md):
```markdown
### Chose PostgreSQL over MongoDB
- Need: Complex queries with joins across 5+ tables
- Decision: PostgreSQL with Prisma ORM
- Trade-off: Less flexible schema, but better query performance
```

**Bad entry** (too vague):
```markdown
### Fixed a bug
- It works now
```

**Bad entry** (too verbose — keep it to 2-3 lines):
```markdown
### Sprint 8: Database migration
- First I researched 5 different migration tools...
- Then I tried Flyway but it didn't work because...
- (nobody will read all this)
```

## Decision Criteria: Store or Skip?

| Scenario | Action |
|----------|--------|
| Completed a new feature/sprint | **Store** in relevant topic |
| Fixed a non-obvious bug | **Store** in bugs-and-lessons |
| Made a design/architecture decision with trade-offs | **Store** in decisions or relevant topic |
| Fixed a typo, renamed a variable | **Skip** |
| Added a console.log for debugging | **Skip** |
| Standard implementation with no surprises | **Skip** |

## Handling Conflicts

When new info contradicts an existing entry:

1. **Don't delete the old entry** — it shows decision evolution
2. **Update inline** with a note:
   ```markdown
   ### Database: PostgreSQL with Prisma
   - Originally chose raw SQL queries
   - **Updated:** Switched to Prisma ORM for type safety
   - Reason: Too many runtime SQL errors in production
   ```
3. If the old info is completely wrong/obsolete -> replace it, but add context why

## CLAUDE.md vs Memory Files

| Change type | Update where |
|-------------|-------------|
| New script, new dependency, new command | `CLAUDE.md` |
| New folder convention, path alias | `CLAUDE.md` |
| New component/module pattern, architecture shift | `CLAUDE.md` |
| Sprint work summary, bug details, design rationale | Memory files only |

**Rule of thumb**: CLAUDE.md = what you need to START working. Memory = deeper context you read WHEN needed.

## Rules

- **Only update when meaningful** — skip for trivial changes
- **Keep it short** — max 3-4 lines per entry
- **No duplicates** — read the file before adding
- **Preserve history** — don't delete old entries, update them
