<#
Fix GRANTS for the `vcv_test` database and `vcv_test_user` on a XAMPP MySQL instance.

Usage:
  # Run and be prompted for root password if necessary
  .\scripts\fix_vcv_test_grants.ps1

  # Run and then run the Node connection test
  .\scripts\fix_vcv_test_grants.ps1 -RunConnTest

If your MySQL binary lives elsewhere, pass -MysqlExe.
#>

param(
    [string]$DbName = 'vcv_test',
    [string]$DbUser = 'vcv_test_user',
    [string]$DbPass = 's3cret',
    [string]$MysqlExe = 'C:\xampp\mysql\bin\mysql.exe',
    [switch]$RunConnTest
)

if (-not (Test-Path $MysqlExe)) {
    Write-Error "MySQL client not found at '$MysqlExe'. Adjust -MysqlExe or install XAMPP."
    exit 2
}

$sql = @"
-- Ensure the database exists
CREATE DATABASE IF NOT EXISTS `$DbName`;
-- Create (or ensure) user and grant for both localhost and 127.0.0.1
CREATE USER IF NOT EXISTS '$DbUser'@'localhost' IDENTIFIED BY '$DbPass';
CREATE USER IF NOT EXISTS '$DbUser'@'127.0.0.1' IDENTIFIED BY '$DbPass';
GRANT ALL PRIVILEGES ON `$DbName`.* TO '$DbUser'@'localhost';
GRANT ALL PRIVILEGES ON `$DbName`.* TO '$DbUser'@'127.0.0.1';
FLUSH PRIVILEGES;
"@

Write-Host "Applying grants for '$DbUser' on database '$DbName' (you may be prompted for root password)..."
try {
    & $MysqlExe -u root -p -e $sql 2>&1 | ForEach-Object { Write-Host $_ }
    Write-Host "GRANTS applied."
} catch {
    Write-Error "Failed to execute mysql client: $_"
    exit 3
}

Write-Host "Verifying grants now:"
& $MysqlExe -u root -e "SHOW GRANTS FOR '$DbUser'@'localhost';" | ForEach-Object { Write-Host $_ }
& $MysqlExe -u root -e "SHOW GRANTS FOR '$DbUser'@'127.0.0.1';" | ForEach-Object { Write-Host $_ }

if ($RunConnTest) {
    Write-Host "Running connection test using the newly-applied credentials..."
    $env:DB_HOST = '127.0.0.1'
    $env:DB_USER = $DbUser
    $env:DB_PASS = $DbPass
    $env:DB_NAME = $DbName
    try {
        node .\scripts\test_conn.js
    } catch {
        Write-Error "Connection test failed to execute: $_"
        exit 4
    }
}

Write-Host "Done. If your Node test still fails, run the diagnostic commands I provided earlier."
