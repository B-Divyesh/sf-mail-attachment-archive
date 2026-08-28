#!/bin/sh
set -eu

repo="B-Divyesh/sf-mail-attachment-archive"
manifest_url="https://github.com/$repo/releases/latest/download/latest.json"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT HUP INT TERM

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "python3 is required to read the signed release manifest" >&2; exit 1; }
curl -fsSL "$manifest_url" -o "$tmp_dir/latest.json"

case "$(uname -s)" in
  Darwin) if [ "$(uname -m)" = "x86_64" ]; then platform="macos_intel"; else platform="macos"; fi ;;
  Linux) platform="linux" ;;
  *) echo "This installer supports macOS and Linux. On Windows, use install.ps1." >&2; exit 1 ;;
esac

read_value() {
  python3 - "$tmp_dir/latest.json" "$platform" "$1" <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as handle:
    print(json.load(handle)["platforms"][sys.argv[2]][sys.argv[3]])
PY
}

url="$(read_value url)"
expected="$(read_value sha256)"
filename="$(read_value filename)"
curl -fL "$url" -o "$tmp_dir/$filename"

if command -v sha256sum >/dev/null 2>&1; then
  actual="$(sha256sum "$tmp_dir/$filename" | awk '{print $1}')"
else
  actual="$(shasum -a 256 "$tmp_dir/$filename" | awk '{print $1}')"
fi
[ "$actual" = "$expected" ] || { echo "Checksum verification failed; nothing was installed." >&2; exit 1; }

if [ "$platform" = "linux" ]; then
  install_dir="${XDG_BIN_HOME:-$HOME/.local/bin}"
  mkdir -p "$install_dir"
  install -m 755 "$tmp_dir/$filename" "$install_dir/mail-attachment-archive"
  echo "Installed verified AppImage to $install_dir/mail-attachment-archive"
  echo "Add $install_dir to PATH if it is not already present."
else
  destination="$HOME/Downloads/$filename"
  cp "$tmp_dir/$filename" "$destination"
  echo "Downloaded and verified $destination"
  echo "Opening the disk image. The app is unsigned: right-click the app and choose Open on first launch."
  open "$destination"
fi
