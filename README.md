# Resume OCR + Parsing API (Text Extraction Backend)

Production-ready FastAPI backend for resume text extraction (PDF/image), OCR fallback, and structured parsing.

## What it does
1. **Upload a resume** (PDF/JPG/PNG, up to 10 MB).
2. **Extract text** using direct PDF extraction first (PyMuPDF/pdfplumber).
3. **Fallback to OCR** with Google Vision `DOCUMENT_TEXT_DETECTION` if text is too short.
4. **Parse fields** (name, email, phone, skills, education, experience, certifications, LinkedIn, GitHub).

## Tech stack
FastAPI, requests, pdf2image, PyMuPDF, Pillow, python-multipart, pydantic.

## Project structure
```
app/
  api/        # FastAPI routes
  services/   # OCR, PDF extraction, parsing
  utils/      # config, logging, validation, rate limiting
  models/     # domain models
  schemas/    # API schemas
```

## Setup
### Prerequisites
- Python 3.11+
- Poppler (required for `pdf2image`)

**Windows:** install Poppler and add its `bin` directory to `PATH`.

### Install dependencies
```bash
pip install -r requirements.txt
```

### Configure environment
Create `.env` (see `.env.example`):
```
GOOGLE_API_KEY=your-google-vision-api-key
```

## Run locally
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Swagger UI: `http://127.0.0.1:8000/docs`

## API
### Health check
```
GET /health
```

### Upload resume
```
POST /upload-resume
```
**Response**
```json
{
  "success": true,
  "raw_text": "...",
  "parsed_data": {
    "name": "",
    "email": "",
    "phone": "",
    "skills": [],
    "education": [
      { "degree": "B.Tech in Computer Science", "level": "UG" }
    ],
    "experience": [
      { "company": "NSIC", "role": "UI/UX Developer", "years": "2 mos" }
    ],
    "certifications": [],
    "linkedin_url": "",
    "github_url": ""
  },
  "ocr_confidence": 0.92
}
```

## Testing (Windows PowerShell)
```powershell
curl.exe -X POST "http://127.0.0.1:8000/upload-resume" `
  -H "accept: application/json" `
  -F "file=@C:\path\to\resume.pdf"
```

## Configuration
Key env vars (see `.env.example`):
- `GOOGLE_API_KEY` (required)
- `MAX_FILE_SIZE_MB`
- `OCR_MIN_TEXT_LENGTH`
- `OCR_BATCH_SIZE`
- `OCR_DPI`
- `OCR_MAX_CONCURRENCY`
- `CORS_ORIGINS`
- `RATE_LIMIT_ENABLED`, `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`
- `GROQ_API_KEY`, `GROQ_MODEL`, `SKILLS_LLM_ENABLED`, `CERTIFICATIONS_LLM_ENABLED` (LLM-based cleanup)

## Deployment
### Docker
```bash
docker build -t resume-ocr-api .
docker run -p 8000:8000 -e GOOGLE_API_KEY=your-key resume-ocr-api
```

### Render / Railway
Use `render.yaml` and `railway.json` in repo root.

## Notes for collaborators
Update **this README** whenever endpoints, env vars, or response formats change.