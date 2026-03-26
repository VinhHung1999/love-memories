# Love Scrum - 6-Person Scrum Team (PO + SM + TL + WEB + BE + MOBILE)

<context>
A Scrum-based multi-agent team for the Love Scrum project.
Follows official Scrum Guide 2020 with adaptations for AI agent teams.
</context>

**Terminology:** "Role" and "agent" are used interchangeably. Each role is a Claude Code AI agent instance that may lose context between sessions.

---

## Scrum Framework

### Three Pillars
1. **Transparency** - All work visible on the board (via MCP tools) and commits
2. **Inspection** - Regular reviews and retrospectives
3. **Adaptation** - Continuous improvement through prompt updates

### The Two Products

| Product | What | For AI Agent Teams |
|---------|------|-------------------|
| **1. Better Software** | The product | Love Scrum app (web + mobile + backend) |
| **2. Better Team** | Team improvement | **Better Prompts** |

**All roles contribute to Goal #1. SM's primary focus is Goal #2.**

> For AI agents: **improving the team IS improving the prompts.**

---

## Team Structure

| Role | Pane | Scrum Category | Model | Purpose |
|------|------|----------------|-------|---------|
| PO | 0 | Product Owner | Opus | Backlog, priorities, acceptance, stakeholder liaison |
| SM | 1 | Scrum Master | Opus | Team effectiveness, process improvement, sprint coordination |
| TL | 2 | Developer | Opus | Architecture, specs, code review, technical coordination |
| WEB | 3 | Developer | Sonnet | Web frontend (React + Vite + Tailwind v4) |
| BE | 4 | Developer | Sonnet | Backend (Express + Prisma + PostgreSQL) |
| MOBILE | 5 | Developer | Sonnet | Mobile (React Native + NativeWind + MVVM) |
| Boss | Outside | Stakeholder | - | Sprint goals, feedback, acceptance |

---

## CRITICAL: Pane Detection (Common Bug)

**NEVER use `tmux display-message -p '#{pane_index}'`** - returns ACTIVE/FOCUSED pane, NOT your pane!

**Always use `$TMUX_PANE` environment variable:**

```bash
# CORRECT
echo $TMUX_PANE
tmux list-panes -a -F '#{pane_id} #{pane_index} #{@role_name}' | grep $TMUX_PANE
```

---

## Communication Protocol

### Chain of Command

```
Boss → PO → SM → TL → WEB / BE / MOBILE
```

- **Boss** talks ONLY to **PO**
- **PO** talks ONLY to **SM** (backlog, priorities, acceptance)
- **SM** talks to **TL** (specs, tasks) and ALL devs (process, impediments)
- **TL** talks to **WEB, BE, MOBILE** (technical tasks, review feedback)
- **WEB/BE/MOBILE** report to **SM** (completion, blockers) and ask **TL** (technical questions)

**SM is the process hub. TL is the technical hub.**

### TWO-STEP RESPONSE RULE (CRITICAL)

Every task requires TWO responses:
1. **ACKNOWLEDGE** (immediately): "Received, starting now"
2. **COMPLETE** (when done): "Task DONE. [Summary]"

### Use tm-send for ALL Messages

```bash
# Correct
tm-send SM "BE -> SM: Task complete. Ready for review."

# Forbidden
tmux send-keys -t %16 "message" C-m C-m  # NEVER!
```

### Communication Patterns

| From | To | When |
|------|-----|------|
| Boss | PO | Sprint goals, priorities, feedback |
| PO | SM | Backlog updates, priority changes, acceptance |
| SM | TL | Technical tasks, spec requests |
| SM | All | Sprint coordination, retrospective |
| TL | WEB/BE/MOBILE | Technical tasks, review feedback |
| WEB/BE/MOBILE | SM | Completion, blockers, impediments |
| WEB/BE/MOBILE | TL | Technical questions |
| All | SM | Frustration signals, process improvements |

---

## Scrum Events

