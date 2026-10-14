@echo off
title MR SOLVER Electronics Shop & Installment Manager
cd /d "%~dp0"

echo ===================================================================
echo   MR SOLVER ELECTRONICS SHOP & INSTALLMENT MANAGEMENT SYSTEM
echo   100%% Offline Desktop Software Application
echo ===================================================================
echo Starting internal engine and launching desktop application...

if exist "%~dp0release\MR-SOLVER-Electronics-Shop-win32-x64\MR-SOLVER-Electronics-Shop.exe" (
    start "" "%~dp0release\MR-SOLVER-Electronics-Shop-win32-x64\MR-SOLVER-Electronics-Shop.exe"
) else (
    start "" npx electron .
)
exit
