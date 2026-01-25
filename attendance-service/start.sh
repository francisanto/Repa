#!/bin/bash
# Startup script for Attendance Analysis Service

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Set default port if not specified
export PORT=${PORT:-5001}

# Start the Flask service
python app.py
