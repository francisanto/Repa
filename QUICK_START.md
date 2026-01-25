# Quick Start Guide - Attendance Analysis & Razorpay

## 🚀 Start Everything in 3 Steps

### Step 1: Setup Python Service (One-time)

```bash
cd attendance-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure Environment

Create `.env` file in project root:

```bash
# Required
ATTENDANCE_SERVICE_URL=http://localhost:5001

# Razorpay Test Mode
RAZORPAY_KEY_ID=rzp_test_S80fwkNsAjSEZ6
RAZORPAY_KEY_SECRET=O59kU61NKA7YRlkZoKrBOt33

# Optional
PORT=5000
SESSION_SECRET=your-secret-key
```

### Step 3: Start Services

**Terminal 1** - Python Service:
```bash
cd attendance-service
python app.py
```

**Terminal 2** - Express.js:
```bash
npm run dev
```

Visit: `http://localhost:5000`

## 📋 Razorpay Test Mode - Quick Setup

1. Go to https://dashboard.razorpay.com
2. Switch to **Test Mode** (toggle in top right)
3. Go to **Settings** → **API Keys**
4. Copy **Key ID** and **Key Secret**
5. Add to `.env` file (see Step 2 above)

### Test Cards

- **Success**: `4111 1111 1111 1111` (any CVV, future expiry)
- **Failure**: `4000 0000 0000 0002`

## ✅ Verify Everything Works

1. **Python Service**: `curl http://localhost:5001/health`
   - Should return: `{"status": "healthy"}`

2. **Upload Leave Letter**:
   - Go to Attendance page
   - Upload a leave letter image/PDF
   - Should extract student info automatically

3. **Test Payment**:
   - Register for an event with payment
   - Use test card: `4111 1111 1111 1111`
   - Payment should succeed

## 🆘 Common Issues

**Python service won't start?**
- Check Python version: `python --version` (needs 3.8+)
- Install dependencies: `pip install -r requirements.txt`

**Razorpay not working?**
- Ensure test mode keys are set in `.env`
- Restart server after adding keys
- Use test card numbers above

**Can't connect to Python service?**
- Check it's running: `curl http://localhost:5001/health`
- Verify `ATTENDANCE_SERVICE_URL` in `.env`

## 📚 Full Documentation

- **Razorpay Setup**: See `RAZORPAY_SETUP.md`
- **Attendance Service**: See `attendance-service/README.md`
- **Complete Guide**: See `IMPLEMENTATION_SUMMARY.md`
