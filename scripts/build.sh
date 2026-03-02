#!/bin/sh
set -e

# Stub optional devtools dependency (not needed in production builds)
mkdir -p node_modules/react-devtools-core
printf '{"name":"react-devtools-core","version":"0.0.0","main":"index.js"}\n' > node_modules/react-devtools-core/package.json
printf 'module.exports = { initialize() {}, connectToDevTools() {} };\n' > node_modules/react-devtools-core/index.js

TARGET=""
OUTFILE="lazyapi"

if [ -n "$1" ]; then
    TARGET="--target=$1"
fi

if [ -n "$2" ]; then
    OUTFILE="$2"
fi

bun build --compile $TARGET src/cli.tsx --outfile "$OUTFILE"
