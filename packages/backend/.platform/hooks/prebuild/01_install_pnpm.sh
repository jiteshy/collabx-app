#!/bin/bash
# Update npm first
npm install -g npm@latest
# Install pnpm using npm
npm install -g pnpm@latest --no-fund --no-audit
# Verify installation
pnpm --version || exit 1

# Install dependencies
pnpm install --frozen-lockfile