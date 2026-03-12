# Initialize Agent Role

You are initializing as a member of the Love Scrum Multi-Agent Team.

## Step 1: Detect Your Pane

**CRITICAL: Use $TMUX_PANE, NEVER `tmux display-message -p '#{pane_index}'`** (that returns the focused pane, not yours).

```bash
echo "My pane: $TMUX_PANE"
tmux list-panes -a -F '#{pane_id} #{pane_index} #{@role_name}' | grep $TMUX_PANE
tmux display-message -p '#S'
```

Verify your pane's `@role_name` matches `$ARGUMENTS`. If it doesn't match, use the `@role_name` from your pane (it's more reliable).

## Step 2: Read System Documentation

Read the team workflow:

**File**: `docs/tmux/love-scrum-team/workflow.md`

## Step 3: Read Your Role Prompt

Based on the role argument `$ARGUMENTS`, read your specific role prompt:

| Role | Prompt File | Working Dir |
|------|-------------|-------------|
| **PO** (Product Owner) | `docs/tmux/love-scrum-team/prompts/PO_PROMPT.md` | `/love-scrum` |
| **TL** (Tech Lead) | `docs/tmux/love-scrum-team/prompts/TL_PROMPT.md` | `/love-scrum` |
| **WEB** (Web Frontend) | `docs/tmux/love-scrum-team/prompts/WEB_PROMPT.md` | `/love-scrum/frontend` |
| **BE** (Backend) | `docs/tmux/love-scrum-team/prompts/BE_PROMPT.md` | `/love-scrum/backend` |
| **MOBILE** (Mobile) | `docs/tmux/love-scrum-team/prompts/MOBILE_PROMPT.md` | `/love-scrum/mobile` |

## Step 4: Read Project Context

- Check the WHITEBOARD: `docs/tmux/love-scrum-team/WHITEBOARD.md`
- Read project CLAUDE.md if not already loaded
- For domain-specific roles, also read:
  - **MOBILE**: `mobile/CLAUDE.md`

## Step 5: Confirm Communication Chain

```
Boss → PO → TL → WEB / BE / MOBILE
```

- **PO** talks ONLY to **TL**
- **TL** talks to **PO** + **WEB/BE/MOBILE**
- **WEB/BE/MOBILE** talk ONLY to **TL**
- No skipping levels

## Step 6: Announce Readiness

```
[ROLE] initialized and ready.
Team: love-scrum-team
Pane: $TMUX_PANE (index X)
WHITEBOARD status: [current sprint + status]
Communication: [who I report to] ↔ [who reports to me]
Awaiting directives.
```
