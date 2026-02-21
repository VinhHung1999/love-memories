---
name: Project Memory Recall
description: Read project memory from .claude/memory/ before starting complex tasks. Use when user says "--project-recall" or when starting work that might benefit from past context. Skip for trivial tasks.
---

# Project Memory Recall

**Purpose**: Read context from `.claude/memory/` to avoid repeating past mistakes and leverage existing knowledge.

## Memory Files

| File | When to read |
|------|-------------|
| `.claude/memory/bugs-and-lessons/README.md` | Debugging, or before modifying areas with past issues |
| `.claude/memory/design-decisions/README.md` | About to change UI/UX, need to know why current design exists |
| `.claude/memory/api-design/README.md` | Designing new endpoints, changing API behavior |
| `.claude/memory/data-model/README.md` | Changing schema, adding models, debugging queries |
| `.claude/memory/architecture/README.md` | Major refactoring, adding new modules, onboarding |

## Decision Criteria: Recall or Skip?

| Task | Action |
|------|--------|
| Implementing a new feature | **Recall** relevant topic (what pattern was used before) |
| Making a significant technical decision | **Recall** decisions (why current choices were made) |
| Fixing a bug in an area that had past bugs | **Recall** bugs-and-lessons |
| Starting a new sprint or planning work | **Recall** sprint-history (what's done, what's next) |
| Fixing a typo | **Skip** |
| Reading a file | **Skip** |
| Simple 1-line change | **Skip** |

## Workflow

1. Identify the upcoming task
2. Pick the relevant memory file(s) — usually just 1-2
3. Read the file
4. Look for:
   - Past decisions that constrain current work
   - Bugs that happened in the same area
   - Patterns/conventions already established
5. Apply context to the task

## Examples

**Before adding a new feature:**
> Read relevant topic README to see how previous features were built
> Read decisions to follow established patterns

**Before fixing a bug:**
> Read bugs-and-lessons — there may be past issues in the same area

**Before making an architecture change:**
> Read decisions — understand why the current architecture was chosen

## Rules

- **Only read relevant files** — don't read all files for every task
- **Skip for simple tasks** — fixing a typo doesn't need recall
- **CLAUDE.md is always preloaded** — no need to read it again
- **Trust but verify** — memory entries may be outdated if code changed since they were written
