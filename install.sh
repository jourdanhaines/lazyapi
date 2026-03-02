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
DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${BINARY}"

echo "Downloading ${BINARY}..."
mkdir -p "$INSTALL_DIR"

if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$DOWNLOAD_URL" -o "${INSTALL_DIR}/lazyapi"
elif command -v wget >/dev/null 2>&1; then
    wget -qO "${INSTALL_DIR}/lazyapi" "$DOWNLOAD_URL"
else
    echo "Error: curl or wget is required" >&2
    exit 1
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
