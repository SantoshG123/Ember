# Isolated local PostgreSQL

EMBER can use the installed PostgreSQL 18 binaries without Docker or changes to the Windows PostgreSQL service. This is a development database, not a production deployment.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-database.ps1 start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-database.ps1 status
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-database.ps1 stop
```

The script uses `C:\Program Files\PostgreSQL\18\bin`; override `-PostgresBin` if necessary. It binds only to `127.0.0.1:55432` and refuses to start if another process owns that port. It never modifies the system service, port 5432, or another cluster. PostgreSQL needs to create its own restricted Windows child process; if a coding sandbox prevents this, run the helper in a normal PowerShell session.

## Data and credentials

- Persistent data: `%LOCALAPPDATA%\EMBER\postgres\data`
- Local secrets: `%LOCALAPPDATA%\EMBER\postgres\.env`
- Server log: `%LOCALAPPDATA%\EMBER\postgres\postgres.log`
- Database: `ember`; application role: `ember` (not a superuser)

The runtime is outside the OneDrive-synced repository. Initialization generates independent random administrator and application passwords, enables SCRAM authentication, and restricts the runtime directory to the current Windows account and SYSTEM. Never commit, paste, or share the secret file. If an earlier setup generated `.local/postgres/.env`, the helper preserves its credentials by copying them privately; the ignored original is not deleted automatically.

Copy only `DATABASE_URL` from this local secret file into the ignored `apps/backend/.env` when configuring Medusa. Keep other backend configuration intact; do not copy the administrator password into the application environment.

To configure both local applications automatically:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/local-database.ps1 start -ConfigureApps
```

This merges the isolated database URL into `apps/backend/.env`, selects Medusa data in `apps/storefront/.env.local`, and assigns the same generated server-only `EMBER_LOCAL_API_KEY` to both. It enables `EMBER_LOCAL_DATA_ACCESS=true` for the development actor bridge, points server requests to `http://127.0.0.1:9000`, and disables the Medusa admin UI for this headless local runtime. Missing JWT/cookie secrets are generated. Existing unrelated settings, including Redis and Stripe, are preserved. A different non-template database URL or mismatched existing local keys causes the helper to stop instead of replacing them.

Keep these generated app env files private as well: `.gitignore` does not prevent cloud-sync software from syncing them. Local actor access is a development-only bridge, not production authentication; never expose this configuration publicly. Leave `NODE_ENV` in development when running the local servers, and restart them after configuration changes.

`start` is idempotent; `stop` performs a clean shutdown and preserves all data. There is intentionally no reset or deletion command. A successful `start` or running `status` verifies authenticated `SELECT 1` using the application role. Medusa migrations must be run separately after configuring the backend environment.

This helper does not register automatic startup. Run `start` again after restarting Windows. Do not move, rename, sync between computers, or back up the live data directory while PostgreSQL is running. For backups use PostgreSQL tools, or stop the cluster first.
