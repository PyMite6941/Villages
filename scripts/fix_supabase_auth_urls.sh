#!/usr/bin/env bash
# Fix the Villages magic-link "localhost won't connect" bug.
#
# Root cause: the hosted Supabase project's Site URL was left at the dev default
# (http://localhost:5173), so every emailed magic link redirects to localhost on
# all devices. This sets the production Site URL and the redirect allowlist via the
# Supabase Management API. The frontend code is already correct.
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=sbp_xxx ./scripts/fix_supabase_auth_urls.sh
#
# Get a Personal Access Token at: https://supabase.com/dashboard/account/tokens

set -euo pipefail

PROJECT_REF="ooarycauxwefmxdlpxvc"
SITE_URL="https://villages-eight.vercel.app"
ALLOW_LIST="https://villages-eight.vercel.app/**,http://localhost:5173/**"

: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN (sbp_...) first}"

echo "Current auth URL config:"
curl -s "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  | grep -oE '"(site_url|uri_allow_list)"[^,}]*' || true

echo
echo "Applying new config..."
curl -s -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"site_url\":\"${SITE_URL}\",\"uri_allow_list\":\"${ALLOW_LIST}\"}" \
  | grep -oE '"(site_url|uri_allow_list)"[^,}]*' || true

echo
echo "Done. Send yourself a fresh magic link and open it on any device."
