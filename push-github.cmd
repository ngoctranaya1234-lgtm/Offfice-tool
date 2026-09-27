@echo off
setlocal
cd /d "%~dp0"
title Offfice tool - Day Len GitHub

echo ================================================================
echo   DAY OFFFICE TOOL LEN GITHUB CUA BAN
echo ================================================================
echo.

set "GIT_EXE="
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe" (
  set "GIT_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe"
)
if not defined GIT_EXE for /f "delims=" %%I in ('where git 2^>nul') do if not defined GIT_EXE set "GIT_EXE=%%I"

if not defined GIT_EXE (
  echo [LOI] Khong tim thay Git tren he thong.
  pause
  exit /b 1
)

set /p REPO_URL="Nhap dia chi GitHub Repository (Vi du: https://github.com/username/Offfice-tool.git): "
if "%REPO_URL%"=="" (
  echo [!] Ban chua nhap dia chi repo.
  pause
  exit /b 1
)

if not exist ".git" (
  echo [1/4] Khoi tao Git repository...
  "%GIT_EXE%" init -b main
)

echo [2/4] Them toan bo ma nguon va commit...
"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "feat: Khoi tao Offfice tool - Chuyen doi Word PDF Excel, Bo sua PDF va Giao dien iOS Android PC"

echo [3/4] Ket noi den GitHub Remote...
"%GIT_EXE%" remote remove origin 2>nul
"%GIT_EXE%" remote add origin %REPO_URL%

echo [4/4] Day ma nguon len GitHub...
"%GIT_EXE%" push -u origin main

echo.
echo ================================================================
echo   DA DAY LEN GITHUB THANH CONG!
echo ================================================================
echo   Cach mo Web tren dien thoai (iOS/Android) mien phi qua GitHub Pages:
echo   1. Mo GitHub repo cua ban tren trinh duyet
echo   2. Vao muc Settings -> Pages
echo   3. Tai 'Branch': Chon 'main', folder '/ (root)', bam Save
echo   4. Duong link truy cap tren iOS/Android:
echo      https://<username>.github.io/<ten-repo>/
echo ================================================================
echo.
pause
