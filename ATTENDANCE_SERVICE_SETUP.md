# Attendance Analysis Service - Quick Start Guide

## Overview

The Attendance Analysis Service is a Python microservice that provides AI-powered analysis of student leave letters. It uses:
- **PaddleOCR** for text extraction from images and PDFs
- **Sentence-BERT** for semantic embeddings
- **KMeans clustering** for grouping similar leave reasons
- **Anomaly detection** algorithms to identify suspicious patterns

## Quick Setup

### 1. Install Python Dependencies

```bash
cd attendance-service
pip install -r requirements.txt
```

**Note**: On first run, Sentence-BERT will download the model (~80MB). Ensure internet connectivity.

### 2. Start the Service

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

**Or manually:**
```bash
python app.py
```

The service will start on port 5001 (or the PORT environment variable).

### 3. Verify It's Running

```bash
curl http://localhost:5001/health
```

Should return: `{"status": "healthy", "service": "attendance-analysis"}`

## Integration with Express.js

The Express.js backend automatically connects to this service. Ensure:

1. **Environment variable is set** in your Express.js `.env`:
   ```bash
   ATTENDANCE_SERVICE_URL=http://localhost:5001
   ```

2. **Service is running** before starting Express.js server

3. **Both services are on the same network** (or update URL accordingly)

## Usage Flow

1. **Upload Leave Letters**: Users upload leave letter images/PDFs via the frontend
2. **OCR Extraction**: Service extracts text using PaddleOCR
3. **Data Extraction**: Parses student name, roll number, date, and reason
4. **Analysis**: When multiple letters are uploaded, run analysis to:
   - Group similar reasons
   - Detect anomalies
   - Generate insights

## API Endpoints

### Process Single Letter
```bash
POST http://localhost:5001/api/process-leave-letter
Content-Type: application/json

{
  "file": "data:image/png;base64,..."
}
```

### Analyze Multiple Letters
```bash
POST http://localhost:5001/api/analyze-leave-letters
Content-Type: application/json

{
  "leave_letters": [
    {
      "student_name": "John Doe",
      "roll_number": "CS2024001",
      "date": "2024-01-15",
      "reason": "Medical emergency"
    }
  ]
}
```

## Troubleshooting

### Service Won't Start
- Check Python version: `python --version` (needs 3.8+)
- Verify all dependencies installed: `pip list`
- Check port availability: `netstat -an | grep 5001`

### OCR Not Working
- Ensure PaddleOCR installed: `pip show paddleocr`
- Check system dependencies (see main README)
- Try with a simple test image first

### Model Download Issues
- Ensure internet connectivity
- Check disk space (model is ~80MB)
- Manually download if needed: The model will be cached in `~/.cache/torch/sentence_transformers/`

### Connection Errors from Express.js
- Verify service is running: `curl http://localhost:5001/health`
- Check `ATTENDANCE_SERVICE_URL` in Express.js `.env`
- Ensure no firewall blocking port 5001

## Performance Notes

- **First request** may be slow (model loading)
- **OCR processing** takes 2-5 seconds per image
- **Analysis** of 10 letters takes ~1-2 seconds
- **Memory usage**: ~500MB-1GB depending on batch size

## Development

To modify the service:

1. Edit `app.py` for logic changes
2. Edit `requirements.txt` for dependency changes
3. Restart the service to apply changes

## Production Deployment

For production:

1. Use a process manager (PM2, systemd, etc.)
2. Set up proper logging
3. Configure health checks
4. Use environment variables for configuration
5. Consider containerization (Docker)

## Support

For issues or questions:
- Check [attendance-service/README.md](./attendance-service/README.md)
- Review server logs
- Test endpoints individually with curl/Postman
