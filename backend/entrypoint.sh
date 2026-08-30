#!/usr/bin/env sh
set -e

echo "[ENTRYPOINT] Waiting for PostgreSQL database connection..."
until PGPASSWORD=${POSTGRES_PASSWORD:-postgres} pg_isready -h db -U ${POSTGRES_USER:-postgres}; do
  echo "[ENTRYPOINT] Database not ready, retrying in 2 seconds..."
  sleep 2
done

echo "[ENTRYPOINT] Database connection ready!"

echo "[ENTRYPOINT] Running automated Alembic migrations (alembic upgrade head)..."
alembic upgrade head || echo "[ENTRYPOINT WARNING] Alembic migration skipped or initialized."

echo "[ENTRYPOINT] Starting application process: $@"
exec "$@"
