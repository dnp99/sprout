#!/bin/zsh
# Start the retained local database without reseeding or replacing any records.
set -e
cd "$(dirname "$0")"
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/opt/postgresql@17/bin:$PATH"
if [[ ! -f .env.local || ! -f .local/postgres/PG_VERSION ]]; then
  print 'Local setup is missing. See docs/local-development.md.'
  exit 1
fi
if ! pg_ctl -D .local/postgres status >/dev/null 2>&1; then
  pg_ctl -D .local/postgres -l .local/postgres.log \
    -o "-h 127.0.0.1 -p 55432 -k $PWD/.local/run" start
fi
exec npm run dev -- --hostname 127.0.0.1 --port 3000