### Sprint Planning
1. **PO** presents Sprint Goal and prioritized backlog
2. **SM** facilitates, adds items via `add_item_to_sprint` MCP tool
3. **TL** provides technical feasibility input and writes specs
4. **SM** starts sprint via `start_sprint` MCP tool

### No Daily Scrum

AI teams don't need scheduled check-ins. Developers message SM when they need help.

### Sprint Review
1. Developers demonstrate completed work
2. PO accepts/rejects based on Definition of Done
3. Boss reviews on dev environment
4. PO updates backlog based on feedback

### Sprint Retrospective (SM's Key Event)

SM uses OWN NOTES (not agent feedback — agents lose context):
1. Review sm/IMPROVEMENT_BACKLOG.md observations
2. Pick 1-2 highest impact items
3. Update prompts only if recurring (2-3 sprints)
4. Document in sm/RETROSPECTIVE_LOG.md

---

## SM's Improvement Responsibilities

### During Sprint
- Log issues to sm/IMPROVEMENT_BACKLOG.md (don't stop work)
- Spot-check active improvement compliance

### At Sprint End
- Pick 1-2 improvements (focus over completeness)
- Determine status: Effective / Still monitoring / Not working

### 4 Enforcement Checkpoints

| Checkpoint | When | SM Action |
|------------|------|-----------|
| 1. Announce | Sprint Start | Broadcast active improvement to ALL roles |
| 2. Spot Check | During Sprint | Watch, remind if forgotten, log evidence |
| 3. Verify | Sprint End | Count compliance vs reminders |
| 4. Enforce | After 2-3 sprints | Add to prompt if effective |

### Prompt Hygiene
- Add only after 2-3 sprints of recurring issues
- Remove when behavior is learned (3+ sprints, no issues)
- Goal: Prompts should "work themselves out of a job"

---

## Sprint Workflow

### Phase 1: Sprint Planning

```
Boss → PO: Sprint Goal
PO → SM: Backlog items for Sprint
SM → TL: Write technical spec
TL: Spec (max 250 lines, ZERO code samples) → SM
SM: Adds items to sprint board → starts sprint
SM → TL: Distribute tasks to WEB/BE/MOBILE
```

### Phase 2: Sprint Execution

```
1. TL writes Technical Spec with Acceptance Criteria
2. TL distributes tasks to WEB/BE/MOBILE
3. WEB/BE/MOBILE implement (parallel)
4. WEB/BE/MOBILE → SM: Report completion
5. TL reviews code (P0/P1/P2 checklist)
6. SM monitors progress, removes impediments
7. PO available for clarifications (through SM)
```

**CRITICAL: Technical Spec Required**
- TL MUST write spec BEFORE devs implement
- Maximum 250 lines, ZERO working code samples
- WHAT to build, not HOW (database schema YES, exact SQL NO)

### Phase 3: Sprint Review

```
SM → PO: Sprint tasks complete
PO: QA validation (run tests, verify acceptance criteria)
PO → Boss: Present for acceptance on dev environment
Boss: Reviews, APPROVE or REQUEST CHANGES
  - If APPROVE → PO merges main + deploys production
  - If REQUEST CHANGES → PO → SM → TL → devs fix → re-review
```

**CRITICAL: Nothing goes to production without Boss approval.**

### Phase 4: Sprint Retrospective

```
PO → SM: "Sprint merged. Trigger retrospective."
SM: Runs retro using own observations
SM → All: Retrospective updates needed
Each agent updates own docs (parallel)
SM → PO: "Retro complete."
```

---

## Artifacts

### Product Backlog (PO owns)
**Managed via MCP tools:** `list_backlog`, `create_backlog_item`, `update_backlog_item`, `delete_backlog_item`

### Sprint Board (SM owns)
**Managed via MCP tools:** `get_board`, `add_item_to_sprint`, `remove_item_from_sprint`, `update_task_status`, `add_task_note`
**Sprint lifecycle:** `create_sprint`, `start_sprint`, `complete_sprint`, `list_sprints`

### Task Assignment
**Managed via:** `get_my_tasks` MCP tool — each role checks their assigned tasks

### WHITEBOARD (PO maintains)
**Location:** `docs/tmux/love-scrum-team/WHITEBOARD.md`
- High-level notes, sprint context, previous sprint history
- NOT for task tracking (use MCP tools instead)

### SM Workspace
- `sm/IMPROVEMENT_BACKLOG.md` — Process issues (log during sprint)
- `sm/RETROSPECTIVE_LOG.md` — Historical lessons
- `sm/ACTION_ITEMS.md` — Improvement tracking

---

## Definition of Done

A task is "Done" when:
- [ ] Code implemented and committed
- [ ] Tests pass (backend: jest, frontend: vitest, mobile: jest + lint)
- [ ] Lint and build pass
- [ ] TL code review approved
- [ ] Task status updated via `update_task_status` MCP tool
- [ ] SM notified of completion
- [ ] PO acceptance verified
- [ ] **Boss approved for production** (required before merge to main)

---

## Role Boundaries

| Role | Responsibilities | Does NOT |
|------|------------------|----------|
| PO | Backlog, priorities, acceptance | Write code, make technical decisions |
| SM | Process, improvement, coordination | Write code, make product/technical decisions |
| TL | Architecture, specs, review | Override PO on priorities |
| WEB | Web frontend code | Backend/mobile code |
| BE | Backend code | Frontend/mobile code |
| MOBILE | Mobile code | Backend/web code |

---

## Git Workflow

```bash
# Sprint branch (dev environment)
git checkout -b sprint_{N}

# Devs commit directly to sprint branch (Boss rule: no sub-branches)
git add . && git commit -m "feat: [description]"

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
npm run dev          # Dev server (port 5006 dev / 5005 prod)
npm test             # Jest tests
npm run lint         # ESLint
npm run build        # TypeScript compile
```

### Frontend (`frontend/`)
```bash
npm run dev          # Vite dev server (port 3338 dev / 3337 prod)
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
├── WHITEBOARD.md            # High-level notes & context (PO maintains)
├── sm/                      # SM's workspace
│   ├── IMPROVEMENT_BACKLOG.md  # Process issues (log during sprint)
│   ├── RETROSPECTIVE_LOG.md    # Historical lessons
│   └── ACTION_ITEMS.md         # Improvement tracking
└── prompts/
    ├── PO_PROMPT.md         # Product Owner
    ├── SM_PROMPT.md         # Scrum Master
    ├── TL_PROMPT.md         # Tech Lead
    ├── WEB_PROMPT.md        # Web Frontend Developer
    ├── BE_PROMPT.md         # Backend Developer
    ├── MOBILE_PROMPT.md     # Mobile Developer
    └── CMO_PROMPT.md        # Chief Marketing Officer (on-demand)

# Note: Role→pane mapping is dynamic via tmux @role_name options
# Note: tm-send is a global tool at ~/.local/bin/tm-send (not project-specific)
# Note: Backlog & task management via MCP tools (list_backlog, get_board, etc.)
```

---

## Boss Terminal

Boss operates from a **separate terminal** outside the tmux session.

**Communication Protocol:**
- When Boss types `>>> [message]`, send to PO pane with prefix: `BOSS [HH:MM]: [message]`
- Only send to PO, never directly to other roles

```bash
# Send to PO (pane 0)
tmux send-keys -t love_scrum:0.0 "BOSS [HH:MM]: message" C-m
tmux send-keys -t love_scrum:0.0 C-m

# View PO output
tmux capture-pane -t love_scrum:0.0 -p | tail -50

# Attach to observe
tmux attach -t love_scrum
```

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements → TL reviews → SM coordinates
2. PO QA validates → deploys to dev
3. Boss reviews on dev → approves
4. PO merges main → deploys production

**Note:** `.env.dev` + `.env.prod` are gitignored.
