#!/bin/bash

set -eu

# How do I get the directory where a Bash script is located from within the script itself?
# https://stackoverflow.com/questions/59895/how-do-i-get-the-directory-where-a-bash-script-is-located-from-within-the-script
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
PROJECT_ROOT=${SCRIPT_DIR}/..
cd ${PROJECT_ROOT}

# linuxかどうかを確認
if [[ "$(uname)" != "Linux" ]]; then
	echo "Error: This script is only for linux"
	exit 1
fi

# Rustビルドキャッシュを削除
cd ${PROJECT_ROOT}/src-tauri
cargo clean

# 依存関係インストール (再インストール)
cd ${PROJECT_ROOT}
rm -rf node_modules/*
npm install
