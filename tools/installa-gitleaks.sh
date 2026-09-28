#!/bin/sh
# Installa gitleaks (lo scanner dei segreti usato dal pre-commit) in .tools/gitleaks, nella versione
# fissata qui sotto, verificando l'archivio con lo SHA-256 ufficiale prima di estrarlo.
#
# Uso:  sh tools/installa-gitleaks.sh
#
# Per aggiornare gitleaks: cambia VERSIONE e i quattro SHA-256 copiandoli dal file
# gitleaks_<versione>_checksums.txt della release ufficiale
# (https://github.com/gitleaks/gitleaks/releases), e aggiorna ALLO STESSO MODO
# .github/workflows/segreti.yml e .githooks/pre-commit.
set -eu

VERSIONE=8.30.1

# SHA-256 ufficiali (gitleaks_8.30.1_checksums.txt)
SHA_LINUX_X64=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb
SHA_LINUX_ARM64=e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080
SHA_DARWIN_X64=dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709
SHA_DARWIN_ARM64=b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5

case "$(uname -s)" in
  Linux) os=linux ;;
  Darwin) os=darwin ;;
  *) echo "Sistema non supportato da questo script: $(uname -s)" >&2; exit 1 ;;
esac
case "$(uname -m)" in
  x86_64 | amd64) arch=x64 ;;
  arm64 | aarch64) arch=arm64 ;;
  *) echo "Architettura non supportata da questo script: $(uname -m)" >&2; exit 1 ;;
esac

case "$os-$arch" in
  linux-x64) atteso=$SHA_LINUX_X64 ;;
  linux-arm64) atteso=$SHA_LINUX_ARM64 ;;
  darwin-x64) atteso=$SHA_DARWIN_X64 ;;
  darwin-arm64) atteso=$SHA_DARWIN_ARM64 ;;
esac

radice=$(git rev-parse --show-toplevel)
archivio="gitleaks_${VERSIONE}_${os}_${arch}.tar.gz"
url="https://github.com/gitleaks/gitleaks/releases/download/v${VERSIONE}/${archivio}"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "Scarico $archivio…"
curl -sSfL -o "$tmp/$archivio" "$url"

if command -v sha256sum >/dev/null 2>&1; then
  calcolato=$(sha256sum "$tmp/$archivio" | cut -d' ' -f1)
else
  calcolato=$(shasum -a 256 "$tmp/$archivio" | cut -d' ' -f1)
fi
if [ "$calcolato" != "$atteso" ]; then
  echo "ERRORE: lo SHA-256 dell'archivio non corrisponde a quello ufficiale. Non installo nulla." >&2
  echo "  atteso:    $atteso" >&2
  echo "  calcolato: $calcolato" >&2
  exit 1
fi
echo "SHA-256 verificato."

tar -xzf "$tmp/$archivio" -C "$tmp" gitleaks
mkdir -p "$radice/.tools"
mv "$tmp/gitleaks" "$radice/.tools/gitleaks"
chmod 755 "$radice/.tools/gitleaks"
echo "Installato: $("$radice/.tools/gitleaks" version) in .tools/gitleaks"
