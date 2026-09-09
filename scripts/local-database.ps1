param(
  [ValidateSet('start', 'status', 'stop')]
  [string]$Action = 'status',
  [string]$PostgresBin = 'C:\Program Files\PostgreSQL\18\bin',
  [switch]$ConfigureApps
)

# An isolated, password-authenticated development cluster. Never operates on a
# Windows service or an existing system PostgreSQL installation's data directory.
$ErrorActionPreference = 'Stop'
$WorkspaceRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$LocalRuntimeParent = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'EMBER'))
$RuntimeRoot = Join-Path $LocalRuntimeParent 'postgres'
$LegacyCredentialsPath = Join-Path $WorkspaceRoot '.local\postgres\.env'
$DataPath = Join-Path $RuntimeRoot 'data'
$CredentialsPath = Join-Path $RuntimeRoot '.env'
$LogPath = Join-Path $RuntimeRoot 'postgres.log'
$Port = 55432
$Database = 'ember'
$AppUser = 'ember'
$AdminUser = 'ember_local_admin'
$PgCtl = Join-Path $PostgresBin 'pg_ctl.exe'
$InitDb = Join-Path $PostgresBin 'initdb.exe'
$Psql = Join-Path $PostgresBin 'psql.exe'

foreach ($Executable in @($PgCtl, $InitDb, $Psql)) {
  if (-not (Test-Path -LiteralPath $Executable -PathType Leaf)) {
    throw "PostgreSQL executable not found: $Executable"
  }
}
if ($RuntimeRoot -ne (Join-Path $LocalRuntimeParent 'postgres')) {
  throw 'The database runtime must remain in the dedicated local EMBER directory.'
}
foreach ($CheckedPath in @($LocalRuntimeParent, $RuntimeRoot, $DataPath)) {
  if ((Test-Path -LiteralPath $CheckedPath) -and ((Get-Item -LiteralPath $CheckedPath).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
    throw 'Refusing to use a linked or cloud-synced database runtime directory.'
  }
}

function Test-ClusterRunning {
  if (-not (Test-Path -LiteralPath (Join-Path $DataPath 'PG_VERSION'))) { return $false }
  & $PgCtl status -D $DataPath *> $null
  return $LASTEXITCODE -eq 0
}

function New-LocalPassword {
  $RandomBytes = New-Object byte[] 32
  $Generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $Generator.GetBytes($RandomBytes) } finally { $Generator.Dispose() }
  return [Convert]::ToBase64String($RandomBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function Read-Credentials {
  if (-not (Test-Path -LiteralPath $CredentialsPath -PathType Leaf)) {
    throw 'Local database credentials are missing. Do not reinitialize an existing cluster.'
  }
  $Values = @{}
  foreach ($Line in Get-Content -LiteralPath $CredentialsPath) {
    if ($Line -match '^([A-Z_]+)=(.*)$') { $Values[$Matches[1]] = $Matches[2] }
  }
  if (-not $Values.DATABASE_URL -or -not $Values.PG_ADMIN_PASSWORD) {
    throw 'Local database credentials are incomplete.'
  }
  return $Values
}

function Invoke-DatabaseQuery {
  param([string]$User, [string]$Password, [string]$DatabaseName, [string]$Sql)
  $ProcessInfo = New-Object Diagnostics.ProcessStartInfo
  $ProcessInfo.FileName = $Psql
  $ProcessInfo.Arguments = "-X -w -q -t -A -v ON_ERROR_STOP=1 -h 127.0.0.1 -p $Port -U $User -d $DatabaseName"
  $ProcessInfo.UseShellExecute = $false
  $ProcessInfo.CreateNoWindow = $true
  $ProcessInfo.RedirectStandardInput = $true
  $ProcessInfo.RedirectStandardOutput = $true
  $ProcessInfo.RedirectStandardError = $true
  $ProcessInfo.EnvironmentVariables['PGPASSWORD'] = $Password
  $QueryProcess = New-Object Diagnostics.Process
  $QueryProcess.StartInfo = $ProcessInfo
  try {
    [void]$QueryProcess.Start()
    $OutputTask = $QueryProcess.StandardOutput.ReadToEndAsync()
    $ErrorTask = $QueryProcess.StandardError.ReadToEndAsync()
    $QueryProcess.StandardInput.WriteLine($Sql)
    $QueryProcess.StandardInput.Close()
    if (-not $QueryProcess.WaitForExit(30000)) {
      $QueryProcess.Kill()
      throw 'The local database query timed out.'
    }
    $QueryOutput = $OutputTask.GetAwaiter().GetResult()
    [void]$ErrorTask.GetAwaiter().GetResult()
    # SQL can contain credentials, so never echo SQL or PostgreSQL error text.
    if ($QueryProcess.ExitCode -ne 0) { throw "Local database query failed (exit $($QueryProcess.ExitCode))." }
    return $QueryOutput.Trim()
  } finally { $QueryProcess.Dispose() }
}

function Read-LocalEnv {
  param([string]$Path)
  $Values = @{}
  if (Test-Path -LiteralPath $Path -PathType Leaf) {
    foreach ($Line in Get-Content -LiteralPath $Path) {
      if ($Line -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') {
        $Value = $Matches[2].Trim()
        if ($Value.Length -ge 2 -and (($Value.StartsWith('"') -and $Value.EndsWith('"')) -or ($Value.StartsWith("'") -and $Value.EndsWith("'")))) {
          $Value = $Value.Substring(1, $Value.Length - 2)
        }
        $Values[$Matches[1]] = $Value
      }
    }
  }
  return $Values
}

function Merge-LocalEnv {
  param([string]$Path, [Collections.IDictionary]$Updates)
  $Lines = New-Object 'Collections.Generic.List[string]'
  if (Test-Path -LiteralPath $Path -PathType Leaf) {
    foreach ($Line in [IO.File]::ReadAllLines($Path)) { $Lines.Add($Line) }
  }
  foreach ($Key in $Updates.Keys) {
    $Found = $false
    for ($Index = 0; $Index -lt $Lines.Count; $Index++) {
      if ($Lines[$Index] -match ('^\s*' + [Regex]::Escape($Key) + '\s*=')) {
        $Lines[$Index] = $Key + '=' + $Updates[$Key]
        $Found = $true
      }
    }
    if (-not $Found) { $Lines.Add($Key + '=' + $Updates[$Key]) }
  }
  [IO.File]::WriteAllLines($Path, $Lines, (New-Object Text.UTF8Encoding($false)))
}

function Set-LocalAppConfiguration {
  param([string]$DatabaseUrl)
  $BackendEnvPath = Join-Path $WorkspaceRoot 'apps\backend\.env'
  $StorefrontEnvPath = Join-Path $WorkspaceRoot 'apps\storefront\.env.local'
  $BackendEnv = Read-LocalEnv $BackendEnvPath
  $StorefrontEnv = Read-LocalEnv $StorefrontEnvPath
  if ($BackendEnv.DATABASE_URL -and $BackendEnv.DATABASE_URL -ne $DatabaseUrl) {
    throw 'A different backend DATABASE_URL is configured. Refusing to overwrite it; inspect the environment locally.'
  }
  $LocalKey = $BackendEnv.EMBER_LOCAL_API_KEY
  if (-not $LocalKey) { $LocalKey = $StorefrontEnv.EMBER_LOCAL_API_KEY }
  if (-not $LocalKey) { $LocalKey = New-LocalPassword }
  if ($LocalKey.Length -lt 32) { throw 'An existing local API key is too short. Update it explicitly before configuring apps.' }
  if ($BackendEnv.EMBER_LOCAL_API_KEY -and $StorefrontEnv.EMBER_LOCAL_API_KEY -and $BackendEnv.EMBER_LOCAL_API_KEY -ne $StorefrontEnv.EMBER_LOCAL_API_KEY) {
    throw 'Backend and storefront local keys differ. Resolve the mismatch locally; no configuration was changed.'
  }
  $BackendUpdates = [ordered]@{
    DATABASE_URL = $DatabaseUrl
    EMBER_LOCAL_API_KEY = $LocalKey
    EMBER_LOCAL_DATA_ACCESS = 'true'
    DISABLE_MEDUSA_ADMIN = 'true'
    MEDUSA_BACKEND_URL = 'http://127.0.0.1:9000'
  }
  foreach ($SecretName in @('JWT_SECRET', 'COOKIE_SECRET')) {
    if (-not $BackendEnv[$SecretName] -or $BackendEnv[$SecretName] -like 'replace-*' -or $BackendEnv[$SecretName] -like 'ember-local-*-change-before-sharing') {
      $BackendUpdates[$SecretName] = New-LocalPassword
    }
  }
  $StorefrontUpdates = [ordered]@{
    EMBER_DATA_MODE = 'medusa'
    EMBER_LOCAL_DATA_ACCESS = 'true'
    EMBER_LOCAL_API_KEY = $LocalKey
    MEDUSA_BACKEND_URL = 'http://127.0.0.1:9000'
  }
  # Do not touch existing Redis/Stripe values or other unrelated configuration.
  Merge-LocalEnv -Path $BackendEnvPath -Updates $BackendUpdates
  Merge-LocalEnv -Path $StorefrontEnvPath -Updates $StorefrontUpdates
  Write-Output 'Configured ignored apps/backend/.env and apps/storefront/.env.local for local Medusa data; existing unrelated keys were preserved.'
  Write-Output 'The shared local access key is server-only. Never expose these development settings publicly.'
}

if ($ConfigureApps -and $Action -ne 'start') { throw '-ConfigureApps must be used with start.' }

if ($Action -eq 'status') {
  if (Test-ClusterRunning) {
    $Credentials = Read-Credentials
    $AppPassword = ([Uri]$Credentials.DATABASE_URL).UserInfo.Split(':', 2)[1]
    $Check = Invoke-DatabaseQuery -User $AppUser -Password $AppPassword -DatabaseName $Database -Sql 'SELECT 1;'
    if ($Check -ne '1') { throw 'The database health check did not return 1.' }
    Write-Output "EMBER PostgreSQL is running at 127.0.0.1:$Port/$Database; authenticated SELECT 1 passed."
  } else {
    Write-Output 'EMBER PostgreSQL is stopped or has not been initialized.'
  }
  exit 0
}

if ($Action -eq 'stop') {
  if (Test-ClusterRunning) {
    & $PgCtl stop -D $DataPath -m fast -w -t 30
    if ($LASTEXITCODE -ne 0) { throw 'Unable to stop the isolated EMBER PostgreSQL cluster.' }
    Write-Output 'EMBER PostgreSQL stopped. All database files and credentials are preserved.'
  } else {
    Write-Output 'EMBER PostgreSQL is already stopped. No data was changed.'
  }
  exit 0
}

if (-not (Test-Path -LiteralPath $RuntimeRoot)) {
  [void](New-Item -ItemType Directory -Path $RuntimeRoot -Force)
}
# Credentials and data inherit access only for the current Windows account and SYSTEM.
# icacls changes the DACL only; Set-Acl can request unavailable audit privileges.
$AccountSid = [Security.Principal.WindowsIdentity]::GetCurrent().User
$AllowedSids = @($AccountSid.Value, 'S-1-5-18')
& icacls.exe $RuntimeRoot /inheritance:r /grant:r ('*' + $AccountSid.Value + ':(OI)(CI)F') '*S-1-5-18:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Unable to secure the local database directory.' }
foreach ($Rule in (Get-Acl -LiteralPath $RuntimeRoot).Access) {
  $RuleSid = $Rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value
  if ($Rule.AccessControlType -eq 'Allow' -and $RuleSid -notin $AllowedSids) {
    & icacls.exe $RuntimeRoot /remove:g ('*' + $RuleSid) | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Unable to restrict the local database directory.' }
  }
}

if (-not (Test-Path -LiteralPath $CredentialsPath)) {
  if (Test-Path -LiteralPath (Join-Path $DataPath 'PG_VERSION')) {
    throw 'Existing database credentials are missing. Refusing to replace them or reinitialize data.'
  }
  if (Test-Path -LiteralPath $LegacyCredentialsPath -PathType Leaf) {
    # Preserve a credential file from earlier workspace-only setup attempts.
    # It is copied without logging and is deliberately not deleted here.
    [IO.File]::WriteAllText($CredentialsPath, [IO.File]::ReadAllText($LegacyCredentialsPath), (New-Object Text.UTF8Encoding($false)))
  } else {
    $AdminPassword = New-LocalPassword
    $AppPassword = New-LocalPassword
    $CredentialLines = @(
      '# Local-only secrets. Never commit or share this file.'
      "DATABASE_URL=postgres://${AppUser}:${AppPassword}@127.0.0.1:${Port}/${Database}"
      "PG_ADMIN_PASSWORD=$AdminPassword"
    )
    [IO.File]::WriteAllLines($CredentialsPath, $CredentialLines, (New-Object Text.UTF8Encoding($false)))
  }
}
$Credentials = Read-Credentials
$AdminPassword = $Credentials.PG_ADMIN_PASSWORD
$AppPassword = ([Uri]$Credentials.DATABASE_URL).UserInfo.Split(':', 2)[1]

if (-not (Test-Path -LiteralPath (Join-Path $DataPath 'PG_VERSION'))) {
  if ((Test-Path -LiteralPath $DataPath) -and (Get-ChildItem -LiteralPath $DataPath -Force | Select-Object -First 1)) {
    throw 'Data directory is nonempty but not initialized. Inspect it manually; this script never deletes data.'
  }
  $PasswordPath = Join-Path $RuntimeRoot 'init-password.tmp'
  try {
    [IO.File]::WriteAllText($PasswordPath, $AdminPassword, (New-Object Text.UTF8Encoding($false)))
    & $InitDb -D $DataPath -U $AdminUser --pwfile=$PasswordPath --auth-host=scram-sha-256 --auth-local=scram-sha-256 --encoding=UTF8 --locale=C --no-instructions -c 'listen_addresses=127.0.0.1' -c "port=$Port" -c 'password_encryption=scram-sha-256'
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL initialization failed. Existing files are preserved for inspection.' }
  } finally {
    if (Test-Path -LiteralPath $PasswordPath) { Remove-Item -LiteralPath $PasswordPath -Force }
  }
}

if (-not (Test-ClusterRunning)) {
  $Probe = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Loopback, $Port)
  try { $Probe.Start() } catch { throw "Port $Port is already in use. No existing PostgreSQL service was changed." } finally { $Probe.Stop() }
  $StartArguments = @('start', '-D', ('"' + $DataPath + '"'), '-l', ('"' + $LogPath + '"'), '-w', '-t', '30')
  $StartProcess = Start-Process -FilePath $PgCtl -ArgumentList $StartArguments -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $RuntimeRoot 'startup.log') -RedirectStandardError (Join-Path $RuntimeRoot 'startup-error.log')
  # PowerShell Start-Process -Wait also waits for descendants (the database).
  # Wait only for pg_ctl, whose own -w option verifies server readiness.
  if (-not $StartProcess.WaitForExit(35000)) { throw 'PostgreSQL startup did not complete within 35 seconds.' }
  $StartProcess.Dispose()
  if (-not (Test-ClusterRunning)) { throw "PostgreSQL could not start. Inspect $LogPath locally." }
}

