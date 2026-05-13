#!/usr/bin/env bash
set -euo pipefail

if [ ! -f package.json ]; then
  echo "No package.json found. Nothing to run."
  exit 0
fi

if [ -f pnpm-lock.yaml ]; then PM="pnpm";
elif [ -f yarn.lock ]; then PM="yarn";
elif [ -f bun.lockb ] || [ -f bun.lock ]; then PM="bun";
else PM="npm"; fi

echo "Using package manager: $PM"

run_if_script_exists() {
  local script="$1"
  if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$script'] ? 0 : 1)"; then
    echo "Running $PM run $script"
    $PM run "$script"
  else
    echo "Skipping missing script: $script"
  fi
}

run_if_script_exists lint
run_if_script_exists typecheck
run_if_script_exists test
run_if_script_exists build
