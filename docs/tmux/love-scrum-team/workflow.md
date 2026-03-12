# Love Scrum - 5-Person Team (PO + TL + WEB + BE + MOBILE)

<context>
A 5-agent team for the Love Scrum project.
PO owns product and talks to TL. TL coordinates and assigns tasks to WEB, BE, MOBILE devs.
</context>

**Terminology:** "Role" and "agent" are used interchangeably. Each role is a Claude Code AI agent instance.

---

## Team Structure

| Role | Pane | Purpose | Model |
|------|------|---------|-------|
| PO | 0 | Product Owner - backlog, priorities, specs, QA | Opus |
| TL | 1 | Tech Lead - code review, task breakdown, dev coordination | Sonnet |
| WEB | 2 | Web Frontend Developer - React + Vite + Tailwind | Sonnet |
| BE | 3 | Backend Developer - Express + Prisma + PostgreSQL | Sonnet |
| MOBILE | 4 | Mobile Developer - React Native + NativeWind | Sonnet |
| Boss | Outside | Human user - sprint goals, acceptance | - |

---

## Key Principle: Chain of Command

```
Boss → PO → TL → WEB / BE / MOBILE
```

- **Boss** talks ONLY to **PO**
- **PO** talks ONLY to **TL** (product specs, priorities, review results)
- **TL** talks to **WEB, BE, MOBILE** (technical tasks, review feedback)
- **WEB/BE/MOBILE** report ONLY to **TL**
- **TL** aggregates and reports to **PO**

**No skipping levels.** Devs never talk to PO or Boss directly.

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
# PO → TL
tm-send TL "PO [HH:mm]: Sprint spec ready. See WHITEBOARD."

# TL → Devs
tm-send WEB "TL [HH:mm]: Implement dashboard redesign."
tm-send BE "TL [HH:mm]: Add new API endpoint for recipes."
tm-send MOBILE "TL [HH:mm]: Build recipe screen with MVVM."

# Devs → TL
tm-send TL "WEB [HH:mm]: Task done. Tests passing."
tm-send TL "BE [HH:mm]: API endpoint ready."
tm-send TL "MOBILE [HH:mm]: Screen done. Lint clean."

# TL → PO
tm-send PO "TL [HH:mm]: All tasks complete. Ready for review."

# Forbidden - NEVER use raw tmux send-keys
tmux send-keys -t %16 "message" C-m C-m  # NEVER!
```

### Two-Step Response Rule

Every task requires TWO responses:
1. **ACKNOWLEDGE** (immediately): "Received, starting now"
2. **COMPLETE** (when done): "Task DONE. [Summary]"

---

## Sprint Workflow

### Phase 1: Sprint Planning
```
Boss → PO: Sprint Goal / requirements
PO: Creates spec with acceptance criteria
PO → TL: Sprint assignment with spec
TL: Breaks spec into technical tasks for WEB/BE/MOBILE
TL → WEB/BE/MOBILE: Task assignments
```

### Phase 2: Sprint Execution
```
1. WEB/BE/MOBILE acknowledge and start (parallel)
2. Each dev implements their domain with tests
3. Dev → TL: Reports completion
4. TL: Reviews code + runs tests
5. TL → Dev: Feedback or approval
6. Loop 3-5 until all tasks approved
7. TL → PO: Sprint tasks complete
8. PO: Final QA validation
```

### Phase 3: Sprint Review & Production Approval
```
PO → Boss: Sprint summary with deliverables (on dev environment)
Boss: Reviews on dev environment, tests functionality
Boss: APPROVE or REQUEST CHANGES
  - If APPROVE → PO merges to main and deploys to production
  - If REQUEST CHANGES → PO → TL → devs fix → re-review
```

**CRITICAL: Nothing goes to production without Boss approval.**

---

## Definition of Done

A task is "Done" when:
- [ ] Code implemented and committed
- [ ] Tests pass (backend: jest, frontend: vitest, mobile: jest + lint)
- [ ] Lint and build pass
- [ ] TL code review approved
- [ ] PO acceptance verified
- [ ] **Boss approved for production** (required before merge to main)

---

## Git Workflow

```bash
# Sprint branch (dev environment)
git checkout -b sprint_{N}

# After TL review → merge to sprint branch (dev only)
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

### Backend (`backend/`)
```bash
npm run dev          # Dev server (port 5005)
npm test             # Jest tests
npm run lint         # ESLint
npm run build        # TypeScript compile
```

### Frontend (`frontend/`)
```bash
npm run dev          # Vite dev server (port 3337)
npm test             # Vitest
npm run lint         # ESLint
npm run build        # tsc + vite build
```

### Mobile (`mobile/`)
```bash
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm run start        # Metro bundler
npm run lint         # tsc --noEmit + ESLint
npm test             # Jest
```

---

## Files in This Directory

```
love-scrum-team/
├── workflow.md              # This file
├── WHITEBOARD.md            # Sprint status (PO maintains)
└── prompts/
    ├── PO_PROMPT.md         # Product Owner prompt
    ├── TL_PROMPT.md         # Tech Lead prompt
    ├── WEB_PROMPT.md        # Web Frontend Developer prompt
    ├── BE_PROMPT.md         # Backend Developer prompt
    └── MOBILE_PROMPT.md     # Mobile Developer prompt
```

---

## Boss Terminal

Boss operates from a **separate terminal** outside the tmux session.

**Communication Protocol:**
- When Boss types `>>> [message]`, send to PO pane with prefix: `BOSS [HH:MM]: [message]`
- Only send to PO, never directly to other roles

```bash
# Send to PO
tmux send-keys -t love_scrum:0.0 "BOSS [HH:MM]: message" C-m
tmux send-keys -t love_scrum:0.0 C-m

# View PO output
tmux capture-pane -t love_scrum:0.0 -p | tail -50

# Attach to observe
tmux attach -t love_scrum
```
