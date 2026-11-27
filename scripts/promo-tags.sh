#!/usr/bin/env bash
# Tags promo-AAAA-MM-DD das promoções dev -> master (#422).
#
# Cada merge de promoção no master (PR vindo de `dev` ou `release/*`) ganha
# uma tag anotada no commit de `dev` que foi para o ar (o 2º pai do merge).
# Idempotente: pula promoção que já tem tag promo-* no mesmo commit. Duas
# promoções no mesmo dia viram promo-DATA, promo-DATA-2, promo-DATA-3...
# A data é a do merge no fuso da loja (Boa Vista).
#
# Uso: scripts/promo-tags.sh [desde AAAA-MM-DD]   (DRY_RUN=1 só mostra)
set -euo pipefail

SINCE="${1:-2026-07-14}"
TZ_LOJA="America/Boa_Vista"
created=0
dry_tags=()

while read -r merge; do
  dev_commit=$(git rev-parse "$merge^2")
  if git tag --points-at "$dev_commit" | grep -q '^promo-'; then
    continue
  fi
  day=$(TZ="$TZ_LOJA" git log -1 --date=format-local:%Y-%m-%d --format=%cd "$merge")
  name="promo-$day"
  n=1
  while git rev-parse -q --verify "refs/tags/$name" >/dev/null; do
    n=$((n + 1))
    name="promo-$day-$n"
  done
  title=$(git log -1 --format=%s "$merge")
  if [ "${DRY_RUN:-}" = "1" ]; then
    echo "criaria $name -> ${dev_commit:0:7} ($title)"
    # Reserva o nome no ensaio, para a próxima do mesmo dia ganhar -2.
    git tag "$name" "$dev_commit" && dry_tags+=("$name")
  else
    git tag -a "$name" "$dev_commit" -m "Promoção dev -> master: $title"
    echo "criada $name -> ${dev_commit:0:7} ($title)"
  fi
  created=$((created + 1))
done < <(git log origin/master --first-parent --merges --reverse \
  --since="$SINCE" --format='%H %s' \
  | grep -E ' Merge pull request #[0-9]+ from [^ ]+/(dev|release/.+)$' \
  | cut -d' ' -f1)

if [ "${DRY_RUN:-}" = "1" ] && [ "${#dry_tags[@]}" -gt 0 ]; then
  git tag -d "${dry_tags[@]}" >/dev/null
fi
echo "$created tag(s)"
