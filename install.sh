#!/bin/sh
set -eu
base="${LEFTOVER_INSPECTOR_INSTALL_DIR:-$HOME/.local/bin}"
mkdir -p "$base"
if [ -n "${1:-}" ]; then cp "$1" "$base/leftover-inspector"; else echo "Usage: install.sh /path/to/leftover-inspector" >&2; exit 2; fi
chmod 755 "$base/leftover-inspector"
echo "Installed to $base/leftover-inspector"
