# Proofline Python FastAPI Backend

Designed for the **SerpApi India Hackathon 2026**.
Deployable on Render using Python 3.14 / 3.12.

## Security Architecture

The backend is the **sole component** authorized to access SerpApi. 
The SerpApi secret key is kept exclusively on the server in the `SERPAPI_API_KEY` environment variable. 
The frontend never stores, requests, or transmits any API key.

## Local Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set your SerpApi key and run:
```bash
export SERPAPI_API_KEY="your_serpapi_key_here"
uvicorn main:app --reload --port 8000
```

4. Verify health check:
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "search_provider": "serpapi",
  "serpapi_configured": true,
  "version": "1.0.0"
}
```

## Render Deployment

1. Create a new **Web Service** on Render.
2. Connect your Git repository.
3. Configuration settings:
   - **Environment**: Python 3.14 (or 3.12)
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variable:
   - `SERPAPI_API_KEY`: `<Your Private SerpApi Key>`
5. In the frontend `.env`, point `VITE_API_BASE_URL` to your Render service URL (e.g. `https://proofline-backend.onrender.com`).
