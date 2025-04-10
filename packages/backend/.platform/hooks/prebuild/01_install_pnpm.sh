#!/bin/bash
set -e

echo "Starting pnpm installation..."

# Remove existing pnpm installation if it exists
echo "Removing existing pnpm..."
npm rm -g pnpm || true

echo "Installing pnpm..."
npm install -g pnpm@latest --no-fund --no-audit --force

echo "Verifying pnpm installation..."
pnpm --version

echo "Installing dependencies..."
# Install dependencies without frozen lockfile and ignore workspace protocol
cd /var/app/staging
pnpm install --no-frozen-lockfile --ignore-workspace

echo "pnpm installation complete"