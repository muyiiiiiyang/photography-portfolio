param([switch]$NoBrowser)

$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $PSScriptRoot
$port = 3000
$url = "http://127.0.0.1:$port/admin/"
$logDir = Join-Path $project ".stash"
$logFile = Join-Path $logDir "open-studio.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-LauncherLog {
  param([string]$Message)
  Add-Content -Path $logFile -Value ("[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message)
}

function Test-StudioPort {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $task = $client.ConnectAsync("127.0.0.1", $port)
    if (-not $task.Wait(350)) { return $false }
    return $client.Connected
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

try {
  Write-LauncherLog "Shortcut opened. Project: $project"
  if (-not (Test-StudioPort)) {
    $pnpm = Join-Path $env:APPDATA "npm\pnpm.cmd"
    if (-not (Test-Path $pnpm)) {
      $found = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
      if ($found) { $pnpm = $found.Source }
    }
    if (-not (Test-Path $pnpm)) {
      throw "pnpm was not found. Install pnpm or add it to PATH."
    }

    Write-LauncherLog "Starting pnpm dev on 127.0.0.1:$port ..."
    $arguments = '/c ""{0}" dev --hostname 127.0.0.1 --port {1}"' -f $pnpm, $port
    Start-Process -FilePath "$env:SystemRoot\System32\cmd.exe" `
      -ArgumentList $arguments `
      -WorkingDirectory $project `
      -WindowStyle Minimized

    $ready = $false
    for ($attempt = 0; $attempt -lt 90; $attempt += 1) {
      Start-Sleep -Seconds 1
      if (Test-StudioPort) {
        $ready = $true
        break
      }
    }
    if (-not $ready) {
      throw "The local site did not start within 90 seconds. See $logFile"
    }
    Start-Sleep -Seconds 2
    Write-LauncherLog "Local site is listening."
  } else {
    Write-LauncherLog "Local site was already running."
  }

  if (-not $NoBrowser) {
    Start-Process $url
    Write-LauncherLog "Browser opened: $url"
  } else {
    Write-LauncherLog "Browser opening skipped (-NoBrowser)."
  }
} catch {
  Write-LauncherLog ("ERROR: " + $_.Exception.Message)
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.MessageBox]::Show(
    "Could not open the photography studio.`n`n$($_.Exception.Message)`n`nLog: $logFile",
    "Photography Studio",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Error
  ) | Out-Null
  exit 1
}
