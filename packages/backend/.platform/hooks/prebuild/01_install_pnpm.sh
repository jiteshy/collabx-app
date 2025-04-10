#!/bin/bash
set -e

echo "Starting pnpm installation..."

# Remove existing pnpm installation if it exists
echo "Removing existing pnpm..."
npm rm -g pnpm || true

echo "Installing pnpm..."
# Try installing pnpm with sudo
sudo npm install -g pnpm@latest --no-fund --no-audit --force

echo "Verifying pnpm installation..."
# Verify installation
pnpm --version

echo "pnpm installation complete"