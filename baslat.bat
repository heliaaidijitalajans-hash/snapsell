@echo off
echo Tum Node surecleri kapatiliyor...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo Sunucu baslatiliyor...
cd /d "%~dp0"
node server.js
pause
