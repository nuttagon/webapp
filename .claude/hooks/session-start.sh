#!/bin/bash
# SessionStart hook for Claude Code cloud sessions.
# Installs project dependencies so tests and linters can run in a fresh container.
# Idempotent and non-interactive. Only runs in remote (cloud) sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

log() { echo "[session-start] $*"; }

# --- Node.js ---------------------------------------------------------------
if [ -f package.json ]; then
  if [ -f pnpm-lock.yaml ] && command -v pnpm >/dev/null 2>&1; then
    log "Installing Node dependencies with pnpm"
    pnpm install --frozen-lockfile=false
  elif [ -f yarn.lock ] && command -v yarn >/dev/null 2>&1; then
    log "Installing Node dependencies with yarn"
    yarn install --non-interactive
  else
    log "Installing Node dependencies with npm"
    npm install --no-audit --no-fund
  fi
fi

# --- Python ----------------------------------------------------------------
if [ -f pyproject.toml ] && grep -q '^\[tool.poetry\]' pyproject.toml && command -v poetry >/dev/null 2>&1; then
  log "Installing Python dependencies with Poetry"
  poetry install --no-interaction --no-ansi
elif [ -f pyproject.toml ] || [ -f requirements.txt ]; then
  log "Installing Python dependencies with pip"
  python3 -m pip install --quiet --upgrade pip
  [ -f requirements.txt ] && python3 -m pip install --quiet -r requirements.txt
  [ -f requirements-dev.txt ] && python3 -m pip install --quiet -r requirements-dev.txt
  if [ -f pyproject.toml ]; then
    python3 -m pip install --quiet -e . 2>/dev/null || true
  fi
fi

# --- Go --------------------------------------------------------------------
if [ -f go.mod ] && command -v go >/dev/null 2>&1; then
  log "Downloading Go modules"
  go mod download
fi

# --- Rust ------------------------------------------------------------------
if [ -f Cargo.toml ] && command -v cargo >/dev/null 2>&1; then
  log "Fetching Rust crates"
  cargo fetch
fi

# --- Ruby ------------------------------------------------------------------
if [ -f Gemfile ] && command -v bundle >/dev/null 2>&1; then
  log "Installing Ruby gems with Bundler"
  bundle install --quiet
fi

log "Done"
