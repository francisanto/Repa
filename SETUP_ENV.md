# Quick Environment Setup

## Create Your .env File

Copy this content to a `.env` file in the project root:

```bash
# Express.js Server Configuration
PORT=5000
SESSION_SECRET=your-secret-key-here-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/repa

# Attendance Analysis Service (Python)
ATTENDANCE_SERVICE_URL=http://localhost:5001

# Razorpay Payment Gateway (Test Mode)
RAZORPAY_KEY_ID=rzp_test_S80fwkNsAjSEZ6
RAZORPAY_KEY_SECRET=O59kU61NKA7YRlkZoKrBOt33

# OpenAI API (if using)
AI_INTEGRATIONS_OPENAI_API_KEY=your-openai-api-key
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

**Important**: The `.env` file is already in `.gitignore` and will NOT be committed to git.

## Quick Start

1. Create `.env` file with the content above
2. Start Python service: `cd attendance-service && python app.py`
3. Start Express.js: `npm run dev`
4. Visit: `http://localhost:5000`

Your Razorpay test keys are already configured in the code as fallbacks, but it's better to use the `.env` file for all configuration.
