#!/usr/bin/env bash
set -euo pipefail

# Exit 2 is the only code that blocks a tool call, so every error path must exit 2 (fail closed).
deny() {
  echo "Blocked: $1" >&2
  exit 2
}

# Secrets must live in Vault/SOPS/Secrets Manager, never in files the agent writes.
readonly SECRET_RE='^(\.env(\..*)?|.*\.(pem|key|p12|pfx|jks|tfvars|kubeconfig)|id_(rsa|dsa|ecdsa|ed25519)|credentials(\.json)?|secrets\.json|\.npmrc|\.netrc|\.pgpass|terraform\.tfstate(\.backup)?)$'

is_secret() {
  local base="${1##*/}"
  [[ "${base,,}" =~ $SECRET_RE ]]
}

main() {
  command -v jq >/dev/null 2>&1 || deny "jq is required by the secret-file guard but was not found."

  local input
  input="$(cat)"
  jq -e . >/dev/null 2>&1 <<<"$input" || deny "hook received malformed JSON; refusing to proceed."

  local path command token
  path="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")"
  if [[ -n "$path" ]] && is_secret "$path"; then
    deny "refusing to write potential secrets file '$path'. Use Vault, SOPS, or AWS Secrets Manager."
  fi

  # Bash has no file_path; scan each shell word so redirects, cp, tee, etc. are covered.
  command="$(jq -r '.tool_input.command // empty' <<<"$input")"
  if [[ -n "$command" ]]; then
    while IFS= read -r token; do
      if [[ -n "$token" ]] && is_secret "$token"; then
        deny "command references potential secrets file '$token'. Use Vault, SOPS, or AWS Secrets Manager."
      fi
    done < <(tr -s ' \t\n;|&<>()"'"'"'`=' '\n' <<<"$command")
  fi
}

main
