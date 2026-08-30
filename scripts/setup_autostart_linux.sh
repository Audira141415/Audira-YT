#!/bin/bash
# ========================================================
#   AUDIRA YT MONITOR - LINUX MINI PC AUTO-START SETUP
# ========================================================
# Run this script on the Mini PC Server to ensure Docker
# and Audira-YT auto-start on system boot (after reboot/power outage).

echo "[*] Enabling Docker daemon auto-start on system boot..."
sudo systemctl enable docker
sudo systemctl start docker

echo "[*] Setting Docker containers restart policy to 'unless-stopped'..."
cd "$(dirname "$0")/.."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "[SUCCESS] Audira-YT Mini PC Server is now configured to automatically boot on system startup! 🚀"
