# Migration Checklist: love-scrum-team → scrum-team (MCP)

**Source template:** `~/.claude/skills/tmux-team-creator-mcp/sample_team/scrum-team/`
**Target:** `docs/tmux/love-scrum-team/`

---

## Boss Decisions (RESOLVED)

- [x] **Communication flow:** PO → SM → TL → devs
- [x] **Model cho SM:** Opus
- [x] **Thêm QA role?** Không — 6 panes (PO, SM, TL, WEB, BE, MOBILE)
- [x] **WHITEBOARD:** Giữ notes/context + MCP cho task tracking

---

## Phase 1: Structure & New Files — DONE

- [x] Tạo `docs/tmux/love-scrum-team/sm/` directory
- [x] Tạo `sm/IMPROVEMENT_BACKLOG.md`
- [x] Tạo `sm/RETROSPECTIVE_LOG.md`
- [x] Tạo `sm/ACTION_ITEMS.md`
- [x] Tạo `prompts/SM_PROMPT.md` (customized for love-scrum)

---

## Phase 2: Update Workflow — DONE

- [x] Update `workflow.md` — Scrum pillars (Transparency, Inspection, Adaptation)
- [x] Update `workflow.md` — SM role in team structure table
- [x] Update `workflow.md` — communication flow (Boss → PO → SM → TL → devs)
- [x] Update `workflow.md` — spec constraints (max 250 lines, ZERO code samples)
- [x] Update `workflow.md` — Definition of Done (8 checkpoints)
- [x] Update `workflow.md` — MCP tools reference (Artifacts section)
- [x] Update `workflow.md` — SM 4-checkpoint monitoring mechanism

---

## Phase 3: Update All Prompts — DONE

- [x] `PO_PROMPT.md` — MCP tools, report to SM, auto-add Boss feedback, sprint review process
- [x] `TL_PROMPT.md` — receive from SM, spec 250 lines, P0/P1/P2 code review
- [x] `WEB_PROMPT.md` — `get_my_tasks`, `update_task_status`, report to SM
- [x] `BE_PROMPT.md` — `get_my_tasks`, `update_task_status`, report to SM
- [x] `MOBILE_PROMPT.md` — `get_my_tasks`, `update_task_status`, report to SM
- [x] All prompts — pre-work verification, two-step response rule

---

## Phase 4: Update Infrastructure — DONE

- [x] Update `setup-team.sh` — 6 panes (PO, SM, TL, WEB, BE, MOBILE)
- [x] Update `setup-team.sh` — models (PO=Opus, SM=Opus, TL=Opus, rest=Sonnet)
- [x] Update `setup-team.sh` — verify tm-send + SessionStart hook
- [x] Update `.claude/commands/init-role.md` — added SM role
- [x] `.claude/hooks/session_start_team_docs.sh` — no change needed (role-agnostic)
- [x] `.claude/settings.json` — no change needed

---

## Phase 5: Migrate Data — DONE

- [x] Migrate WHITEBOARD backlog items → MCP (20 items: 109-128)
- [x] Migrate Sprint 55 tasks → MCP Sprint 1 (ID 21), 14 tasks assigned to MOBILE
- [x] Product backlog items (B8, B16, B22, B23, B25, B35) created in MCP
- [x] WHITEBOARD updated with MCP note
- [x] Verified via `list_backlog` — all 20 items visible

---

## Phase 6: Test & Verify — TODO (when Boss starts team)

- [ ] Chạy `setup-team.sh` — all 6 panes start OK
- [ ] Each agent `/init-role` — detect role đúng
- [ ] Test `tm-send` giữa các role
- [ ] Test MCP tools (create item, list, update status)
- [ ] Test SessionStart hook — agent recover context sau compact
- [ ] Dry run 1 mini-task qua full flow (PO → SM → TL → dev → done)

---

## Phase 7: Cleanup — DONE

- [x] CLAUDE.md — no team section (team info lives in workflow.md)
- [x] MEMORY.md — updated Roles & Communication section with Scrum MCP info
- [ ] Commit all changes (Boss decides when)

---

## Notes

- **MCP tools:** `list_backlog`, `create_backlog_item`, `update_backlog_item`, `delete_backlog_item`, `create_sprint`, `add_item_to_sprint`, `remove_item_from_sprint`, `start_sprint`, `complete_sprint`, `list_sprints`, `get_board`, `get_my_tasks`, `update_task_status`, `add_task_note`
- **Kept love-scrum specifics:** MOBILE role, WEB (not FE), MVVM, NativeWind, driver.js tours, uploadQueue, ProfileScreen benchmark
- **Removed CMO pane** from setup-team.sh (was pane 5, replaced by MOBILE at pane 5)
