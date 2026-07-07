#!/bin/sh
# start.sh — Asynchronous DB migration & seeding on container boot (Render Free Tier compatible)

echo "[Start Script] Running database migrations..."
alembic upgrade head

echo "[Start Script] Running curriculum seeding..."
python seed/seed_data.py

echo "[Start Script] Launching Gunicorn ASGI server..."
exec gunicorn main:app \
     -k uvicorn.workers.UvicornWorker \
     --workers 4 \
     --bind 0.0.0.0:8000 \
     --timeout 120 \
     --graceful-timeout 30 \
     --log-level info \
     --access-logfile - \
     --error-logfile -
