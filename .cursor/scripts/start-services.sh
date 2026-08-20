#!/usr/bin/env bash
# Per-boot startup for the 1500 Blueprint local dev environment.
#
# Brings up the data layer the app depends on: the Docker daemon (nested, so it
# needs the fuse-overlayfs storage driver and legacy iptables), then the local
# Supabase stack, then applies the schema/seed and writes .env.local. Idempotent
# and safe to re-run: it no-ops when a piece is already up. Returns once the stack
# is ready so the dev server (a `terminals` entry) can start.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

log() { echo "[start-services] $*"; }

# --- 1. Docker daemon (nested-VM friendly) --------------------------------
# Nested containers can't use the default overlay2 driver or nft-based iptables.
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy >/dev/null 2>&1 || true
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy >/dev/null 2>&1 || true

if ! sudo test -S /var/run/docker.sock || ! docker info >/dev/null 2>&1; then
  if ! pgrep -x dockerd >/dev/null 2>&1; then
    log "starting dockerd (fuse-overlayfs)…"
    sudo nohup dockerd --storage-driver=fuse-overlayfs >/tmp/dockerd.log 2>&1 &
  fi
  for _ in $(seq 1 30); do
    if sudo test -S /var/run/docker.sock; then break; fi
    sleep 1
  done
  # Let the ubuntu user talk to Docker without sudo (Supabase CLI needs this).
  sudo chmod 666 /var/run/docker.sock 2>/dev/null || true
  for _ in $(seq 1 30); do
    if docker info >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi
docker info >/dev/null 2>&1 && log "docker is up." || { log "ERROR: docker did not start"; tail -20 /tmp/dockerd.log || true; exit 1; }

# --- 2. Supabase local stack ----------------------------------------------
if supabase status >/dev/null 2>&1; then
  log "supabase already running."
else
  log "starting supabase…"
  supabase start
fi

# --- 3. Schema + seed + .env.local ----------------------------------------
log "applying database schema + seed…"
"$ROOT/.cursor/scripts/bootstrap-db.sh"

log "writing .env.local…"
"$ROOT/.cursor/scripts/write-env-local.sh"

log "ready."
