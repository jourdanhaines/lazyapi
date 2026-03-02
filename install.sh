#!/bin/sh
set -e

REPO="flux-interactive/lazyapi"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

# Detect OS
case "$(uname -s)" in
    Linux*)  OS="linux"  ;;
    Darwin*) OS="darwin" ;;
    *)
        echo "Error: unsupported OS '$(uname -s)'" >&2
        exit 1
        ;;
esac

# Detect architecture
case "$(uname -m)" in
    x86_64)  ARCH="x64"   ;;
    aarch64) ARCH="arm64"  ;;
    arm64)   ARCH="arm64"  ;;
    *)
        echo "Error: unsupported architecture '$(uname -m)'" >&2
        exit 1
        ;;
esac

BINARY="lazyapi-${OS}-${ARCH}"

echo "Downloading ${BINARY}..."
mkdir -p "$INSTALL_DIR"

if [ -n "$GITHUB_TOKEN" ]; then
    # Private repo: resolve asset URL via GitHub API
    ASSET_URL=$(curl -fsSL \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${REPO}/releases/latest" \
        | grep -o "\"url\": *\"[^\"]*${BINARY}\"" \
        | grep -o "https://[^\"]*")

    if [ -z "$ASSET_URL" ]; then
        echo "Error: could not find ${BINARY} in latest release" >&2
        exit 1
    fi

    curl -fsSL \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/octet-stream" \
        "$ASSET_URL" -o "${INSTALL_DIR}/lazyapi"
else
    # Public repo: download directly
    DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${BINARY}"

    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "$DOWNLOAD_URL" -o "${INSTALL_DIR}/lazyapi"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "${INSTALL_DIR}/lazyapi" "$DOWNLOAD_URL"
    else
        echo "Error: curl or wget is required" >&2
        exit 1
    fi
fi

chmod +x "${INSTALL_DIR}/lazyapi"
echo "Installed lazyapi to ${INSTALL_DIR}/lazyapi"

# Check if install dir is in PATH
case ":$PATH:" in
    *":${INSTALL_DIR}:"*) ;;
    *)
        echo ""
        echo "Add ${INSTALL_DIR} to your PATH:"
        echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
        ;;
esac
