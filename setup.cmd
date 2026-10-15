@echo off
cd /d "%~dp0"
call npm ci --ignore-scripts
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
call npm run setup
if errorlevel 1 goto failed
pause
exit /b 0
:failed
echo Kurulum durdu / Setup stopped. Yukaridaki hatayi kontrol edin / Check the error above.
pause
exit /b 1
