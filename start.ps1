[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repositoryRoot = $PSScriptRoot

Push-Location (Join-Path $repositoryRoot 'csms-client')
try {
    if (-not (Test-Path 'node_modules')) {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install csms-client dependencies (exit code: $LASTEXITCODE)."
        }
    }

    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build csms-client (exit code: $LASTEXITCODE)."
    }
}
finally {
    Pop-Location
}

Push-Location $repositoryRoot
try {
    & docker compose up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to build or start Docker Compose services (exit code: $LASTEXITCODE)."
    }
}
finally {
    Pop-Location
}
