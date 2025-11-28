<#
Stops tracking the env_settings folder in Git while keeping local files.
Run this from the repository root in PowerShell.
#>
param()

Write-Host "Stopping tracking of env_settings/ and committing change..."
git rm -r --cached env_settings
if ($LASTEXITCODE -ne 0) {
  Write-Error "git rm failed. Are you in a git repo root?"
  exit 1
}
git add .gitignore
git commit -m "chore: stop tracking env_settings (local configs)"
if ($LASTEXITCODE -ne 0) {
  Write-Error "git commit failed. Inspect changes and commit manually."
  exit 1
}
Write-Host "Done. You may push the commit with: git push"
