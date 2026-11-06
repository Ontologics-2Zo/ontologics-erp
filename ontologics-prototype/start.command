#!/bin/zsh
set -e
cd -- "$(dirname -- "$0")"
if ! command -v npm >/dev/null 2>&1; then
  echo 'Node.js 22.12 이상을 설치한 뒤 다시 실행해 주세요.'
  read '?Enter를 누르면 닫힙니다.'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci
fi
npm run dev -- --open
