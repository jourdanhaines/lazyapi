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

if command -v gh >/dev/null 2>&1; then
    gh release download --repo "$REPO" --pattern "$BINARY" --dir "$INSTALL_DIR" --clobber
    mv "${INSTALL_DIR}/${BINARY}" "${INSTALL_DIR}/lazyapi"
elif [ -n "$GITHUB_TOKEN" ]; then
    curl -fsSL \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/${REPO}/releases/latest" \
        -o /tmp/lazyapi-release.json

    ASSET_ID=$(grep -o "\"id\": *[0-9]*" /tmp/lazyapi-release.json \
        | head -1 | grep -o "[0-9]*" || true)

    # Find asset ID by matching the binary name in the JSON
    ASSET_ID=$(awk -v bin="$BINARY" '
        /"name":/ && index($0, bin) { found=1 }
        found && /"url":.*assets/ { match($0, /assets\/[0-9]+/); print substr($0, RSTART+7, RLENGTH-7); exit }
    ' /tmp/lazyapi-release.json)
    rm -f /tmp/lazyapi-release.json

    if [ -z "$ASSET_ID" ]; then
        echo "Error: could not find ${BINARY} in latest release" >&2
        exit 1
    fi

    curl -fsSL \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/octet-stream" \
        "https://api.github.com/repos/${REPO}/releases/assets/${ASSET_ID}" \
        -o "${INSTALL_DIR}/lazyapi"
else
    DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${BINARY}"
    curl -fsSL "$DOWNLOAD_URL" -o "${INSTALL_DIR}/lazyapi"
fi

chmod +x "${INSTALL_DIR}/lazyapi"
echo "Installed lazyapi to ${INSTALL_DIR}/lazyapi"

# Add install dir to PATH if not already present
case ":$PATH:" in
    *":${INSTALL_DIR}:"*) ;;
    *)
        EXPORT_LINE="export PATH=\"${INSTALL_DIR}:\$PATH\""
        SHELL_NAME="$(basename "$SHELL")"
        case "$SHELL_NAME" in
            zsh)  PROFILE="$HOME/.zshrc" ;;
            bash)
                if [ -f "$HOME/.bashrc" ]; then
                    PROFILE="$HOME/.bashrc"
                else
                    PROFILE="$HOME/.bash_profile"
                fi
                ;;
            *)    PROFILE="$HOME/.profile" ;;
        esac

        echo "" >> "$PROFILE"
        echo "$EXPORT_LINE" >> "$PROFILE"
        echo "Added ${INSTALL_DIR} to PATH in ${PROFILE}"
        echo "Restart your shell or run: source ${PROFILE}"
        ;;
esac
