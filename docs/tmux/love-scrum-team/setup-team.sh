#!/bin/bash

# Love Scrum Team - 2-Person Setup (PO + DEV)
# Creates a tmux session with 2 Claude Code instances

set -e

PROJECT_ROOT="/Users/hungphu/Documents/AI_Projects/love-scrum"
SESSION_NAME="love_scrum"

echo "Starting Love Scrum Team Setup..."
echo "Project Root: $PROJECT_ROOT"
echo "Session Name: $SESSION_NAME"

# 1. Check if session already exists
if tmux has-session -t $SESSION_NAME 2>/dev/null; then
    echo "Session '$SESSION_NAME' already exists!"
    read -p "Kill existing session and create new one? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        tmux kill-session -t $SESSION_NAME
        echo "Killed existing session"
    else
        echo "Aborted. Use 'tmux attach -t $SESSION_NAME' to attach"
        exit 0
    fi
fi

# 2. Start new tmux session
echo "Creating tmux session '$SESSION_NAME'..."
cd "$PROJECT_ROOT"
tmux new-session -d -s $SESSION_NAME

# 3. Create 2-pane layout (horizontal split)
tmux split-window -h -t $SESSION_NAME
tmux select-layout -t $SESSION_NAME even-horizontal

# 4. Resize for proper pane widths
tmux resize-window -t $SESSION_NAME -x 300 -y 50

# 5. Set pane titles and role names
tmux select-pane -t $SESSION_NAME:0.0 -T "PO"
tmux select-pane -t $SESSION_NAME:0.1 -T "DEV"

tmux set-option -p -t $SESSION_NAME:0.0 @role_name "PO"
tmux set-option -p -t $SESSION_NAME:0.1 @role_name "DEV"

# 6. Get pane IDs
echo "Getting pane IDs..."
PANE_IDS=$(tmux list-panes -t $SESSION_NAME -F "#{pane_id}")
PO_PANE=$(echo "$PANE_IDS" | sed -n '1p')
DEV_PANE=$(echo "$PANE_IDS" | sed -n '2p')

echo "Pane IDs:"
echo "  PO  (Pane 0): $PO_PANE"
echo "  DEV (Pane 1): $DEV_PANE"

# 7. Verify tm-send is installed globally
echo "Verifying tm-send installation..."
if command -v tm-send >/dev/null 2>&1; then
    echo "tm-send is installed at: $(which tm-send)"
else
    echo ""
    echo "ERROR: tm-send is not installed!"
    echo "Install it to ~/.local/bin/tm-send first, then re-run."
    exit 1
fi

# 8. Verify SessionStart hook
HOOK_FILE="$PROJECT_ROOT/.claude/hooks/session_start_team_docs.sh"
if [ ! -f "$HOOK_FILE" ]; then
    echo "WARNING: SessionStart hook not found at $HOOK_FILE"
fi

# 9. Start Claude Code in each pane
echo "Starting Claude Code in all panes..."

# PO - Opus (coordination, review, QA)
tmux send-keys -t $SESSION_NAME:0.0 "cd $PROJECT_ROOT && claude --model opus" C-m

# DEV - Sonnet (implementation)
tmux send-keys -t $SESSION_NAME:0.1 "cd $PROJECT_ROOT && claude --model sonnet" C-m

# 10. Wait for Claude Code to start
echo "Waiting 20 seconds for Claude Code instances..."
sleep 20

# 11. Initialize roles
echo "Initializing agent roles..."
tmux send-keys -t $SESSION_NAME:0.0 "/init-role PO" C-m
sleep 0.3
tmux send-keys -t $SESSION_NAME:0.0 C-m
sleep 3
tmux send-keys -t $SESSION_NAME:0.1 "/init-role DEV" C-m
sleep 0.3
tmux send-keys -t $SESSION_NAME:0.1 C-m

# 12. Wait for initialization
echo "Waiting 15 seconds for role initialization..."
sleep 15

# 13. Summary
echo ""
echo "Setup Complete!"
echo ""
echo "Session: $SESSION_NAME"
echo "Project: $PROJECT_ROOT"
echo ""
echo "Team:"
echo "  +--------+--------+"
echo "  | PO     | DEV    |"
echo "  | Pane 0 | Pane 1 |"
echo "  | Opus   | Sonnet |"
echo "  +--------+--------+"
echo ""
echo "Next steps:"
echo "  1. Attach: tmux attach -t $SESSION_NAME"
echo "  2. Boss provides Sprint Goal to PO via >>>"
echo "  3. Team executes Sprint"
echo ""
echo "Boss commands (from separate terminal):"
echo "  >>> start sprint 1: [goal]"
echo ""
echo "To detach: Ctrl+B, then D"
echo "To kill: tmux kill-session -t $SESSION_NAME"

# 14. Move cursor to PO pane
tmux select-pane -t $SESSION_NAME:0.0
echo "Cursor in Pane 0 (PO)."
