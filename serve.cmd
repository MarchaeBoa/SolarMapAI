@echo off
cd /d "%~dp0"
set PORT=8200
powershell.exe -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
