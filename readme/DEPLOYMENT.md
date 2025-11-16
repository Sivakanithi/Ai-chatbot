# Deployment Guide

## Pre-Deployment Security Checklist

### 🔒 Secure Your Credentials:
1. ✅ `.gitignore` is configured (blocks `.env`, logs, data folders)
2. ⚠️ **ROTATE exposed API keys** immediately:
   - Google Gemini API key
   - OpenAI API key  
   - HuggingFace token
3. ✅ Only commit `.env.example` (template with placeholders)
4. ✅ Use environment variables in hosting platform

---

## Option 1: Vercel (Frontend) + Render (Backend)

### Frontend (Vercel):
```bash
cd frontend
npm run build
# Deploy to Vercel
npx vercel --prod
```

**Environment Variables in Vercel:**
- `REACT_APP_API_URL` = your backend URL (e.g., `https://your-app.onrender.com`)

### Backend (Render):
1. Create new **Web Service** on Render.com
2. Connect your GitHub repo
3. **Build Command:** `pip install -r backend/requirements.txt`
4. **Start Command:** `gunicorn -w 4 -b 0.0.0.0:$PORT backend.app:app`
5. **Add to requirements.txt:** `gunicorn`
6. **Environment Variables:**
   - `LOCAL_MODEL_NAME=google/flan-t5-small` (smaller for free tier)
   - `USE_LOCAL_MODEL=1`
   - `PORT=10000`

---

## Option 2: Railway (Full Stack)

### Setup:
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

**Railway Configuration:**
- Add `Procfile` in root:
  ```
  web: cd backend && gunicorn -w 2 -b 0.0.0.0:$PORT app:app
  ```
- Environment variables: Set in Railway dashboard

---

## Option 3: Docker (Self-Hosted)

### Create `backend/Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
EXPOSE 5000
CMD ["python", "app.py"]
```

### Create `docker-compose.yml`:
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - LOCAL_MODEL_NAME=google/flan-t5-small
      - USE_LOCAL_MODEL=1
    volumes:
      - ./backend/knowledge_base:/app/knowledge_base
      - ./backend/data:/app/data
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

**Deploy:**
```bash
docker-compose up -d
```

---

## Important Notes:

### Model Size for Free Hosting:
- ❌ `flan-t5-large` (780MB) - too large for most free tiers
- ✅ `flan-t5-small` (80MB) - works on free tiers
- ✅ `flan-t5-base` (250MB) - good balance

**Switch model in `.env`:**
```
LOCAL_MODEL_NAME=google/flan-t5-small
```

### Knowledge Base Files:
- Include `backend/knowledge_base/` in deployment
- Preload your company documents
- Rebuild index on first deployment

### CORS Configuration:
Update `backend/app.py` to allow your frontend domain:
```python
CORS(app, origins=["https://your-frontend-domain.vercel.app"])
```

---

## Post-Deployment:
1. Test `/chat` endpoint
2. Test `/ingest` endpoint (rebuild index)
3. Monitor logs for errors
4. Set up SSL/HTTPS
5. Configure custom domain (optional)

---

## Cost Estimates:
- **Free:** Vercel + Render free tier (~sleep after 15min inactivity)
- **$5-7/month:** Railway with always-on service
- **$4-6/month:** DigitalOcean droplet with Docker
- **Enterprise:** AWS/GCP/Azure (varies)
