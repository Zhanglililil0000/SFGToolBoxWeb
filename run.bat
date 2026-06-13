@echo off
title SFG Tool Box - Starting...

echo ============================================
echo   SFG Tool Box - Quick Start
echo ============================================
echo.

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "CONDA_PYTHON=D:\Anaconda\envs\py310\python.exe"

echo ============================================
echo   Environment Check
echo ============================================
echo.

"%CONDA_PYTHON%" --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found at: %CONDA_PYTHON%
    echo Please check your conda environment path.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('"%CONDA_PYTHON%" --version') do set PY_VER=%%i
echo [OK] Python: %PY_VER%  (%CONDA_PYTHON%)

where npm > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js / npm not found. Please install Node.js.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo [OK] Node.js: %NODE_VER%

echo.
echo ============================================
echo   Dependency Check
echo ============================================
echo.

echo [Check] Backend dependencies...
"%CONDA_PYTHON%" -c "import fastapi, uvicorn, numpy, scipy" >nul 2>&1
if errorlevel 1 (
    echo [WARN] Missing backend dependencies. Installing...
    "%CONDA_PYTHON%" -m pip install -r "%BACKEND_DIR%requirements.txt"
    if errorlevel 1 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
    echo [OK] Backend dependencies installed.
) else (
    echo [OK] Backend dependencies: ready
)

echo [Check] Frontend dependencies...
if exist "%FRONTEND_DIR%\node_modules" (
    echo [OK] Frontend dependencies: ready
) else (
    echo [WARN] node_modules not found. Installing...
    cd /d "%FRONTEND_DIR%"
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
    echo [OK] Frontend dependencies installed.
)

echo.
echo ============================================
echo   Starting Services
echo ============================================
echo.

echo [1/2] Starting backend service (FastAPI)...
start "SFG-Backend" cmd /k "title SFG-Backend && cd /d %BACKEND_DIR% && ""%CONDA_PYTHON%"" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo       Backend: http://localhost:8000
echo       API Docs: http://localhost:8000/docs
echo.

timeout /t 3 /nobreak >nul

echo [2/2] Starting frontend service (Vite + React)...
start "SFG-Frontend" cmd /k "title SFG-Frontend && cd /d %FRONTEND_DIR% && npm run dev"
echo       Frontend: http://localhost:5173
echo.

echo ============================================
echo   Startup complete! Visit:
echo     Frontend: http://localhost:5173
echo     Backend:  http://localhost:8000
echo     API Docs: http://localhost:8000/docs
echo.
echo If a service window closed immediately, check that
echo window for error messages before it disappears.
echo.
echo Press any key to exit this window (services will keep running)...
pause >nul
