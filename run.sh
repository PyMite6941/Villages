#!/usr/bin/env bash
#
# run.sh — Start Villages locally (backend + frontend)
#
# Usage:  ./run.sh              # normal start
#         ./run.sh --install    # force reinstall deps then start
#         ./run.sh --help       # show help
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
LOG_FILE="$ROOT/villages.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[villages]${NC} $*"; }
ok()   { echo -e "${GREEN}[  ok  ]${NC} $*"; }
warn() { echo -e "${YELLOW}[ warn ]${NC} $*"; }
fail() { echo -e "${RED}[ fail ]${NC} $*"; exit 1; }

# ── Prerequisites ────────────────────────────────────────────

check_prereqs() {
  PYTHON=""
  command -v python3 >/dev/null 2>&1 && PYTHON="python3"
  command -v python   >/dev/null 2>&1 && PYTHON="python"
  if [ -z "$PYTHON" ]; then
    fail "Python 3 is required (https://python.org)"
  fi
  PYTHON_VER=$($PYTHON --version 2>&1)
  $PYTHON -c "import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)" || \
    fail "Python 3.10+ required (found: $PYTHON_VER)"
  ok "Python $PYTHON_VER found"

  NODE=""
  command -v node     >/dev/null 2>&1 && NODE="node"
  command -v node.exe >/dev/null 2>&1 && NODE="node.exe"
  if [ -z "$NODE" ]; then
    fail "Node.js is required (https://nodejs.org)"
  fi
  RAW=$($NODE --version 2>&1)
  CLEAN=${RAW#v}
  MAJOR=${CLEAN%%.*}
  [ "$MAJOR" -ge 18 ] || fail "Node.js 18+ required (found: $RAW)"
  ok "Node $RAW found"
}

# ── Environment files ────────────────────────────────────────

check_env() {
  local MISSING=0
  [ ! -f "$BACKEND_DIR/.env" ] && warn "Missing: backend/.env  (copy from .env.example)" && MISSING=1
  [ ! -f "$FRONTEND_DIR/.env" ] && warn "Missing: frontend/.env (copy from .env.example)" && MISSING=1
  if [ "$MISSING" -eq 1 ]; then
    echo ""
    warn "Create .env files from the examples:"
    echo "  cp backend/.env.example backend/.env"
    echo "  cp frontend/.env.example frontend/.env"
    echo "  # then edit backend/.env with your keys"
    echo ""
    read -rp "Continue anyway? [Y/n] " REPLY
    if [[ "$REPLY" =~ ^[Nn] ]]; then exit 1; fi
  else
    ok ".env files found"
  fi
}

# ── Install dependencies ─────────────────────────────────────

install_deps() {
  log "Installing backend Python dependencies..."
  (cd "$BACKEND_DIR" && pip install -r requirements.txt -q) || fail "pip install failed"
  ok "Backend dependencies installed"

  log "Installing frontend Node dependencies..."
  (cd "$FRONTEND_DIR" && npm install --silent) || fail "npm install failed"
  ok "Frontend dependencies installed"
}

# ── Start servers ────────────────────────────────────────────

cleanup() {
  echo ""
  log "Shutting down..."
  [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null && wait "$BACKEND_PID" 2>/dev/null
  [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null && wait "$FRONTEND_PID" 2>/dev/null
  ok "Stopped"
  exit 0
}

start() {
  trap cleanup SIGINT SIGTERM EXIT

  # Wipe previous log before this run
  : > "$LOG_FILE"

  log "Starting backend (uvicorn)..."
  (cd "$BACKEND_DIR" && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | tee -a "$LOG_FILE") &
  BACKEND_PID=$!

  log "Starting frontend (Vite)..."
  (cd "$FRONTEND_DIR" && npx vite --host 0.0.0.0 --port 5173 2>&1 | tee -a "$LOG_FILE") &
  FRONTEND_PID=$!

  echo ""
  echo -e "  ${GREEN}Frontend:${NC}  http://localhost:5173"
  echo -e "  ${GREEN}Backend:${NC}   http://localhost:8000"
  echo -e "  ${GREEN}API docs:${NC}  http://localhost:8000/docs"
  echo -e "  ${YELLOW}Log:${NC}      $LOG_FILE"
  echo ""
  log "Press Ctrl+C to stop both servers"

  wait
}

# ── Main ─────────────────────────────────────────────────────

case "${1:-}" in
  --help|-h)
    echo "Usage: ./run.sh [--install]"
    echo ""
    echo "  --install    Force reinstall dependencies before starting"
    echo "  --help       Show this help"
    exit 0
    ;;
  --install)
    check_prereqs
    check_env
    install_deps
    start
    ;;
  *)
    check_prereqs
    check_env
    if [ ! -d "$BACKEND_DIR/.venv" ] && [ ! -f "$BACKEND_DIR/.deps-installed" ]; then
      warn "Dependencies not installed yet. Running install..."
      install_deps
      touch "$BACKEND_DIR/.deps-installed"
    fi
    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
      warn "node_modules not found. Running install..."
      install_deps
    fi
    start
    ;;
esac
