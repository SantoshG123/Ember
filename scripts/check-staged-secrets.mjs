import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"

// Checks the exact staged blobs. Findings never include credential values.
// This is a safety net, not a replacement for reviewing the staged diff.
const git = (...args) => execFileSync("git", args, { maxBuffer: 20 * 1024 * 1024 })
const files = git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z").toString().split("\0").filter(Boolean)
const findings = []
const rules = [
  ["GitHub credential", /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})/],
  ["Stripe secret", /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/],
  ["API credential", /\b(?:sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}|AIza[A-Za-z0-9_-]{30,})/],
  ["Slack credential", /\bxox[baprs]-[A-Za-z0-9-]{20,}/],
  ["Private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ["Signed or credential-bearing URL", /[?&](?:X-Goog-Signature|X-Amz-Signature|access_token|token)=[A-Za-z0-9_%.-]{12,}/i],
]
const localSecrets = []
for (const path of [".env", ".env.local", "apps/backend/.env", "apps/storefront/.env.local", ".local/postgres/.env"]) {
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/)
    if (!match || !/(?:SECRET|PASSWORD|TOKEN|API_KEY|DATABASE_URL)/.test(match[1])) continue
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2")
    if (value.length < 16 || /replace-with|generate-at-least|ember_local_only|change-before-sharing|^\$\{/.test(value)) continue
    localSecrets.push(value)
    if (match[1] === "DATABASE_URL") {
      try { const password = decodeURIComponent(new URL(value).password); if (password.length >= 16) localSecrets.push(password) } catch { /* Non-URL placeholders are ignored. */ }
    }
  }
}
for (const file of files) {
  const envFile = /(?:^|\/)\.env(?:\.|$)/.test(file)
  const template = /\.env(?:\..+)?\.(?:example|template)$/.test(file)
  if ((envFile && !template) || /(?:^|\/)(?:node_modules|\.next|\.medusa|\.local|\.cache|\.codex|\.agents)\//.test(file) || /\.(?:pem|key|p12|pfx|dump|backup|sqlite3?|db|pgdump)$/.test(file)) {
    findings.push({ file, reason: "Sensitive or generated file path" })
  }
  const buffer = git("show", `:${file}`)
  if (buffer.includes(0)) continue
  const content = buffer.toString("utf8")
  for (const [reason, pattern] of rules) {
    if (pattern.test(content)) findings.push({ file, reason })
  }
  if (localSecrets.some(secret => content.includes(secret))) findings.push({ file, reason: "Matches a private local environment value" })
}
if (findings.length) {
  console.error(JSON.stringify({ status: "blocked", findings }, null, 2))
  process.exitCode = 1
} else {
  console.log(`PASS: ${files.length} staged files checked; no blocked paths, recognized credential patterns, or matching local secret values found.`)
}
