# Security Best Practices

## ⚠️ IMPORTANT: Protecting Your API Keys

### Files That Contain Sensitive Data:
- `backend/.env` - **NEVER commit this file!**
- `backend/data/` - Contains embeddings (optional to exclude)
- `backend/knowledge_base/` - May contain proprietary documents

### Already Protected:
✅ `.gitignore` configured to exclude:
- `.env` files
- Virtual environments
- Logs
- Model cache
- RAG data folders

### Before Deploying or Sharing:
1. ✅ Check `.gitignore` is in place
2. ✅ Use `backend/.env.example` as template (no real keys)
3. ✅ Remove exposed keys from git history if needed:
   ```bash
   git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/.env" --prune-empty --tag-name-filter cat -- --all
   ```
4. ✅ Rotate (regenerate) any exposed API keys immediately

### For Deployment:
- Set environment variables in your hosting platform (Render, Railway, Vercel, etc.)
- Never hardcode keys in source code
- Use secrets management (GitHub Secrets, environment variables)

### Your Current API Keys:
🔴 **ACTION REQUIRED**: Your keys in `backend/.env` were visible. You should:
1. Go to Google Cloud Console and regenerate your Gemini API key
2. Go to OpenAI and regenerate your API key
3. Go to HuggingFace and regenerate your token
4. Update `backend/.env` locally with new keys
5. Keep `backend/.env` only on your local machine

The `.gitignore` is now configured to prevent future exposure.
