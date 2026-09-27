@echo off
setlocal
cd /d "%~dp0"
title Offfice tool Pro - Khoi Chay Ung Dung

echo ================================================================
echo   OFFFICE TOOL PRO - HE THONG VAN PHONG VA CHUYEN DOI TAI LIEU
echo ================================================================
echo.

set "PY_EXE="
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
  set "PY_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
)
if not defined PY_EXE for /f "delims=" %%I in ('where python 2^>nul') do if not defined PY_EXE set "PY_EXE=%%I"

if not defined PY_EXE (
  echo [!] Khong tim thay Python. Dang mo che do Web Client (PWA)...
  start "" "index.html"
  exit /b 0
)

echo [1/2] Dang mo trinh duyet...
start "" "http://127.0.0.1:4000"

echo [2/2] Dang khoi dong Desktop Processing Engine tren cong 4000...
"%PY_EXE%" -u "src\server.py" 4000

pause
