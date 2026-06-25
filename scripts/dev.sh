#!/bin/bash
set -e

# Build the API server first
echo "[dev] Building API server..."
pnpm --filter @workspace/api-server run build

# Start the API server in the background
echo "[dev] Starting API server on port 8080..."
PORT=8080 node --enable-source-maps artifacts/api-server/dist/index.mjs &
API_PID=$!

# Start the Vite frontend dev server on port 5000
echo "[dev] Starting frontend dev server on port 5000..."
PORT=5000 pnpm --filter @workspace/al-bayaan run dev &
VITE_PID=$!

# Forward signals to children
trap "kill $API_PID $VITE_PID 2>/dev/null; exit 0" INT TERM

wait $VITE_PID $API_PID
