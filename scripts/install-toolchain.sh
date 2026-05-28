#!/usr/bin/env bash
# Dev toolchain for Co-Working-Ghost-System (run with sudo where noted).
set -euo pipefail

echo "==> Rust (user install, no sudo)"
if ! command -v rustc &>/dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
fi
# shellcheck source=/dev/null
source "$HOME/.cargo/env"
cargo install sqlx-cli --no-default-features --features postgres 2>/dev/null || true

echo "==> Docker, Java 17, Maven, python3-venv (requires sudo)"
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  docker.io docker-compose-plugin \
  openjdk-17-jdk maven \
  python3-venv

echo "==> Add user to docker group (log out/in after)"
sudo usermod -aG docker "$USER" || true

echo "==> users-service Python venv"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/services/users-service"
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

echo "Done. Verify: rustc --version && docker --version && java -version && mvn -version"
