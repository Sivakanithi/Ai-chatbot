# 🚀 Render Deployment Guide for AI Chatbot

This guide will walk you through deploying your AI chatbot on Render with both backend (Flask) and frontend (React).

---

## 📋 Prerequisites

1. **GitHub Account**: Your code should be pushed to GitHub (already done ✅)
2. **Render Account**: Sign up at [render.com](https://render.com) (free tier available)
3. **Documents**: Have your PDF/text documents ready in `backend/knowledge_base/`

---

## 🎯 Deployment Strategy

We'll deploy in two parts:
1. **Backend**: Flask API as a Web Service
2. **Frontend**: React app as a Static Site

---

## Part 1: Deploy Backend (Flask API)

### Step 1: Prepare Backend for Deployment

First, we need to ensure the backend has the right configuration files.

#### 1.1 Check `backend/requirements.txt`
Make sure it contains all dependencies (already configured ✅)

#### 1.2 Create `render.yaml` (Optional - for automated deployment)
This file will be created automatically below.

### Step 2: Push to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 3: Deploy Backend on Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Click **"New +"** → **"Web Service"**

2. **Connect GitHub Repository**
   - Select **"Connect a repository"**
   - Authorize Render to access your GitHub
   - Select repository: **`Sivakanithi/Ai-chatbot`**

3. **Configure Backend Service**

   | Setting | Value |
   |---------|-------|
   | **Name** | `ai-chatbot-backend` (or your choice) |
   | **Region** | Choose closest to you |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn app:app` |
   | **Instance Type** | `Free` (or paid for better performance) |

4. **Add Environment Variables**
   
   Click **"Advanced"** → **"Add Environment Variable"**
   
   Add these variables:
   
   ```
   USE_LOCAL_MODEL=1
   LOCAL_MODEL_NAME=google/flan-t5-small
   FLASK_HOST=0.0.0.0
   PORT=10000
   PYTHON_VERSION=3.11.0
   ```
   
   ⚠️ **Important**: Use `flan-t5-small` instead of `flan-t5-large` for free tier
   - `flan-t5-large` (780MB) may cause memory issues on free tier
   - `flan-t5-small` (80MB) works well on free tier

5. **Click "Create Web Service"**
   
   Render will:
   - Install dependencies (5-10 minutes for transformers + torch)
   - Download the AI model on first run
   - Start your Flask app
   
   ⏱️ **First deployment takes 10-15 minutes**

6. **Upload Knowledge Base Documents**

   After deployment, you'll need to upload your documents:
   
   **Option A: Use Render Shell** (Recommended)
   - In Render dashboard, go to your service
   - Click **"Shell"** tab
   - Upload files manually via shell commands
   
   **Option B: Use the `/ingest` endpoint**
   - Use Postman or curl to upload files
   - Endpoint: `https://your-app.onrender.com/ingest`

7. **Get Your Backend URL**
   
   After deployment completes:
   - URL will be: `https://ai-chatbot-backend.onrender.com`
   - Test it: Visit `https://your-backend-url.onrender.com/`
   - Should see: "Welcome to the AI Chatbot backend!"

---

## Part 2: Deploy Frontend (React Static Site)

### Step 1: Update Frontend API URL

Before deploying frontend, update it to use your deployed backend URL.

Edit `frontend/src/App.js`:

```javascript
// Change from:
const BACKEND_URL = "http://127.0.0.1:5000";

// To:
const BACKEND_URL = "https://ai-chatbot-backend.onrender.com";
```

Update all fetch calls to use `BACKEND_URL`:

```javascript
fetch(`${BACKEND_URL}/documents`)
fetch(`${BACKEND_URL}/chat`, ...)
```

Commit and push:
```bash
git add .
git commit -m "Update backend URL for production"
git push origin main
```

### Step 2: Deploy Frontend on Render

1. **Go to Render Dashboard**
   - Click **"New +"** → **"Static Site"**

2. **Connect Same Repository**
   - Select: **`Sivakanithi/Ai-chatbot`**

3. **Configure Frontend Service**

   | Setting | Value |
   |---------|-------|
   | **Name** | `ai-chatbot-frontend` |
   | **Branch** | `main` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm install && npm run build` |
   | **Publish Directory** | `build` |

4. **Add Environment Variables** (if needed)
   
   ```
   NODE_VERSION=18
   ```

5. **Click "Create Static Site"**
   
   Build takes 3-5 minutes

6. **Get Your Frontend URL**
   
   - URL will be: `https://ai-chatbot-frontend.onrender.com`
   - Open in browser and test!

---

## 🔧 Additional Configuration Files Needed

### 1. Add `backend/gunicorn_config.py`

Gunicorn configuration for production:

```python
bind = "0.0.0.0:10000"
workers = 1  # Use 1 worker for free tier to save memory
threads = 2
timeout = 120  # Longer timeout for AI model inference
worker_class = "sync"
max_requests = 1000
max_requests_jitter = 50
```

### 2. Update `backend/.env.example`

Already configured ✅

---

## ⚠️ Important Notes for Free Tier

### Memory Limitations
- **Free tier has 512MB RAM**
- Use `flan-t5-small` model (80MB)
- Backend may spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start + model loading)

