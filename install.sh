#!/bin/sh
set -e

REPO="jourdanhaines/lazyapi"
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

DOWNLOAD_URL="https://github.com/${REPO}/releases/latest/download/${BINARY}.gz"
TMPGZ="$(mktemp)"
TMPFILE="$(mktemp)"
curl -f#L "$DOWNLOAD_URL" -o "$TMPGZ"
gunzip -c "$TMPGZ" > "$TMPFILE"
rm -f "$TMPGZ"
chmod +x "$TMPFILE"
mv -f "$TMPFILE" "${INSTALL_DIR}/lazyapi"
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