$RoleExists = Invoke-DatabaseQuery -User $AdminUser -Password $AdminPassword -DatabaseName 'postgres' -Sql "SELECT 1 FROM pg_roles WHERE rolname = '$AppUser';"
if ($RoleExists -ne '1') {
  [void](Invoke-DatabaseQuery -User $AdminUser -Password $AdminPassword -DatabaseName 'postgres' -Sql "CREATE ROLE $AppUser LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '$AppPassword';")
}
$DatabaseExists = Invoke-DatabaseQuery -User $AdminUser -Password $AdminPassword -DatabaseName 'postgres' -Sql "SELECT 1 FROM pg_database WHERE datname = '$Database';"
if ($DatabaseExists -ne '1') {
  [void](Invoke-DatabaseQuery -User $AdminUser -Password $AdminPassword -DatabaseName 'postgres' -Sql "CREATE DATABASE $Database OWNER $AppUser;")
}
$Check = Invoke-DatabaseQuery -User $AppUser -Password $AppPassword -DatabaseName $Database -Sql 'SELECT 1;'
if ($Check -ne '1') { throw 'The database health check did not return 1.' }
Write-Output "EMBER PostgreSQL is ready at 127.0.0.1:$Port/$Database; authenticated SELECT 1 passed."
Write-Output "Credentials: $CredentialsPath (outside the repository; access restricted to your Windows account and SYSTEM)."
if ($ConfigureApps) { Set-LocalAppConfiguration -DatabaseUrl $Credentials.DATABASE_URL }
