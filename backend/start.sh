#!/bin/bash

# Run seed on first start (best-effort — don't block server if it fails)
python -m backend.seed || echo "Seed skipped or failed — continuing"

# Start uvicorn on Railway's $PORT (falls back to 8000 locally)
exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}
