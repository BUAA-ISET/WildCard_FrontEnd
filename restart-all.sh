#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PS_SCRIPT="$(cygpath -w "$SCRIPT_DIR/restart-all.ps1")"

powershell.exe -ExecutionPolicy Bypass -File "$PS_SCRIPT" "$@"
