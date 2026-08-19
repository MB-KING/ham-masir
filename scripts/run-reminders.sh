#!/bin/bash
set -euo pipefail
set -a
. /opt/hammasir/app/.env
set +a
curl -fsS --oauth2-bearer "$CRON_SECRET" \
  http://127.0.0.1:3000/api/cron/reminders >> /var/log/hammasir-cron.log 2>&1
