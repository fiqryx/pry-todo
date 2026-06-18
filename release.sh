#!/bin/bash

VERSION=$1
if [ -z "$VERSION" ]; then
    echo "Usage: ./release.sh --version 1.2.3"
    exit 1
fi

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --version) VERSION="$2"; shift ;;
        *) echo "Usage: ./release.sh --version 1.2.3" ;;
    esac
    shift
done

TARGETS=("linux:amd64" "linux:arm64" "windows:amd64" "windows:arm64")
FILES_TO_UPLOAD=()

for target in "${TARGETS[@]}"; do
    IFS=":" read -r OS ARCH <<< "$target"
    
    sh ./build.sh --os "$OS" --arch "$ARCH" --version "$VERSION"
    if [ $? -ne 0 ]; then
        exit 1
    fi
    
    SRC_PATH=$(find ./.build/ -maxdepth 1 -name "*.tar.gz" | head -n 1)
    
    if [ -f "$SRC_PATH" ]; then
        FILENAME=$(basename "$SRC_PATH")
        mv "$SRC_PATH" "./$FILENAME"
        FILES_TO_UPLOAD+=("$FILENAME")
    else
        echo "Build artifact not found in ./.build/"
        exit 1
    fi
done

echo "Creating GitHub release $VERSION with all binaries..."
gh release create "v$VERSION" "${FILES_TO_UPLOAD[@]}" --title "v$VERSION" -F notes.md

if [ $? -eq 0 ]; then
    echo "All releases published successfully!"
else
    echo "Release failed!"
fi