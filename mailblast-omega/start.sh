#!/usr/bin/env bash
# start.sh
# Entrypoint for Render Web Service

echo "Starting MailBlast OMEGA Bridge API (Embedded Worker Engine)..."
# If PORT is unmapped by Render, default to 8000
export PORT=${PORT:-8000}
uvicorn api_bridge:app --host 0.0.0.0 --port $PORT --workers 1
