@echo off
title Audira YT Monitor - Build Release Executable (.exe)
color 0A

echo ========================================================
echo     AUDIRA YT MONITOR - BUILD RELEASE EXECUTABLE (.EXE)
echo ========================================================
echo.

cd /d %~dp0

echo [*] Memeriksa compiler Rust & Cargo...
rustc --version >nul 2>&1
if errorlevel 1 (
    echo [!] Rust/Cargo belum terpasang. Silakan unduh dari https://rustup.rs
    pause
    exit /b 1
)

echo [*] Kompilasi berkas executable (.exe) versi Release...
cd desktop\src-tauri
cargo build --release

if errorlevel 1 (
    echo.
    echo [!] Process kompilasi gagal. Silakan periksa log error.
    pause
    exit /b 1
)

cd /d %~dp0
if not exist "release" mkdir release
copy /y "desktop\src-tauri\target\release\desktop.exe" "release\Audira YT Monitor.exe" >nul

echo.
echo ========================================================
echo      BERHASIL BUILD EXECUTABLE RELEASE (.EXE)! 🚀
echo ========================================================
echo.
echo Lokasi Berkas Executable (.exe):
echo f:\Audira-YT\release\Audira YT Monitor.exe
echo.
explorer.exe release
pause
