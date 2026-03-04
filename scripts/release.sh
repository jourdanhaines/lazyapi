#!/bin/sh
set -e

# Usage: sh scripts/release.sh <patch|minor|major>
# Updates version in src/version.ts and package.json, commits, tags, and pushes.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

BUMP="${1:-patch}"

if [ "$BUMP" != "patch" ] && [ "$BUMP" != "minor" ] && [ "$BUMP" != "major" ]; then
    printf "${RED}Usage: sh scripts/release.sh <patch|minor|major>${NC}\n"
    exit 1
fi

# Ensure working tree is clean
if [ -n "$(git status --porcelain)" ]; then
    printf "${RED}Error: Working tree is not clean. Commit or stash changes first.${NC}\n"
    exit 1
fi

# Read current version from src/version.ts
CURRENT=$(grep -oP 'VERSION = "\K[^"]+' src/version.ts)
if [ -z "$CURRENT" ]; then
    printf "${RED}Error: Could not read current version from src/version.ts${NC}\n"
    exit 1
fi

MAJOR=$(echo "$CURRENT" | cut -d. -f1)
MINOR=$(echo "$CURRENT" | cut -d. -f2)
PATCH=$(echo "$CURRENT" | cut -d. -f3)

case "$BUMP" in
    major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
    minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
    patch) PATCH=$((PATCH + 1)) ;;
esac

NEW="${MAJOR}.${MINOR}.${PATCH}"

printf "${YELLOW}Bumping version: ${CURRENT} → ${NEW}${NC}\n"

# Update src/version.ts
sed -i "s/VERSION = \"${CURRENT}\"/VERSION = \"${NEW}\"/" src/version.ts

# Update package.json
sed -i "s/\"version\": \"${CURRENT}\"/\"version\": \"${NEW}\"/" package.json

# Commit and tag
git add src/version.ts package.json
git commit -m "release: v${NEW}"
git tag "v${NEW}"

# Push commit and tag
git push
git push origin "v${NEW}"

printf "${GREEN}Released v${NEW}${NC}\n"
