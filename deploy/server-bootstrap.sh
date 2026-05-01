#!/usr/bin/env bash
set -euo pipefail

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ca-certificates \
  curl \
  docker-compose \
  docker.io \
  git \
  nginx

install -d -m 0755 /opt/daniu
install -d -m 0755 /etc/daniu
install -d -m 0755 -o 1001 -g 1001 /data/daniu

systemctl enable --now docker
systemctl enable --now nginx
