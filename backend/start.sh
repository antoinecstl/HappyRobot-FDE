#!/bin/bash
set -e

# Run seed on first start (if DB doesn't exist yet or has no data)
python -m backend.seed

# Start uvicorn
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
