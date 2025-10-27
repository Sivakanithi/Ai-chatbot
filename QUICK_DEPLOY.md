# Quick Deploy to Render - Step by Step

## 🚀 Quick Start (5 Steps)

### Step 1: Commit Your Documents
```bash
# Make sure your documents are in the knowledge_base folder
git add backend/knowledge_base/
git add .
git commit -m "Add knowledge base documents for deployment"
git push origin main
```

### Step 2: Sign Up on Render
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### Step 3: Deploy Backend

1. **Click "New +" → "Web Service"**
2. **Select your repository**: `Sivakanithi/Ai-chatbot`
3. **Fill in these settings**:
   ```
   Name: ai-chatbot-backend
   Region: Oregon (or closest to you)
   Branch: main
   Root Directory: backend
   Runtime: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn -c gunicorn_config.py app:app
   Instance Type: Free
   ```

4. **Add Environment Variables** (Click "Advanced"):
   ```
   USE_LOCAL_MODEL = 1
   LOCAL_MODEL_NAME = google/flan-t5-small
   FLASK_HOST = 0.0.0.0
   PYTHON_VERSION = 3.11.0
   ```

5. **Click "Create Web Service"**
   - Wait 10-15 minutes for first deployment
   - Note your backend URL: `https://ai-chatbot-backend.onrender.com`

### Step 4: Update Frontend Configuration

Before deploying frontend, create `.env.production` file:

```bash
cd frontend
```

Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://ai-chatbot-backend.onrender.com
```

Replace `ai-chatbot-backend` with your actual backend service name.

Commit the change:
```bash
git add frontend/.env.production
git commit -m "Add production environment config"
git push origin main
```

### Step 5: Deploy Frontend

1. **Click "New +" → "Static Site"**
2. **Select same repository**: `Sivakanithi/Ai-chatbot`
3. **Fill in these settings**:
   ```
   Name: ai-chatbot-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: build
   ```

4. **Click "Create Static Site"**
   - Wait 3-5 minutes
   - Note your frontend URL: `https://ai-chatbot-frontend.onrender.com`

---

## ✅ That's It!

Your chatbot is now live at:
- **Frontend**: https://ai-chatbot-frontend.onrender.com
- **Backend API**: https://ai-chatbot-backend.onrender.com

---

## 📝 Important Notes

### For Free Tier Users:

1. **Model Size**: Using `flan-t5-small` (80MB) instead of `flan-t5-large` (780MB)
   - Fits in 512MB RAM limit
   - Slightly lower quality but still good
   - Response time: 5-10 seconds

2. **Auto-Sleep**: Free services sleep after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds
   - Subsequent requests are faster

3. **Document Storage**: 
   - Keep documents in GitHub repo (`backend/knowledge_base/`)
   - They'll be available on every deploy
   - Don't upload via API (files are lost on restart)

### Testing Your Deployment:

```bash
# Test backend
curl https://your-backend.onrender.com/

# Test documents endpoint
curl https://your-backend.onrender.com/documents

# Test chat
curl -X POST https://your-backend.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is ChatGPT?", "use_kb": true}'
```

---

## 🐛 Common Issues

**Backend won't start:**
- Check logs in Render dashboard
- Verify all environment variables are set
- Make sure `gunicorn` is in `requirements.txt` ✅

**Frontend shows errors:**
- Verify `REACT_APP_API_URL` is correct in `.env.production`
- Check browser console for CORS errors
- Ensure backend is running (not sleeping)

**"Out of memory" error:**
- Switch to `flan-t5-small` in environment variables
- Or upgrade to paid plan ($7/month)

**Documents not loading:**
- Ensure documents are in `backend/knowledge_base/` in GitHub
- Check Render logs for file access errors
- Verify files were included in git commit

---

## 🔄 Updates

To update your deployed app:

```bash
# Make changes
git add .
git commit -m "Your updates"
git push origin main
```

Render will automatically redeploy both services!

---

## 💡 Pro Tips

1. **Custom Domain**: Add your own domain in Render settings (paid plans)
2. **Auto-Deploy**: Already enabled with GitHub integration
3. **Logs**: Always check logs in Render dashboard for errors
4. **Monitoring**: Use Render's built-in monitoring
5. **Scaling**: Upgrade to paid plan when traffic increases

---

## 📊 Free vs Paid

| Feature | Free | Paid ($7/mo) |
|---------|------|--------------|
| RAM | 512MB | 512MB+ |
| Sleep | After 15 min | Never |
| Build Minutes | 750 hrs/mo | Unlimited |
| Custom Domain | ❌ | ✅ |
| Priority Support | ❌ | ✅ |

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Backend responds at `/` endpoint
- [ ] `/documents` endpoint returns your documents
- [ ] `/chat` endpoint responds to queries
- [ ] Frontend loads without errors
- [ ] Entry UI shows your document topics
- [ ] Sample questions work
- [ ] Chat responses are accurate
- [ ] No console errors in browser

---

**All set? Share your chatbot URL and enjoy! 🚀**

Need help? Check the full guide: `RENDER_DEPLOYMENT_GUIDE.md`
