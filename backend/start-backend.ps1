# Start backend on this machine using the project's known-good Python (.venv-1).
# Usage: Open PowerShell as Administrator (to add a firewall rule) and run:
#   .\start-backend.ps1

# Configuration
$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonCandidates = @(
    "$backendDir\..\.venv-1\Scripts\python.exe",
    "$backendDir\venv\Scripts\python.exe",
    "python.exe"
)
$port = $env:PORT -as [int]
if (-not $port) { $port = 5000 }
# Use a different variable name to avoid clobbering PowerShell's built-in $Host
$bindHost = $env:FLASK_HOST
if (-not $bindHost) { $bindHost = "0.0.0.0" }

# Find a usable python
$py = $null
foreach ($p in $pythonCandidates) { if (Test-Path $p) { $py = $p; break } }
if (-not $py) { Write-Error "No python executable found in candidates: $($pythonCandidates -join ', ')"; exit 1 }
Write-Output "Using python: $py"

# Create firewall rule to allow inbound connections to the selected port (skip if exists)
$ruleName = "AI Chatbot Backend (port $port)"
try {
    if (-not (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow | Out-Null
        Write-Output "Created firewall rule: $ruleName"
    } else {
        Write-Output "Firewall rule already exists: $ruleName"
    }
} catch {
    Write-Warning "Could not create firewall rule (you may need to run as Administrator): $($_.Exception.Message)"
}

# Start the backend and write logs into backend.out.log/backend.err.log
$stdout = Join-Path $backendDir "backend.out.log"
$stderr = Join-Path $backendDir "backend.err.log"
Write-Output ("Starting backend in {0} on {1}:{2} (logs: {3}, {4})" -f $backendDir, $bindHost, $port, $stdout, $stderr)
# Pass host/port (and optional local-model flags) through environment when launching so the app binds correctly
# Set the environment variables in this process so child process inherits them (compatible with PowerShell 5.1)
$env:FLASK_HOST = $bindHost
$env:PORT = "$port"
if ($env:USE_LOCAL_MODEL) { $env:USE_LOCAL_MODEL = $env:USE_LOCAL_MODEL }
if ($env:LOCAL_MODEL_NAME) { $env:LOCAL_MODEL_NAME = $env:LOCAL_MODEL_NAME }
Start-Process -FilePath $py -ArgumentList 'app.py' -WorkingDirectory $backendDir -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
# (We intentionally do not restore the environment vars here; the parent session will keep them until closed.)
Write-Output "Started backend process. Give it a few seconds to initialize and then test: http://<this-machine-ip>:$port/ or http://localhost:$port/"
