# Scrum Master's Improvement Backlog

**Owner:** Scrum Master (SM)
**Purpose:** Track process issues for retrospective discussion. Only 1-2 become action items per Sprint.

---

## How This Works

1. **During Sprint**: SM observes issues and logs them here (don't stop work)
2. **At Retrospective**: Team reviews and **picks 1-2** to action (not all)
3. **Unpicked items**: Stay here for future Sprints
4. **Some items**: May become irrelevant or superseded over time

---

## Active Improvement (Current Sprint)

**From:** Sprint [N] Retrospective
**Action Item:** [The 1-2 items selected]

### Verification Criteria
- **Observable behavior:** [What specific action should team take?]
- **Trigger situation:** [When should this behavior occur?]
- **Expected frequency:** [How often will this situation arise?]

### Sprint Start Announcement
- [ ] Broadcasted to all roles at Sprint start

### Evidence Log (During Sprint)

| Date | Situation | Role | Followed? | Notes |
|------|-----------|------|-----------|-------|
| | [What happened] | BE | Y/N | [Reminded? Evidence?] |

### Sprint End Verification

| Metric | Count |
|--------|-------|
| Situations observed | |
| Followed without reminder | |
| Needed reminder | |
| **Status** | Effective / Still monitoring / Not working |

### Status History
- Sprint N: [Status] - [Brief note]

---

## Observed (Not Yet Discussed)

*SM logs issues here during sprint. Don't stop work - just note and continue.*

| ID | Date | Observation | Source | Impact |
|----|------|-------------|--------|--------|
| OBS-001 | | | | |
| OBS-002 | 2026-04-21 | Scroll-clip LẦN 6 cost ~5h across multiple build cycles + a dead dev-client detour because we had no runtime telemetry on the real device. Fix attempts relied on unverified math. Should have baked an on-device log export earlier. | Sprint 61 retro | High — Boss trust, wasted builds |
| OBS-003 | 2026-04-21 | Dev-client over Cloudflare tunnel layered 3 hidden failure modes (react-native-xcode.sh hardcoded LAN IP, RN default :8081 vs Cloudflare :80/:443 only, iOS ATS blocking non-localhost HTTP). No way to short-circuit early. | Sprint 61 retro | Medium — debugging path |
| OBS-004 | 2026-04-21 | No explicit "bail after LẦN N" rule → Boss had to manually call off the dev-client chase. Decision points belong in the sprint playbook, not in Boss's lap. | Sprint 61 retro | Medium — process |

**Note (2026-04-14):** Initial observation about "PO ticket ID mismatch" was a misread by SM. PO clarified: backlog IDs (e.g. [314], [315]) and sprint task IDs (e.g. [270], [271]) are two legitimate ID spaces — `add_item_to_sprint` creates a new task with its own ID. PO uses sprint task ID in sprint comms. Not a process issue. SM should verify ID space (backlog vs sprint task) before flagging as mismatch.

---

## Discussed (Reviewed at Retro, Not Selected)

*Items reviewed but not prioritized. May be selected in future sprint.*

| ID | Observation | Discussed | Why Not Selected |
|----|-------------|-----------|------------------|
| | | Sprint N | Lower priority than OBS-XXX |

---

## Completed

*Action items that were implemented and verified effective.*

| ID | Observation | Sprint Selected | Sprint Completed | Prompt Updated? |
|----|-------------|-----------------|------------------|-----------------|
| | | | | Yes/No |

---

## Closed (No Longer Relevant)

*Items that became irrelevant or were superseded.*

| ID | Observation | Closed | Reason |
|----|-------------|--------|--------|
| | | Sprint N | Superseded by / No longer applicable |

---

## Prompt Hygiene Log

*Track what was added/removed from prompts. Keep prompts lean.*

| Date | Prompt | Change | Reason |
|------|--------|--------|--------|
| | SM_PROMPT.md | Added: [text] | After 3 sprints of recurring issue |
| | BE_PROMPT.md | Removed: [text] | Behavior learned, no longer needed |

---

## Guidelines

### When to Log (for SM)
- Team member reports frustration
- Same issue occurs twice
- Process causes confusion
- Handoff problems
- Communication breakdowns

### When NOT to Log
- One-time mistakes
- Issues that self-correct
- Technical bugs (those go in issue tracker)

### Prompt Hygiene Rules
- **Add to prompt**: Only after 2-3 sprints of recurring issues
- **Remove from prompt**: When behavior is learned (no issues for 3+ sprints)
- **Goal**: Prompts should "work themselves out of a job"
