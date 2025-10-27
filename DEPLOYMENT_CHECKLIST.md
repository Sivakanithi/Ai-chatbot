# 🚀 Render Deployment Checklist

Use this checklist to ensure a smooth deployment to Render.

---

## Pre-Deployment Checklist

### 📁 Files & Code
- [ ] All code changes committed to Git
- [ ] Documents in `backend/knowledge_base/` folder
- [ ] `.env` file NOT tracked in Git (use `.env.example` instead)
- [ ] `requirements.txt` includes `gunicorn`
- [ ] `gunicorn_config.py` exists in backend folder
- [ ] Frontend `App.js` uses `API_BASE_URL` variable

### 🔐 Security
- [ ] No API keys in code
- [ ] `.gitignore` properly configured
- [ ] Environment variables ready for Render

### ✅ Testing
- [ ] Tested locally (backend on port 5000)
- [ ] Tested locally (frontend on port 3000)
- [ ] Chat functionality works
- [ ] Documents load correctly
- [ ] Sample questions work

---

## Deployment Checklist

### Step 1: GitHub
- [ ] Created GitHub account (if needed)
- [ ] Repository pushed to GitHub
- [ ] All changes committed and pushed

### Step 2: Render Account
- [ ] Signed up at https://render.com
- [ ] Connected GitHub account
- [ ] Authorized Render access

### Step 3: Backend Deployment
- [ ] Created new Web Service
- [ ] Selected correct repository
- [ ] Set Root Directory to `backend`
- [ ] Set Build Command: `pip install -r requirements.txt`
- [ ] Set Start Command: `gunicorn -c gunicorn_config.py app:app`
- [ ] Added environment variable: `USE_LOCAL_MODEL=1`
- [ ] Added environment variable: `LOCAL_MODEL_NAME=google/flan-t5-small`
- [ ] Added environment variable: `FLASK_HOST=0.0.0.0`
- [ ] Added environment variable: `PYTHON_VERSION=3.11.0`
- [ ] Clicked "Create Web Service"
- [ ] Waited for deployment to complete (10-15 minutes)
- [ ] Noted backend URL (e.g., `https://ai-chatbot-backend.onrender.com`)
- [ ] Tested backend at: `https://your-backend-url.onrender.com/`
- [ ] Tested `/documents` endpoint

### Step 4: Frontend Configuration
- [ ] Created `frontend/.env.production` file
- [ ] Added `REACT_APP_API_URL=https://your-backend-url.onrender.com`
- [ ] Replaced `your-backend-url` with actual backend URL
- [ ] Committed and pushed to GitHub

### Step 5: Frontend Deployment
- [ ] Created new Static Site
- [ ] Selected same repository
- [ ] Set Root Directory to `frontend`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Publish Directory: `build`
- [ ] Clicked "Create Static Site"
- [ ] Waited for deployment (3-5 minutes)
- [ ] Noted frontend URL (e.g., `https://ai-chatbot-frontend.onrender.com`)

---

## Post-Deployment Checklist

### Testing
- [ ] Opened frontend URL in browser
- [ ] Entry UI displays correctly
- [ ] Document topics show up
- [ ] Sample questions appear
- [ ] Clicked a sample question
- [ ] Bot responded correctly
- [ ] Typed custom question
- [ ] Bot responded correctly
- [ ] No console errors in browser
- [ ] Backend logs show no errors

### Verification
- [ ] Backend health check: `curl https://your-backend-url.onrender.com/`
- [ ] Documents endpoint: `curl https://your-backend-url.onrender.com/documents`
- [ ] Chat endpoint works (test with Postman or curl)
- [ ] Frontend loads without errors
- [ ] All images/assets load correctly
- [ ] Chat interface is responsive
- [ ] Mobile view works (test on phone)

### Performance
- [ ] First response time acceptable (5-10 seconds for free tier)
- [ ] Subsequent responses faster
- [ ] No timeout errors
- [ ] Memory usage within limits (check Render logs)

---

## Troubleshooting Checklist

### Backend Issues
- [ ] Checked Render logs for errors
- [ ] Verified all environment variables set correctly
- [ ] Confirmed `gunicorn` in requirements.txt
- [ ] Tested with smaller model if memory issues (`flan-t5-small`)
- [ ] Checked that documents are in GitHub repo
- [ ] Verified Python version compatibility

### Frontend Issues
- [ ] Checked browser console for errors
- [ ] Verified `REACT_APP_API_URL` is correct
- [ ] Checked for CORS errors (should be handled by `flask-cors`)
- [ ] Confirmed backend is running (not sleeping)
- [ ] Tested API endpoints directly with curl
- [ ] Cleared browser cache and retested

### Common Errors
- [ ] "Out of memory" → Switch to `flan-t5-small`
- [ ] "Connection refused" → Backend not running or wrong URL
- [ ] "CORS error" → Check `flask-cors` is installed
- [ ] "Module not found" → Missing dependency in requirements.txt
- [ ] "Documents not found" → Documents not in GitHub repo
- [ ] "404 Not Found" → Check Root Directory settings

---

## Optimization Checklist (Optional)

### Performance
- [ ] Consider upgrading to paid plan for better performance
- [ ] Enable caching if needed
- [ ] Optimize model loading time
- [ ] Add loading states in frontend

### Features
- [ ] Add custom domain (paid plans only)
- [ ] Set up monitoring/alerts
- [ ] Configure auto-scaling (if needed)
- [ ] Add analytics tracking

### Maintenance
- [ ] Document your deployment process
- [ ] Set up backup strategy for documents
- [ ] Plan for future updates
- [ ] Monitor usage and costs

---

## Final Checklist

- [ ] Both services deployed successfully
- [ ] URLs noted and saved
- [ ] Tested all core functionality
- [ ] No errors in production
- [ ] Shared URL with team/users
- [ ] Documented any custom configurations
- [ ] Celebrated successful deployment! 🎉

---

## Quick Reference

**Backend URL**: `https://_____________________.onrender.com`
**Frontend URL**: `https://_____________________.onrender.com`

**Deployment Date**: _______________
**Deployed By**: _______________

---

## Need Help?

- 📖 See `QUICK_DEPLOY.md` for step-by-step guide
- 📚 See `RENDER_DEPLOYMENT_GUIDE.md` for detailed documentation
- 🐛 Check Render logs for error messages
- 💬 Render support: https://render.com/docs

---

**Status**: 
- [ ] Ready to Deploy
- [ ] Deployment In Progress
- [ ] Successfully Deployed ✅
