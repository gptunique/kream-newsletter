#!/bin/bash

# Render.com build script for KREAM Newsletter
# This script installs dependencies, Playwright browsers, and builds the application

set -e

echo "🚀 Starting Render.com build process..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
pnpm install --frozen-lockfile

# Install Playwright Chromium browser with system dependencies
echo "🌐 Installing Playwright Chromium browser..."
pnpm playwright install --with-deps chromium

# Build the application
echo "🔨 Building application..."
pnpm run build

echo "✅ Build completed successfully!"
