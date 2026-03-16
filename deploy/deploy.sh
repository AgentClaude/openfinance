#!/usr/bin/env bash
# deploy.sh — Deploy or update OpenFinance in production
#
# Usage:
#   ./deploy/deploy.sh setup     # First-time setup (generate secrets, build, start)
#   ./deploy/deploy.sh update    # Pull latest, rebuild, migrate, restart
#   ./deploy/deploy.sh status    # Show service status
#   ./deploy/deploy.sh logs      # Tail all service logs
#   ./deploy/deploy.sh backup    # Run a backup before update

set -euo pipefail

COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
ENV_FILE=".env.production"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}▸${NC} $1"; }
warn() { echo -e "${YELLOW}▸${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1" >&2; }
header() { echo -e "\n${BLUE}═══ $1 ═══${NC}\n"; }

check_deps() {
  for cmd in docker git; do
    if ! command -v "$cmd" &>/dev/null; then
      error "$cmd is required but not installed."
      exit 1
    fi
  done

  if ! docker compose version &>/dev/null; then
    error "Docker Compose v2 is required."
    exit 1
  fi
}

generate_secret() {
  openssl rand -hex 32
}

setup() {
  header "OpenFinance Production Setup"
  check_deps

  # Generate production env if it doesn't exist
  if [ ! -f "${ENV_FILE}" ]; then
    log "Generating ${ENV_FILE} with secure secrets..."
    cat > "${ENV_FILE}" <<EOF
# =============================================================================
# OpenFinance Production Configuration
# Generated: $(date -Iseconds)
# =============================================================================

# Domain — REQUIRED for SSL. Set to your domain or Tailscale hostname.
DOMAIN=localhost

# Database
POSTGRES_DB=openfinance_production
POSTGRES_USER=openfinance
POSTGRES_PASSWORD=$(generate_secret)
DATABASE_URL=postgres://openfinance:\${POSTGRES_PASSWORD}@db:5432/openfinance_production

# Rails
RAILS_ENV=production
RAILS_MASTER_KEY=$(generate_secret)
SECRET_KEY_BASE=$(generate_secret)
JWT_SECRET_KEY=$(generate_secret)
JWT_EXPIRATION_HOURS=24

# Redis
REDIS_URL=redis://redis:6379/0
SIDEKIQ_REDIS_URL=redis://redis:6379/1

# Plaid (optional — leave blank to disable)
ENABLE_PLAID=false
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENVIRONMENT=sandbox
PLAID_WEBHOOK_URL=https://\${DOMAIN}/webhooks/plaid

# CORS
CORS_ORIGINS=https://\${DOMAIN}

# Email (optional)
SMTP_ADDRESS=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=noreply@\${DOMAIN}

# Feature flags
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_BACKGROUND_JOBS=true
ENABLE_API_DOCS=false
ENABLE_GRAPHQL_PLAYGROUND=false
SEED_SAMPLE_DATA=false
DEBUG_MODE=false
LOG_LEVEL=info

# Ports (Caddy handles 80/443, these are internal)
API_PORT=3001
WEB_PORT=3002
EOF

    warn "⚠️  Edit ${ENV_FILE} and set your DOMAIN before starting!"
    warn "   For Tailscale: DOMAIN=your-hostname.tailnet-name.ts.net"
    warn "   For public: DOMAIN=finance.yourdomain.com"
    echo ""
  else
    log "${ENV_FILE} already exists, skipping generation."
  fi

  # Create .env symlink for docker compose
  if [ ! -L .env ] || [ "$(readlink .env)" != "${ENV_FILE}" ]; then
    warn "Linking .env → ${ENV_FILE}"
    ln -sf "${ENV_FILE}" .env
  fi

  # Build images
  header "Building Docker Images"
  ${COMPOSE_CMD} build --no-cache

  # Start services
  header "Starting Services"
  ${COMPOSE_CMD} up -d

  # Wait for health
  log "Waiting for services to be healthy..."
  sleep 15

  # Check health
  if ${COMPOSE_CMD} exec -T api curl -sf http://localhost:3001/health >/dev/null 2>&1; then
    log "✅ API is healthy"
  else
    warn "API may still be starting. Check: ${COMPOSE_CMD} logs api"
  fi

  # Setup backup cron
  header "Backup Setup"
  chmod +x deploy/backup.sh
  mkdir -p backups
  log "Run daily backups with: 0 2 * * * cd $(pwd) && ./deploy/backup.sh"

  header "Setup Complete! 🎉"
  echo ""
  echo "  Dashboard:  https://\$(grep DOMAIN ${ENV_FILE} | head -1 | cut -d= -f2)"
  echo "  API Health:  ${COMPOSE_CMD} exec api curl http://localhost:3001/health"
  echo ""
  echo "  Useful commands:"
  echo "    ${COMPOSE_CMD} ps          # Service status"
  echo "    ${COMPOSE_CMD} logs -f     # Follow logs"
  echo "    ./deploy/backup.sh          # Run backup"
  echo "    ./deploy/deploy.sh update   # Deploy updates"
  echo ""
}

update() {
  header "Updating OpenFinance"
  check_deps

  # Pre-update backup
  log "Running pre-update backup..."
  ./deploy/backup.sh

  # Pull latest code
  log "Pulling latest code..."
  git pull origin main

  # Rebuild images
  log "Rebuilding images..."
  ${COMPOSE_CMD} build

  # Rolling restart: web first (stateless), then API, then Sidekiq
  log "Restarting web..."
  ${COMPOSE_CMD} up -d --no-deps web

  log "Restarting API (with migrations)..."
  ${COMPOSE_CMD} up -d --no-deps api

  log "Waiting for API to be healthy..."
  sleep 10
  if ${COMPOSE_CMD} exec -T api curl -sf http://localhost:3001/health >/dev/null 2>&1; then
    log "✅ API is healthy"
  else
    warn "API may still be starting. Check logs."
  fi

  log "Restarting Sidekiq..."
  ${COMPOSE_CMD} up -d --no-deps sidekiq

  header "Update Complete ✅"
  ${COMPOSE_CMD} ps
}

status() {
  header "OpenFinance Status"
  ${COMPOSE_CMD} ps
  echo ""

  log "Health checks:"
  for svc in api web caddy; do
    state=$(${COMPOSE_CMD} ps --format json "${svc}" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('Health','unknown'))" 2>/dev/null || echo "unknown")
    case "${state}" in
      healthy) echo -e "  ${GREEN}✓${NC} ${svc}: healthy" ;;
      starting) echo -e "  ${YELLOW}…${NC} ${svc}: starting" ;;
      *) echo -e "  ${RED}✗${NC} ${svc}: ${state}" ;;
    esac
  done

  echo ""
  log "Disk usage:"
  docker system df 2>/dev/null | head -5
  echo ""
  if [ -d backups ]; then
    BACKUP_COUNT=$(ls backups/openfinance_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
    BACKUP_SIZE=$(du -sh backups 2>/dev/null | cut -f1)
    log "Backups: ${BACKUP_COUNT} files, ${BACKUP_SIZE}"
  fi
}

case "${1:-help}" in
  setup)  setup ;;
  update) update ;;
  status) status ;;
  logs)   ${COMPOSE_CMD} logs -f --tail=100 ;;
  backup) ./deploy/backup.sh ;;
  help|*)
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  setup    First-time production setup (generate secrets, build, start)"
    echo "  update   Pull latest, rebuild, migrate, restart"
    echo "  status   Show service health and disk usage"
    echo "  logs     Tail all service logs"
    echo "  backup   Run a database backup"
    ;;
esac