### Storage Limitations
- **Free tier has ephemeral storage** (files don't persist between deploys)
- Your uploaded documents will be **lost** when service restarts
- **Solution**: 
  - Keep documents in GitHub repo (`backend/knowledge_base/`)
  - Commit documents to repo before each deploy
  - Or upgrade to paid plan with persistent disk

### Performance
- Free tier is slower than local development
- Response time: 5-10 seconds (vs 2-3 seconds locally)
- Consider upgrading to paid tier ($7/month) for better performance

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: "Out of memory" error**
- Solution: Switch to `flan-t5-small` in environment variables

**Problem: Backend takes too long to start**
- Normal on first deploy (10-15 minutes)
- Model needs to be downloaded from HuggingFace
- Check logs in Render dashboard

**Problem: "Module not found" errors**
- Check `requirements.txt` has all dependencies
- Re-deploy after fixing

**Problem: Documents not found**
- Upload documents to `backend/knowledge_base/` folder
- Commit to GitHub before deploying
- Or use Render Shell to upload manually

### Frontend Issues

**Problem: "Failed to fetch" errors**
- Check backend URL is correct in `App.js`
- Ensure backend is running (not sleeping)
- Check CORS settings in `backend/app.py`

**Problem: Static site shows blank page**
- Check browser console for errors
- Verify build completed successfully in Render logs
- Ensure `build` folder was created

---

## 📊 Testing Deployment

### Test Backend
```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/

# Test documents endpoint
curl https://your-backend-url.onrender.com/documents

# Test chat endpoint
curl -X POST https://your-backend-url.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ChatGPT?", "use_kb": true}'
```

### Test Frontend
1. Open `https://your-frontend-url.onrender.com`
2. Should see welcome screen with documents
3. Click sample questions
4. Verify responses come from your documents

---

## 🔄 Updating Your Deployment

Whenever you make changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will **automatically redeploy** both services!

---

## 💰 Cost Estimate

### Free Tier (Current Setup)
- **Cost**: $0/month
- **Limitations**: 
  - 512MB RAM
  - Services sleep after 15 min inactivity
  - Slow cold starts
  - 750 hours/month (enough for small projects)

### Paid Tier (Recommended for Production)
- **Cost**: $7/month per service ($14 total for backend + frontend)
- **Benefits**:
  - No sleep
  - 512MB RAM (Starter) or more
  - Faster performance
  - Custom domains
  - Persistent disk available

---

## 📝 Checklist

Before deploying, ensure:

- [ ] All code committed to GitHub
- [ ] Documents in `backend/knowledge_base/` folder
- [ ] `requirements.txt` is complete
- [ ] `.env` is NOT in git (use `.env.example` instead)
- [ ] Backend API URL updated in frontend (for production)
- [ ] Tested locally first
- [ ] Render account created
- [ ] Ready to wait 10-15 minutes for first deploy

---

## 🎉 Success!

Once deployed, your chatbot will be accessible at:
- **Frontend**: `https://ai-chatbot-frontend.onrender.com`
- **Backend API**: `https://ai-chatbot-backend.onrender.com`

Share the frontend URL with anyone to use your chatbot! 🚀

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Deploying Python Apps](https://render.com/docs/deploy-flask)
- [Deploying React Apps](https://render.com/docs/deploy-create-react-app)
- [Environment Variables](https://render.com/docs/environment-variables)

---

**Need Help?** Check Render logs in dashboard or open an issue on GitHub.
