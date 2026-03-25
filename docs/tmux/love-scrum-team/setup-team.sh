#!/bin/bash

# Love Scrum Team - 6-Person Setup (PO + TL + WEB + BE + MOBILE + CMO)
# Creates a tmux session with 6 Claude Code instances

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

# 3. Create 5-pane layout
# Split into 6 panes: PO | TL | WEB | BE | MOBILE | CMO
tmux split-window -h -t $SESSION_NAME
tmux split-window -h -t $SESSION_NAME
tmux split-window -h -t $SESSION_NAME
tmux split-window -h -t $SESSION_NAME
tmux split-window -h -t $SESSION_NAME
tmux select-layout -t $SESSION_NAME even-horizontal

# 4. Resize for proper pane widths
tmux resize-window -t $SESSION_NAME -x 900 -y 50

# 5. Set pane titles and role names
tmux select-pane -t $SESSION_NAME:0.0 -T "PO"
tmux select-pane -t $SESSION_NAME:0.1 -T "TL"
tmux select-pane -t $SESSION_NAME:0.2 -T "WEB"
tmux select-pane -t $SESSION_NAME:0.3 -T "BE"
tmux select-pane -t $SESSION_NAME:0.4 -T "MOBILE"
tmux select-pane -t $SESSION_NAME:0.5 -T "CMO"

tmux set-option -p -t $SESSION_NAME:0.0 @role_name "PO"
tmux set-option -p -t $SESSION_NAME:0.1 @role_name "TL"
tmux set-option -p -t $SESSION_NAME:0.2 @role_name "WEB"
tmux set-option -p -t $SESSION_NAME:0.3 @role_name "BE"
tmux set-option -p -t $SESSION_NAME:0.4 @role_name "MOBILE"
tmux set-option -p -t $SESSION_NAME:0.5 @role_name "CMO"

# 6. Get pane IDs
echo "Getting pane IDs..."
PANE_IDS=$(tmux list-panes -t $SESSION_NAME -F "#{pane_id}")
PO_PANE=$(echo "$PANE_IDS" | sed -n '1p')
TL_PANE=$(echo "$PANE_IDS" | sed -n '2p')
WEB_PANE=$(echo "$PANE_IDS" | sed -n '3p')
BE_PANE=$(echo "$PANE_IDS" | sed -n '4p')
MOBILE_PANE=$(echo "$PANE_IDS" | sed -n '5p')
CMO_PANE=$(echo "$PANE_IDS" | sed -n '6p')

echo "Pane IDs:"
echo "  PO     (Pane 0): $PO_PANE"
echo "  TL     (Pane 1): $TL_PANE"
echo "  WEB    (Pane 2): $WEB_PANE"
echo "  BE     (Pane 3): $BE_PANE"
echo "  MOBILE (Pane 4): $MOBILE_PANE"
echo "  CMO    (Pane 5): $CMO_PANE"

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

# 9. Start Claude Code in each pane (each cd to their working dir)
echo "Starting Claude Code in all panes..."

# PO - Opus (product ownership, QA)
tmux send-keys -t $SESSION_NAME:0.0 "cd $PROJECT_ROOT && claude --model opus" C-m

# TL - Sonnet (code review, task coordination)
tmux send-keys -t $SESSION_NAME:0.1 "cd $PROJECT_ROOT && claude --model sonnet" C-m

# WEB - Sonnet (web frontend, cd to frontend/)
tmux send-keys -t $SESSION_NAME:0.2 "cd $PROJECT_ROOT/frontend && claude --model sonnet" C-m

# BE - Sonnet (backend, cd to backend/)
tmux send-keys -t $SESSION_NAME:0.3 "cd $PROJECT_ROOT/backend && claude --model sonnet" C-m

# MOBILE - Sonnet (mobile, cd to mobile/)
tmux send-keys -t $SESSION_NAME:0.4 "cd $PROJECT_ROOT/mobile && claude --model sonnet" C-m

# CMO - Agent (market research, ASO, brand)
tmux send-keys -t $SESSION_NAME:0.5 "cd $PROJECT_ROOT && claude --agent CMO" C-m

# 10. Wait for Claude Code to start
echo "Waiting 25 seconds for Claude Code instances..."
sleep 25

# 11. Initialize roles
echo "Initializing agent roles..."
tmux send-keys -t $SESSION_NAME:0.0 "/init-role PO" C-m
sleep 0.3
tmux send-keys -t $SESSION_NAME:0.0 C-m
sleep 3

tmux send-keys -t $SESSION_NAME:0.1 "/init-role TL" C-m
sleep 0.3
tmux send-keys -t $SESSION_NAME:0.1 C-m
sleep 3

tmux send-keys -t $SESSION_NAME:0.2 "/init-role WEB" C-m
sleep 0.3
tmux send-keys -t $SESSION_NAME:0.2 C-m
sleep 3

tmux send-keys -t $SESSION_NAME:0.3 "/init-role BE" C-m
sleep 0.3
tmux send-keys -t $SESSION_NAME:0.3 C-m
sleep 3

tmux send-keys -t $SESSION_NAME:0.4 "/init-role MOBILE" C-m
sleep 0.3
tmux send-keys -t $SESSION_NAME:0.4 C-m
sleep 3

tmux send-keys -t $SESSION_NAME:0.5 "/init-role CMO" C-m
sleep 0.3
tmux send-keys -t $SESSION_NAME:0.5 C-m

# 12. Wait for initialization
echo "Waiting 20 seconds for role initialization..."
sleep 20

# 13. Summary
echo ""
echo "Setup Complete!"
echo ""
echo "Session: $SESSION_NAME"
echo "Project: $PROJECT_ROOT"
echo ""
echo "Team:"
echo "  +--------+--------+--------+--------+--------+--------+"
echo "  | PO     | TL     | WEB    | BE     | MOBILE | CMO    |"
echo "  | Pane 0 | Pane 1 | Pane 2 | Pane 3 | Pane 4 | Pane 5 |"
echo "  | Opus   | Sonnet | Sonnet | Sonnet | Sonnet | Agent  |"
echo "  +--------+--------+--------+--------+--------+--------+"
echo ""
echo "Communication flow:"
echo "  Boss → PO → TL → WEB / BE / MOBILE"
echo ""
echo "Working directories:"
echo "  PO:     $PROJECT_ROOT"
echo "  TL:     $PROJECT_ROOT"
echo "  WEB:    $PROJECT_ROOT/frontend"
echo "  BE:     $PROJECT_ROOT/backend"
echo "  MOBILE: $PROJECT_ROOT/mobile"
echo "  CMO:    $PROJECT_ROOT"
echo ""
echo "Next steps:"
echo "  1. Attach: tmux attach -t $SESSION_NAME"
echo "  2. Boss provides Sprint Goal to PO via >>>"
echo "  3. Team executes Sprint"
echo ""
echo "To detach: Ctrl+B, then D"
echo "To kill: tmux kill-session -t $SESSION_NAME"

# 14. Move cursor to PO pane
tmux select-pane -t $SESSION_NAME:0.0
echo "Cursor in Pane 0 (PO)."
