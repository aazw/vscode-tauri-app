#!/bin/bash

set -eu

# How do I get the directory where a Bash script is located from within the script itself?
# https://stackoverflow.com/questions/59895/how-do-i-get-the-directory-where-a-bash-script-is-located-from-within-the-script
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
cd ${SCRIPT_DIR}/..

# macOSかどうかを確認
if [[ "$(uname)" != "Darwin" ]]; then
	echo "Error: This script is only for macOS"
	exit 1
fi

# Rustビルドキャッシュを削除
cd src-tauri
cargo clean

# 依存関係インストール (再インストール)
rm -rf node_modules/*
npm install

# macOS向けにビルド
npm run tauri build -- --target aarch64-apple-darwin --no-bundle
