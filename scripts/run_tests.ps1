param(
  [string]$OutFile = ".\test-results.txt",
  [string]$JsonFile = ".\test-results.json",
  [string]$JUnitFile = ".\test-results.xml",
  [switch]$Append,
  [switch]$UseNpx
)

# Ensure output directories exist
foreach ($path in @($OutFile, $JsonFile, $JUnitFile)) {
  $dir = Split-Path $path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
if (-not $Append) { if (Test-Path $OutFile) { Remove-Item $OutFile -Force -ErrorAction SilentlyContinue } }

# Try to write header to the primary OutFile. If it's locked, fall back to a timestamped filename.
$written = $false
try {
  "Test run at $timestamp`n" | Out-File -FilePath $OutFile -Encoding utf8 -Append -ErrorAction Stop
  $written = $true
} catch {
  $alt = "{0}-{1}.txt" -f ([System.IO.Path]::GetFileNameWithoutExtension($OutFile)), (Get-Date -Format "yyyyMMdd-HHmmss")
  $altPath = [System.IO.Path]::Combine((Split-Path $OutFile -Parent), $alt)
  Write-Host "Warning: couldn't write $OutFile (locked). Falling back to $altPath" -ForegroundColor Yellow
  try {
    "Test run at $timestamp`n" | Out-File -FilePath $altPath -Encoding utf8 -Append -ErrorAction Stop
    $OutFile = $altPath
    $written = $true
  } catch {
    Write-Host "Failed to write both primary and fallback output files. Continuing without text log." -ForegroundColor Red
  }
}

# Resolve full output paths
$fullOut = [System.IO.Path]::GetFullPath($OutFile)
$fullJson = [System.IO.Path]::GetFullPath($JsonFile)
$fullJUnit = [System.IO.Path]::GetFullPath($JUnitFile)

Write-Host "Running: jest -> stdout/stderr -> $fullOut" -ForegroundColor Cyan
Write-Host "JSON output -> $fullJson" -ForegroundColor Cyan
Write-Host "JUnit output -> $fullJUnit" -ForegroundColor Cyan

# Detect whether jest-junit reporter is installed locally
$repoRoot = (Get-Location).Path
$hasJestJunit = Test-Path (Join-Path $repoRoot "node_modules\jest-junit")
if (-not $hasJestJunit) {
  # also check package.json devDependencies for hint
  try {
    $pkg = Get-Content (Join-Path $repoRoot "package.json") -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($pkg -and ($pkg.devDependencies.'jest-junit' -or $pkg.dependencies.'jest-junit')) { $hasJestJunit = $true }
  } catch { }
}

# Build Jest command. Prefer npx to use local jest if available.
$jestBin = if ($UseNpx -or $true) { 'npx jest' } else { 'npm test --' }
$reporterArg = ""
if ($hasJestJunit) {
  $reporterArg = " --reporters=default --reporters=jest-junit"
}

# Build the command that runs under cmd.exe so we can reliably redirect stdout+stderr to a file
# If jest-junit is available, set JEST_JUNIT_OUTPUT for that run so the JUnit file is produced
$envSetter = ""
if ($hasJestJunit) { $envSetter = "set JEST_JUNIT_OUTPUT=`"$fullJUnit`" && " }

$jsonArg = "--runInBand --json --outputFile=`"$fullJson`""
$cmd = "$envSetter$jestBin $jsonArg$reporterArg"

# Use cmd.exe to perform shell redirection (redirect stdout and stderr to same file)
$arg = "/c $cmd 1>`"$fullOut`" 2>&1"
$proc = Start-Process -FilePath 'cmd.exe' -ArgumentList $arg -NoNewWindow -Wait -PassThru
$exit = $proc.ExitCode

if ($exit -ne 0) {
  Write-Host "Tests finished with exit code $exit. Results saved to:`n  - $fullOut`n  - $fullJson`n  - $fullJUnit" -ForegroundColor Yellow
  exit $exit
} else {
  Write-Host "Tests passed. Results saved to:`n  - $fullOut`n  - $fullJson`n  - $fullJUnit" -ForegroundColor Green
}
