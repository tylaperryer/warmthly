#!/bin/bash
# Build script for Warmthly
# This script builds the project using Vite and prepares it for Cloudflare Pages deployment

set -e

# Check if npm is available
if ! command -v npm &> /dev/null; then
  echo "❌ npm is not installed or not in PATH"
  exit 1
fi

echo "🚀 Starting Warmthly build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist build

# Type check
# Phase 4 Issue 4.1: Build script should fail on type errors
echo "🔍 Running TypeScript type check..."
if ! npm run type-check; then
  echo "❌ Type check failed! Build aborted."
  exit 1
fi

# Run tests
# Phase 4 Issue 4.1: Build script should fail on test failures
echo "🧪 Running tests..."
if ! npm run test -- --run; then
  echo "❌ Tests failed! Build aborted."
  exit 1
fi

# Generate sitemaps
echo "🗺️  Generating sitemaps..."
npm run generate:sitemap || {
  echo "⚠️  Sitemap generation failed, but continuing with build..."
}

# Build with Vite
echo "📦 Building with Vite..."
npm run build

# Copy static assets that Vite doesn't handle
echo "📋 Copying static assets..."
for app in main mint post admin; do
  if [ -d "apps/$app" ]; then
    mkdir -p "dist/$app"
    
    # Copy HTML files (Vite should have processed these, but ensure they exist)
    if [ ! -f "dist/$app/index.html" ]; then
      cp -r "apps/$app"/* "dist/$app/" 2>/dev/null || true
    fi
    
    # Copy shared assets from assets/ folder
    if [ -d "assets/fonts" ]; then
      mkdir -p "dist/$app/assets/fonts"
      cp -r assets/fonts/* "dist/$app/assets/fonts/" 2>/dev/null || true
      # Also copy to old location for backward compatibility
      cp -r assets/fonts "dist/$app/fonts" 2>/dev/null || true
    fi
    if [ -d "assets/images" ]; then
      mkdir -p "dist/$app/assets/images"
      cp -r assets/images/* "dist/$app/assets/images/" 2>/dev/null || true
      # Also copy to old location for backward compatibility
      mkdir -p "dist/$app/global/images"
      cp -r assets/images "dist/$app/global/images" 2>/dev/null || true
    fi
    
    # Copy compiled lego directory from dist/lego to each app
    if [ -d "dist/lego" ]; then
      cp -r dist/lego "dist/$app/" 2>/dev/null || true
    fi
    
    # Copy root files
    [ -f "robots.txt" ] && cp robots.txt "dist/$app/" 2>/dev/null || true
    [ -f "manifest.json" ] && cp manifest.json "dist/$app/" 2>/dev/null || true
    [ -f "Oalien.svg" ] && cp Oalien.svg "dist/$app/" 2>/dev/null || true
    
    # Copy service worker
    [ -f "sw.js" ] && cp sw.js "dist/$app/" 2>/dev/null || true
    
    # Copy sitemap if it exists
    [ -f "apps/$app/sitemap.xml" ] && cp "apps/$app/sitemap.xml" "dist/$app/" 2>/dev/null || true
    
    # Create .nojekyll
    touch "dist/$app/.nojekyll"
  fi
done

echo "✅ Build completed successfully!"
echo "📁 Build output: dist/"

