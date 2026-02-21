# Love Scrum - 2-Person Team (PO + DEV)

<context>
A lightweight 2-agent team for the Love Scrum project.
PO coordinates and manages product, DEV implements all code (backend + frontend).
</context>

**Terminology:** "Role" and "agent" are used interchangeably. Each role (PO, DEV) is a Claude Code AI agent instance.

---

## Team Structure

| Role | Pane | Purpose | Model |
|------|------|---------|-------|
| PO | 0 | Product Owner - backlog, priorities, specs, code review, QA | Opus |
| DEV | 1 | Full-stack Developer - implements backend + frontend | Sonnet |
| Boss | Outside | Human user - sprint goals, acceptance | - |

---

## Key Principle: PO is the Hub

All communication flows through PO:
- Boss → PO → DEV
- DEV → PO → Boss
- DEV never communicates directly with Boss

---

## CRITICAL: Pane Detection Bug

**NEVER use `tmux display-message -p '#{pane_index}'`** - returns active cursor pane, NOT your pane!

**Always use `$TMUX_PANE`:**

```bash
echo $TMUX_PANE
tmux list-panes -a -F '#{pane_id} #{pane_index} #{@role_name}' | grep $TMUX_PANE
```

---

## Communication Protocol

### Use tm-send for ALL Messages

```bash
# Correct
tm-send DEV "PO [HH:mm]: Sprint assigned. See spec."
tm-send PO "DEV [HH:mm]: Task done. Tests passing."

# Forbidden - NEVER use raw tmux send-keys
tmux send-keys -t %16 "message" C-m C-m  # NEVER!
```

### Two-Step Response Rule

Every task requires TWO responses:
1. **ACKNOWLEDGE** (immediately): "Received, starting now"
2. **COMPLETE** (when done): "Task DONE. [Summary]"

---

## Sprint Workflow (Simplified for 2-Person Team)

### Phase 1: Sprint Planning
```
Boss → PO: Sprint Goal / requirements
PO: Creates spec with acceptance criteria
PO → DEV: Sprint assignment with spec
```

### Phase 2: Sprint Execution
```
1. DEV acknowledges and starts implementation
2. DEV implements with tests (backend + frontend)
3. DEV → PO: Reports completion
4. PO: Reviews code + runs tests (acts as TL + QA)
5. PO → DEV: Feedback or approval
6. Loop 3-5 until approved
```

### Phase 3: Sprint Review & Production Approval
```
PO → Boss: Sprint summary with deliverables (on dev environment)
Boss: Reviews on dev environment, tests functionality
Boss: APPROVE or REQUEST CHANGES
  - If APPROVE → PO merges to main and deploys to production
  - If REQUEST CHANGES → PO creates feedback tasks → back to Phase 2
```

**CRITICAL: Nothing goes to production without Boss approval.**
- PO can merge feature branches into sprint branch (dev)
- PO can deploy to dev environment for Boss review
- Only Boss can authorize merge to main / deploy to production

---

## Definition of Done

A task is "Done" when:
- [ ] Code implemented and committed
- [ ] Tests pass (backend: jest, frontend: vitest)
- [ ] Lint and build pass
- [ ] PO code review approved
- [ ] PO acceptance verified
- [ ] **Boss approved for production** (required before merge to main)

---

## Git Workflow

```bash
# Sprint branch (dev environment)
git checkout -b sprint_{N}

# Feature branches
git checkout -b feature_{description}

# After PO review → merge to sprint branch (dev only)
git checkout sprint_{N}
git merge feature_{description}

# Deploy to dev for Boss review
# Boss reviews on dev-love-scrum.hungphu.work

# ONLY after Boss approves → merge to main (production)
git checkout main
git merge sprint_{N}
git push origin main
```

---

## Development Commands

### Backend
```bash
cd backend
npm run dev          # Dev server (port 5005)
npm test             # Jest tests
npm run lint         # ESLint
npm run build        # TypeScript compile
```

### Frontend
```bash
cd frontend
npm run dev          # Vite dev server (port 3337)
npm test             # Vitest
npm run lint         # ESLint
npm run build        # tsc + vite build
```

### Database
```bash
cd backend
npx prisma migrate dev     # Run migrations
npx prisma generate        # Regenerate client
```

---

## Files in This Directory

```
love-scrum-team/
├── workflow.md              # This file
├── WHITEBOARD.md            # Sprint status (PO maintains)
└── prompts/
    ├── PO_PROMPT.md         # Product Owner prompt
    └── DEV_PROMPT.md        # Developer prompt
```

---

## Boss Terminal

Boss operates from a **separate terminal** outside the tmux session.

**Communication Protocol:**
- When Boss types `>>> [message]`, send to PO pane with prefix: `BOSS [HH:MM]: [message]`
- Only send to PO, never directly to DEV

```bash
# Send to PO
tmux send-keys -t love_scrum:0.0 "BOSS [HH:MM]: message" C-m
tmux send-keys -t love_scrum:0.0 C-m

# View PO output
tmux capture-pane -t love_scrum:0.0 -p | tail -50

# Attach to observe
tmux attach -t love_scrum
```
