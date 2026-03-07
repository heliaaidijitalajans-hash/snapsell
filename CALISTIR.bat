@echo off
cd /d "%~dp0"
echo SnapSell baslatiliyor...
echo.
if not exist "saas-design-extracted\dist\index.html" (
  echo [1/2] Tasarim build ediliyor...
  call npm run build:design
  if errorlevel 1 ( echo Build hatasi. & pause & exit /b 1 )
  echo.
) else (
  echo [1/2] dist zaten var, build atlaniyor.
  echo.
)
echo [2/2] Sunucu baslatiliyor (port 3006)...
echo Tarayicida ac: http://localhost:3006/dashboard
echo Durdurmak icin Ctrl+C
echo.
node server.js
pause
