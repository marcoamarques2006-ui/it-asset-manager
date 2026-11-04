#!/usr/bin/env bash
# Calcula a próxima versão SemVer (X.Y.Z, sem o "v") a partir da última
# tag vX.Y.Z e dos commits que entraram na main desde ela.
#
# Na main cada commit é o squash de um PR, e o título do PR já é validado
# como Conventional Commits (pr-title-lint.yml) — então o tipo do commit
# decide o incremento:
#   tipo!: ... ou "BREAKING CHANGE:" no corpo  -> MAJOR
#   feat: ...                                    -> MINOR
#   qualquer outro (fix, docs, ci, chore, ...)   -> PATCH
# Vale o maior incremento entre os commits do intervalo.
#
# Se HEAD já tem uma tag de versão (re-run do pipeline no mesmo commit),
# devolve essa mesma versão em vez de gerar outra.
#
# Uso: scripts/next-version.sh   (precisa do histórico e das tags: fetch-depth 0)
set -euo pipefail

tag_pattern='v[0-9]*.[0-9]*.[0-9]*'

existing=$(git tag --points-at HEAD --list "$tag_pattern" --sort=-v:refname | head -n1)
if [[ -n "$existing" ]]; then
  echo "${existing#v}"
  exit 0
fi

last=$(git tag --merged HEAD --list "$tag_pattern" --sort=-v:refname | head -n1)
if [[ -n "$last" ]]; then
  range="$last..HEAD"
  base="${last#v}"
else
  range="HEAD"
  base="0.0.0"
fi

IFS=. read -r major minor patch <<<"$base"

re_breaking='^[a-z]+(\([^)]*\))?!:'
re_feat='^feat(\([^)]*\))?:'

bump="patch"
while IFS= read -r subject; do
  if [[ "$subject" =~ $re_breaking ]]; then
    bump="major"
    break
  elif [[ "$subject" =~ $re_feat ]]; then
    bump="minor"
  fi
done < <(git log --format=%s "$range")

if [[ "$bump" != "major" ]] && git log --format=%b "$range" | grep -qE '^BREAKING[ -]CHANGE:'; then
  bump="major"
fi

case "$bump" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac

echo "$major.$minor.$patch"
