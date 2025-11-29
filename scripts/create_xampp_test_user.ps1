<#
Create a test database and user using a local XAMPP MySQL installation.

Usage:
  # Create DB and user with defaults:
  .\scripts\create_xampp_test_user.ps1

  # Provide a custom password and run the Node connection test afterwards:
  .\scripts\create_xampp_test_user.ps1 -DbPass 's3cret' -RunConnTest

This script assumes XAMPP MySQL is in the default location:
  C:\xampp\mysql\bin\mysql.exe
If your MySQL binary is elsewhere, supply -MysqlExe with the full path.
#>

param(
    [string]$DbName = 'vcv_test',
    [string]$DbUser = 'vcv_test_user',
    [string]$DbPass = 's3cret',
    [string]$MysqlExe = 'C:\xampp\mysql\bin\mysql.exe',
    [switch]$RunConnTest
)

if (-not (Test-Path $MysqlExe)) {
    Write-Error "MySQL client not found at '$MysqlExe'. Please adjust -MysqlExe or install XAMPP."
    exit 2
}

$sql = @"
CREATE DATABASE IF NOT EXISTS $DbName;
CREATE USER IF NOT EXISTS '$DbUser'@'localhost' IDENTIFIED BY '$DbPass';
GRANT ALL PRIVILEGES ON $DbName.* TO '$DbUser'@'localhost';
GRANT ALL PRIVILEGES ON $DbName.* TO '$DbUser'@'127.0.0.1';
FLUSH PRIVILEGES;
"@

Write-Host "Creating database '$DbName' and user '$DbUser'@'localhost'..."

#$MysqlExe runs the SQL as the current administrator (root). If your XAMPP root has a password, the command will prompt for it.
try {
    & $MysqlExe -u root -e $sql 2>&1 | ForEach-Object { Write-Host $_ }
    Write-Host "Done."
} catch {
    Write-Error "Failed to run mysql client: $_"
    exit 3
}

Write-Host "To test the connection with the new user in this PowerShell session, run:"
Write-Host "  `$env:DB_HOST='127.0.0.1'"
Write-Host "  `$env:DB_USER='$DbUser'"
Write-Host "  `$env:DB_PASS='$DbPass'"
Write-Host "  `$env:DB_NAME='$DbName'"
Write-Host "  node .\scripts\test_conn.js"

if ($RunConnTest) {
    Write-Host "Running connection test now..."
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

Write-Host "Finished."
