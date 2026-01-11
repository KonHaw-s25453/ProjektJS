@echo off
REM Scheduled task to check for VCV Library updates and update prices
REM Usage: Run this script daily/weekly via Windows Task Scheduler

cd /d "%~dp0"
node scripts\check-updates.js
echo Update check completed at %DATE% %TIME% >> update-log.txt