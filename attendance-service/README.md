# Attendance Analysis Service

AI-powered attendance analysis service for the Repa platform. This Python service handles OCR extraction, semantic analysis, clustering, and anomaly detection for student leave letters.

## Features

- **OCR Extraction**: Uses PaddleOCR with table and layout support to extract text from images and PDFs
- **Semantic Analysis**: Converts leave reasons to embeddings using Sentence-BERT (all-MiniLM-L6-v2)
- **Clustering**: Groups similar leave reasons using KMeans clustering
- **Anomaly Detection**: Identifies:
  - Highly similar or copied leave reasons
  - Repeated excuses by the same student
  - Unusually large groups sharing the same reason on the same date
  - Vague or generic reasons
- **Risk Assessment**: Assigns risk levels (low/medium/high) to detected anomalies

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. Navigate to the attendance-service directory:
   ```bash
   cd attendance-service
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

   **Note**: PaddleOCR may require additional system dependencies:
   - On Linux: `sudo apt-get install libgl1-mesa-glx libglib2.0-0`
   - On macOS: Usually works out of the box
   - On Windows: May require Visual C++ Redistributable

## Running the Service

1. Start the Flask server:
   ```bash
   python app.py
   ```

   Or with a specific port:
   ```bash
   PORT=5001 python app.py
   ```

2. The service will be available at `http://localhost:5001` (or the specified PORT)

3. Health check:
   ```bash
   curl http://localhost:5001/health
   ```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns service status

### Process Single Leave Letter
- **POST** `/api/process-leave-letter`
- **Body**: 
  ```json
  {
    "file": "data:image/png;base64,..." // Base64 encoded image or PDF
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "student_name": "John Doe",
      "roll_number": "CS2024001",
      "date": "2024-01-15",
      "reason": "Medical emergency",
      "raw_text": "Full extracted text..."
    }
  }
  ```

### Analyze Multiple Leave Letters
- **POST** `/api/analyze-leave-letters`
- **Body**:
  ```json
  {
    "leave_letters": [
      {
        "student_name": "John Doe",
        "roll_number": "CS2024001",
        "date": "2024-01-15",
        "reason": "Medical emergency"
      },
      ...
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "grouped_categories": [...],
    "anomalies": [...],
    "insights": [...],
    "statistics": {
      "total_letters": 10,
      "total_categories": 3,
      "total_anomalies": 2,
      "high_risk_anomalies": 1,
      "medium_risk_anomalies": 1,
      "low_risk_anomalies": 0
    }
  }
  ```

## Configuration

Set environment variables:
- `PORT`: Server port (default: 5001)
- `ATTENDANCE_SERVICE_URL`: Used by Express.js backend to connect (default: http://localhost:5001)

## Integration with Express.js Backend

The Express.js backend automatically proxies requests to this service. Set the `ATTENDANCE_SERVICE_URL` environment variable in your Express.js server:

```bash
ATTENDANCE_SERVICE_URL=http://localhost:5001
```

## Troubleshooting

### PaddleOCR Installation Issues
If you encounter issues installing PaddleOCR:
1. Ensure you have Python 3.8+
2. Install system dependencies (see Prerequisites)
3. Try installing PaddleOCR separately: `pip install paddlepaddle paddleocr`

### Model Download
On first run, Sentence-BERT will download the model (~80MB). Ensure you have internet connectivity.

### Memory Issues
For large batches of leave letters, ensure sufficient RAM (recommended: 4GB+).

## License

MIT
