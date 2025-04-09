#!/bin/bash
set -e

# Remove existing pnpm installation if it exists
npm rm -g pnpm || true

# Install pnpm with force flag and no extra output
npm install -g pnpm@latest --no-fund --no-audit

# Verify installation
pnpm --version || exit 1

# Install dependencies
pnpm install