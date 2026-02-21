# Initialize Agent Role

You are initializing as a member of the Love Scrum Multi-Agent Team.

## Step 1: Detect Team

Check your tmux session:
```bash
tmux display-message -p '#S'
```

## Step 2: Read System Documentation

Read the team workflow:

**File**: `docs/tmux/love-scrum-team/workflow.md`

## Step 3: Read Your Role Prompt

Based on the role argument `$ARGUMENTS`, read your specific role prompt:

- **PO** (Product Owner): `docs/tmux/love-scrum-team/prompts/PO_PROMPT.md`
- **DEV** (Developer): `docs/tmux/love-scrum-team/prompts/DEV_PROMPT.md`

## Step 4: Understand Your Mission

After reading both files:
1. Confirm your role and responsibilities
2. Verify your communication pane IDs are configured
3. Check the WHITEBOARD for current sprint status: `docs/tmux/love-scrum-team/WHITEBOARD.md`
4. Be ready to execute your role in the workflow

## Step 5: Announce Readiness

After initialization, announce:
```
[ROLE] initialized and ready.
Team: love-scrum-team
WHITEBOARD status: [status from WHITEBOARD.md]
Awaiting directives.
```
