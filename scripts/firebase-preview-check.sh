#!/usr/bin/env bash
set -euo pipefail

if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI is not installed. Install with: npm install -g firebase-tools"
  exit 1
fi

if [ ! -f firebase.json ]; then
  echo "firebase.json not found. Initialize Firebase Hosting before preview."
  exit 1
fi

firebase hosting:channel:deploy preview --expires 7d
