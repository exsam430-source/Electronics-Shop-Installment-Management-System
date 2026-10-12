@echo off
title MR SOLVER Electronics Shop & Installment Manager
cd /d "%~dp0"

echo ===================================================================
echo   MR SOLVER ELECTRONICS SHOP & INSTALLMENT MANAGEMENT SYSTEM
echo   100%% Offline Desktop Software Application
echo ===================================================================
echo Starting internal engine and launching desktop application...

start "" npx electron .
exit
