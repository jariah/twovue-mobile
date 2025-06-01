# 🚂 Railway Deployment Quick Checklist

Use this alongside the detailed guide for a quick deployment reference.

## ✅ Pre-Deployment (5 minutes)

- [ ] Code committed and pushed to GitHub
- [ ] Railway account created at [railway.app](https://railway.app)
- [ ] OpenAI API key ready: `your_openai_api_key_here`

## 🚂 Railway Setup (10 minutes)

- [ ] Login to Railway with GitHub
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Select `twovue-mobile` repository
- [ ] Set Root Directory to: `yolo-backend`
- [ ] Wait for initial build (will likely fail - expected!)

## 🗄️ Database Setup (3 minutes)

- [ ] Click "New Service" → "Database" → "PostgreSQL"
- [ ] Verify `DATABASE_URL` is auto-set in backend service
- [ ] Database shows as "Active"

## 🔑 Environment Variables (5 minutes)

Go to Backend Service → Settings → Variables:

- [ ] Add `OPENAI_API_KEY`: `your_openai_api_key_here`
- [ ] Save and wait for redeploy

## 🚀 Verify Deployment (5 minutes)

- [ ] Check Deployments tab - should show "Active"
- [ ] Copy Public URL from Settings → Networking
- [ ] Test health endpoint: `https://your-url.up.railway.app/health`
- [ ] Should return: `{"status": "healthy", "openai_configured": true}`

## 📱 Update Mobile App (2 minutes)

Edit `src/services/api.ts`:

- [ ] Change `USE_MOCK_API = true` to `USE_MOCK_API = false`
- [ ] Update `API_BASE_URL` to your Railway URL
- [ ] Test app - should connect to live backend

## 🧪 Test Everything (10 minutes)

- [ ] Create new game on one device
- [ ] Join game on second device using Game ID
- [ ] Take photo and submit turn
- [ ] Verify other device sees the turn
- [ ] Check Railway logs for successful requests

## 🎯 Total Time: ~40 minutes

---

## 🚨 Troubleshooting Quick Fixes

**Build Failed?**
- Check `yolo-backend/` contains `main.py`, `requirements.txt`, `yolov8n.pt`
- Verify Root Directory is set to `yolo-backend`

**Health Check Failed?**
- Verify `OPENAI_API_KEY` is set correctly
- Check deployment logs for Python errors

**Mobile App Can't Connect?**
- Verify `API_BASE_URL` matches your Railway URL exactly
- Check `USE_MOCK_API = false` in api.ts

**Database Errors?**
- Ensure PostgreSQL service is running
- Verify `DATABASE_URL` is automatically set

---

## 📋 Environment Variables Reference

Copy-paste these into Railway:

**Variable:** `OPENAI_API_KEY`  
**Value:** `your_openai_api_key_here`

**Variable:** `DATABASE_URL`  
**Value:** `(Automatically set by Railway PostgreSQL service)`

---

## 🎉 Success Indicators

✅ Railway dashboard shows "Active" status  
✅ Health endpoint returns success  
✅ Mobile app creates games successfully  
✅ Cross-device gameplay works  
✅ Photos upload and object detection works  

Your live multiplayer backend is ready! 🚀 