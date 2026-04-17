#!/bin/bash
set -e

echo "=== Running Conecta 2.0 migrations ==="

MIGRATION_DIR="/docker-entrypoint-initdb.d/migrations"

for f in $(ls "$MIGRATION_DIR"/*.sql | sort); do
  echo "Executing: $(basename $f)"
  psql -U postgres -d conecta2 -f "$f"
done

echo "=== All migrations completed ==="
