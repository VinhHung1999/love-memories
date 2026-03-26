---
name: Project Memory Recall
description: Read project memory from .claude/memory/ before starting complex tasks. Use when user says "--project-recall" or when starting work that might benefit from past context. Skip for trivial tasks.
---

# Project Memory Recall

**Purpose**: Read context from `.claude/memory/` to avoid repeating past mistakes and leverage existing knowledge.

## Memory Files

| File | When to read |
|------|-------------|
| `.claude/memory/bugs-and-lessons/README.md` | Debugging, or before modifying areas with past RN-specific issues |
| `.claude/memory/design-decisions/README.md` | About to change UI/UX, adding new screens, need to know why current design exists |
| `.claude/memory/architecture/README.md` | Major refactoring, adding new modules, changing navigation structure |

## Decision Criteria: Recall or Skip?

| Task | Action |
|------|--------|
| Building a new screen | **Recall** design-decisions + architecture |
| Fixing a crash or RN bug | **Recall** bugs-and-lessons |
| Changing navigation structure | **Recall** architecture |
| Changing theme or colors | **Recall** design-decisions |
| Fixing a typo | **Skip** |
| Simple 1-line change | **Skip** |

## Workflow

1. Identify the upcoming task
2. Pick the relevant memory file(s) — usually just 1-2
3. Read the file
4. Look for:
   - Past bugs in the same area
   - Design patterns already established
   - Architectural constraints
5. Apply context to the task

## Rules

- **Only read relevant files** — don't read all files for every task
- **Skip for simple tasks**
- **CLAUDE.md is always preloaded** — no need to read it again
- **Trust but verify** — memory entries may be outdated if code changed since they were written
