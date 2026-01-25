@echo off
REM Startup script for Attendance Analysis Service (Windows)

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)

REM Set default port if not specified
if "%PORT%"=="" set PORT=5001

REM Start the Flask service
python app.py
