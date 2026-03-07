@echo off
cd /d "%~dp0saas-design-extracted"
if not exist "package.json" (
  echo HATA: saas-design-extracted\package.json bulunamadi.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo node_modules yok, npm install calistiriliyor...
  call npm install
  if errorlevel 1 exit /b 1
)
echo Design uygulamasi build ediliyor...
call npm run build
if errorlevel 1 (
  echo Build basarisiz.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo UYARI: dist\index.html olusmadi.
)
if not exist "dist\assets" (
  echo UYARI: dist\assets klasoru yok. npm install yapip tekrar deneyin.
) else (
  echo OK: dist ve dist\assets olusturuldu.
)
echo Bitti. Sunucuyu calistirip http://localhost:3007/dashboard acin.
pause
