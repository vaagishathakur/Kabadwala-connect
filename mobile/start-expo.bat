@echo off
echo Starting KabadConnect Mobile App (Expo SDK 53)...
echo.
echo Fix: NODE_TLS_REJECT_UNAUTHORIZED=0 bypasses Node 24 certificate error
echo.
set NODE_TLS_REJECT_UNAUTHORIZED=0
cd /d "%~dp0"
npx expo start
pause
