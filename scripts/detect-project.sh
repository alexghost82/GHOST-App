#!/usr/bin/env bash
set -euo pipefail

echo "== Project detection =="

if [ -f pnpm-lock.yaml ]; then echo "package_manager=pnpm"; fi
if [ -f package-lock.json ]; then echo "package_manager=npm"; fi
if [ -f yarn.lock ]; then echo "package_manager=yarn"; fi
if [ -f bun.lockb ] || [ -f bun.lock ]; then echo "package_manager=bun"; fi

if [ -f package.json ]; then
  echo "package.json found"
  node -e "const p=require('./package.json'); console.log('scripts=', Object.keys(p.scripts||{}).join(',')); console.log('deps=', Object.keys({...p.dependencies,...p.devDependencies}).filter(x=>['next','react','vue','nuxt','@angular/core','svelte','vite','astro','firebase'].includes(x)).join(','))"
else
  echo "package.json not found"
fi

[ -f firebase.json ] && echo "firebase.json found"
[ -f .firebaserc ] && echo ".firebaserc found"
[ -f firestore.rules ] && echo "firestore.rules found"
[ -f storage.rules ] && echo "storage.rules found"
