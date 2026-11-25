#!/usr/bin/env bash
# Fail if obvious secrets are present in tracked files or the git diff.
# This guard is intentionally simple and deliberately paranoid.
set -euo pipefail

patterns=(
  'ghp_[A-Za-z0-9]{20,}'
  'github_pat_[A-Za-z0-9_]{20,}'
  'sk-[A-Za-z0-9]{20,}'
  'AKIA[0-9A-Z]{16}'
  '-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'
)

status=0
for pattern in "${patterns[@]}"; do
  if git grep -n -E "$pattern" -- . ':!*.woff2' ':!*.woff' ':!*.png' 2>/dev/null; then
    echo "SECRET GUARD: matched '$pattern' in tracked files" >&2
    status=1
  fi
done

# Staged diff (including newly added files).
staged=$(git diff --cached --no-color 2>/dev/null || true)
for pattern in "${patterns[@]}"; do
  if printf '%s' "$staged" | grep -qE "$pattern"; then
    echo "SECRET GUARD: matched '$pattern' in staged diff" >&2
    status=1
  fi
done

if [ "$status" -ne 0 ]; then
  echo "Refusing to push. Remove the secret and scrub history if it was committed." >&2
  exit 1
fi
echo "SECRET GUARD: clean"
