@echo off
REM Google Cloud Load Balancer Setup Script for Windows
REM Region: us-east1-b

echo Google Cloud Load Balancer Setup
echo ================================

REM Check if WSL or Git Bash is available
where wsl >nul 2>&1
if %errorlevel% == 0 (
    echo Using WSL to run the setup script...
    wsl -e bash ./setup-gcp-load-balancer.sh
    goto :end
)

where bash >nul 2>&1
if %errorlevel% == 0 (
    echo Using Git Bash to run the setup script...
    bash ./setup-gcp-load-balancer.sh
    goto :end
)

echo Error: Neither WSL nor Git Bash found.
echo Please install one of the following:
echo 1. Windows Subsystem for Linux (WSL)
echo 2. Git for Windows (which includes Git Bash)
echo Then run this script again.

:end
pause