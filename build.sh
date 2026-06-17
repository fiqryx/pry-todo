#!/bin/bash

# ==========================================
# Default Parameters & Version
# ==========================================
APP_VERSION="1.1.0"
TARGET_OS="linux"
TARGET_ARCH="arm64"

# ==========================================
# Parse Arguments (e.g., ./build.sh --os windows --arch amd64)
# ==========================================
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --os) TARGET_OS="$2"; shift ;;
        --arch) TARGET_ARCH="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo "==========================================="
echo "Starting build process..."
echo "Version     : $APP_VERSION"
echo "Target OS   : $TARGET_OS"
echo "Target Arch : $TARGET_ARCH"
echo "==========================================="

# Setup root build directory
ROOT_DIR=$(pwd)
BUILD_DIR="$ROOT_DIR/.build"

echo "Cleaning old build directory..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# ==========================================
# 1. BUILD BACKEND (GO)
# ==========================================
echo -e "\n[1/3] Building Backend..."
cd "$ROOT_DIR/backend" || { echo "Error: Backend directory not found!"; exit 1; }

# Adjust output binary name for Windows
BIN_NAME="backend"
if [ "$TARGET_OS" = "windows" ]; then
    BIN_NAME="backend.exe"
fi

# Create backend output directory
mkdir -p "$BUILD_DIR/backend"

# Execute Go Build
env GOOS=$TARGET_OS GOARCH=$TARGET_ARCH CGO_ENABLED=0 go build -ldflags="-w -s" -o "$BUILD_DIR/backend/$BIN_NAME" main.go
if [ $? -eq 0 ]; then
    echo "Backend built successfully -> .build/backend/$BIN_NAME"
    cp .env.example "$BUILD_DIR/backend/" 2>/dev/null || true
else
    echo "Error: Backend build failed!"
    exit 1
fi

# ==========================================
# 2. BUILD FRONTEND (NEXT.JS)
# ==========================================
echo -e "\n[2/3] Building Frontend (Standalone)..."
cd "$ROOT_DIR/frontend" || { echo "Error: Frontend directory not found!"; exit 1; }

# Execute Bun Build
bun run build

if [ $? -eq 0 ]; then
    echo "Configuring standalone directory..."
    
    # Next.js standalone requires specific public and static folder placement
    mkdir -p .next/standalone/public
    mkdir -p .next/standalone/.next/static

    # Copy public folder content to standalone/public
    cp -r public/* .next/standalone/public/ 2>/dev/null || true
    cp -r locales/ .next/standalone/
    cp -r intl.config.mjs .next/standalone/
    
    # Copy static files
    cp -r .next/static/* .next/standalone/.next/static/
    rm -f .next/standalone/.env*

    # Move the final standalone output to the root build folder
    cp -r .next/standalone "$BUILD_DIR/frontend"
    cp .env.example "$BUILD_DIR/frontend/" 2>/dev/null || true
    
    echo "Frontend built successfully -> .build/frontend"
else
    echo "Error: Frontend build failed!"
    exit 1
fi

# ==========================================
# 3. COMPRESS RESULT
# ==========================================
echo -e "\n[3/3] Creating tar.gz archive..."
cd "$ROOT_DIR" || { echo "Error: Failed to return to root directory!"; exit 1; }

ARCHIVE_NAME="release-v${APP_VERSION}-${TARGET_OS}-${TARGET_ARCH}.tar.gz"

# Remove the old archive to avoid conflicts
rm -f "$ARCHIVE_NAME"
rm -f "$BUILD_DIR/$ARCHIVE_NAME"

# Create the tar.gz archive containing the build directory
tar -czf "$ARCHIVE_NAME" .build
if [ $? -eq 0 ]; then
    # Move the created archive INTO the build folder
    mv "$ARCHIVE_NAME" "$BUILD_DIR/"
    echo "Archive created successfully -> .build/$ARCHIVE_NAME"
else
    echo "Error: Failed to create tar.gz archive!"
    exit 1
fi

echo -e "\n==========================================="
echo "Build completed!"
echo "Result directory : .build"
echo "Archive file     : .build/$ARCHIVE_NAME"
echo "==========================================="