#!/bin/bash
# Auto-detect tmux role and output specific instructions for SessionStart
#
# This hook fires when Claude Code starts a new session (including after context compaction).
# It reminds the agent to re-read their role prompt and check WHITEBOARD for context.

# Check if in tmux
if [ -z "$TMUX" ]; then
  exit 0
fi

# Get role from pane option (set by setup-team.sh)
# CRITICAL: Use explicit pane ID ($TMUX_PANE) instead of -p flag
ROLE=$(tmux show-options -t "$TMUX_PANE" -qv @role_name 2>/dev/null)

if [ -z "$ROLE" ]; then
  exit 0
fi

# Get session name
SESSION=$(tmux display-message -p '#S' 2>/dev/null)

TEAM_DIR="docs/tmux/love-scrum-team"

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "CRITICAL CONTEXT RESTORATION - You are the ${ROLE} agent in tmux team '${SESSION}'.\n\n**MANDATORY FIRST ACTIONS** (do these IMMEDIATELY before anything else):\n\n1. READ your role prompt NOW: ${TEAM_DIR}/prompts/${ROLE}_PROMPT.md\n2. READ the WHITEBOARD for current status: ${TEAM_DIR}/WHITEBOARD.md\n3. CHECK your pane ID: You are in pane ${TMUX_PANE} (use \$TMUX_PANE env var, NOT tmux display-message which shows active cursor pane)\n\nDo NOT proceed with any other tasks until you have read these files and understand your current assignment."
  }
}
EOF
exit 0
