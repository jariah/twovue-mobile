# 🚂 Detailed Railway Deployment Guide for Twovue Backend

This is a comprehensive, step-by-step guide to deploy your Twovue backend to Railway with real-time multiplayer functionality.

## 🎯 Overview

You'll be deploying:
- **FastAPI backend** with game management endpoints
- **PostgreSQL database** for persistent storage
- **WebSocket support** for real-time updates
- **File upload system** for photos
- **OpenAI GPT-4 Vision integration** for object detection

## 📋 Pre-Deployment Checklist

✅ Code is committed and pushed to GitHub  
✅ Railway account created  
✅ OpenAI API key ready  
✅ Backend files are in `yolo-backend/` directory  

## 🔧 Step 1: Prepare Repository

### 1.1 Verify File Structure
Your repository should look like this:
```
twovue-mobile/
├── yolo-backend/
│   ├── main.py              ← Complete FastAPI backend
│   ├── requirements.txt     ← All dependencies
│   ├── railway.toml         ← Railway config
│   └── yolov8n.pt          ← YOLO model file
├── src/                     ← React Native app
└── ... (other files)
```

### 1.2 Commit and Push Changes
```bash
cd /Users/jamiebelsky/twovue-mobile
git add .
git commit -m "Add complete live API backend for Railway deployment"
git push origin main
```

## 🚂 Step 2: Create Railway Project

### 2.1 Sign Up/Login to Railway
1. Go to [railway.app](https://railway.app)
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with GitHub (recommended for easy repo access)

### 2.2 Create New Project
1. Click **"New Project"** (big blue button)
2. Select **"Deploy from GitHub repo"**
3. You'll see a list of your repositories
4. Click on **"twovue-mobile"** repository

### 2.3 Configure Service Root Directory
**Important**: Railway needs to know which directory contains your backend.

1. After selecting your repo, Railway will scan for buildable content
2. Click **"Configure"** or **"Settings"** 
3. Set **"Root Directory"** to: `yolo-backend`
4. Or if prompted, select the `yolo-backend` folder from the detected options

### 2.4 Initial Deployment
1. Railway will automatically start building
2. You'll see a build log in the dashboard
3. **This first deployment will likely fail** - that's expected! We need to add environment variables.

## 🗄️ Step 3: Add PostgreSQL Database

### 3.1 Add Database Service
1. In your Railway project dashboard, click **"New Service"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will automatically provision the database

### 3.2 Verify Database Connection
1. Go to the PostgreSQL service in your dashboard
2. Click on the **"Connect"** tab
3. You should see connection details and environment variables
4. Railway automatically sets `DATABASE_URL` for your backend service

## 🔑 Step 4: Configure Environment Variables

### 4.1 Access Variables Settings
1. Click on your **backend service** (not the database)
2. Go to **"Settings"** tab
3. Click **"Environment"** or **"Variables"**

### 4.2 Add Required Variables
Add these environment variables one by one:

**OPENAI_API_KEY**
```
your_openai_api_key_here
```

**DOMAIN** (will be auto-set, but you can manually set it)
```
https://${{ RAILWAY_PUBLIC_DOMAIN }}
```

**Note**: Railway automatically provides `DATABASE_URL` from the PostgreSQL service.

### 4.3 Save and Redeploy
1. Click **"Save"** after adding each variable
2. Railway will automatically trigger a new deployment
3. Watch the build logs for any errors

## 🚀 Step 5: Monitor Deployment

### 5.1 Check Build Logs
1. Go to **"Deployments"** tab in your backend service
2. Click on the latest deployment
3. Watch the logs for:
   ```
   Installing dependencies from requirements.txt...
   Building application...
   🚀 Starting Twovue Game API server on http://0.0.0.0:8000
   ```

### 5.2 Common Build Issues and Solutions

**Issue: "No module named 'sqlalchemy'"**
```bash
# Solution: requirements.txt might not be found
# Verify the file is in yolo-backend/ directory
```

**Issue: "YOLO model not found"**
```bash
# Solution: Ensure yolov8n.pt is in yolo-backend/ directory
# File should be ~6MB
```

**Issue: "Port binding failed"**
```bash
# Solution: Railway expects port 8000 (already configured in main.py)
# No action needed if using our main.py
```

### 5.3 Successful Deployment Indicators
✅ Build completes without errors  
✅ Health check passes  
✅ Service shows "Active" status  
✅ Public URL is generated  

## 🌐 Step 6: Get Your Deployment URL

### 6.1 Find Your Public URL
1. In your backend service dashboard
2. Look for **"Settings"** → **"Networking"**
3. You'll see a URL like: `https://twovue-backend-production-abc123.up.railway.app`
4. Copy this URL - you'll need it for the mobile app

### 6.2 Test Health Endpoint
Visit: `https://your-railway-url.up.railway.app/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:30:00.000Z",
  "openai_configured": true
}
```

## 🧪 Step 7: Test API Endpoints

### 7.1 Test Game Creation
```bash
curl -X POST https://your-railway-url.up.railway.app/games \
  -H "Content-Type: application/json" \
  -d '{"player1_name": "TestPlayer"}'
```

Expected response:
```json
{
  "game_id": "12345678-1234-1234-1234-123456789abc"
}
```

### 7.2 Test Object Detection
```bash
curl -X POST https://your-railway-url.up.railway.app/detect-llm \
  -H "Content-Type: application/json" \
  -d '{"image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="}'
```

Expected response:
```json
{
  "labels": ["person", "chair", "table", "laptop"],
  "debug": {"source": "mock", "count": 15}
}
```

## 📱 Step 8: Update Mobile App

### 8.1 Update API Configuration
Edit `src/services/api.ts`:

```typescript
// Replace this line:
const USE_MOCK_API = true;
// With:
const USE_MOCK_API = false;

// Replace this line:
const API_BASE_URL = 'https://your-backend-url.railway.app';
// With your actual Railway URL:
const API_BASE_URL = 'https://twovue-backend-production-abc123.up.railway.app';
```

### 8.2 Test Mobile App Connection
1. Build and run your mobile app
2. Try creating a new game
3. The app should now use the live Railway backend
4. Check Railway logs to see incoming requests

## 🚨 Troubleshooting Common Issues

### Issue: "Service Crashed" or "Build Failed"

**Check Build Logs:**
1. Go to Deployments tab
2. Click on failed deployment
3. Look for error messages

**Common Solutions:**
```bash
# Missing dependencies
Add missing packages to requirements.txt

# Wrong Python version
Railway uses Python 3.11 by default (should work)

# File path issues
Ensure all files are in yolo-backend/ directory
```

### Issue: "Database Connection Failed"

**Verify Database:**
1. Check PostgreSQL service is running
2. Verify DATABASE_URL is automatically set
3. Check connection logs in backend service

**Manual Fix:**
```python
# In Railway dashboard, get DATABASE_URL from PostgreSQL service
# Add it manually to backend environment variables if needed
```

### Issue: "OpenAI API Errors"

**Check API Key:**
1. Verify the key starts with `sk-proj-`
2. Test the key at platform.openai.com
3. Ensure account has credits

**Fallback Behavior:**
- If OpenAI fails, backend automatically uses mock data
- Check logs for "Using mock LLM response" messages

### Issue: "WebSocket Connection Failed"

**Railway WebSocket Support:**
- Railway supports WebSockets by default
- No additional configuration needed
- Check firewall/network restrictions on client side

### Issue: "Photo Upload Failed"

**Check Storage:**
1. Railway provides 500MB storage on free tier
2. Photos are stored in `/photos` directory
3. Check file permissions in deployment logs

## 📊 Monitoring and Maintenance

### 10.1 Railway Dashboard Monitoring
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: History of all deployments
- **Usage**: Track requests and data transfer

### 10.2 Log Monitoring
Watch for these log entries:
```bash
✅ "Created game {id} for player {name}"
✅ "Player {name} joined game {id}"  
✅ "Turn {number} submitted for game {id}"
✅ "LLM detected {count} objects"
❌ "OpenAI API error: {status}"
❌ "Database connection failed"
```

### 10.3 Performance Optimization
```python
# For production, consider:
# 1. Database connection pooling (already configured)
# 2. Redis for caching (optional)
# 3. CDN for photo serving (Railway handles this)
# 4. Rate limiting (can add if needed)
```

## 💰 Cost Management

### 11.1 Railway Pricing
- **Hobby Plan**: $5/month per service
- **Backend Service**: $5/month
- **PostgreSQL**: $5/month
- **Total**: $10/month + usage

### 11.2 OpenAI Costs
- **GPT-4o Vision**: ~$0.01 per image analysis
- **Estimated Monthly**: $5-20 depending on usage
- **Monitor**: Check usage at platform.openai.com

### 11.3 Cost Optimization Tips
```python
# 1. Use mock fallback when OpenAI quota exceeded
# 2. Implement image caching for repeat detection
# 3. Compress photos before upload
# 4. Set up usage alerts in Railway dashboard
```

## 🎯 Final Verification Checklist

✅ Backend deployed successfully on Railway  
✅ PostgreSQL database connected  
✅ Health endpoint returns "healthy"  
✅ Game creation API works  
✅ Object detection API works  
✅ Mobile app connects to live backend  
✅ Cross-device gameplay functions  
✅ WebSocket notifications work (if implemented)  
✅ Photo upload/storage works  
✅ Environment variables are secure  

## 🎉 Congratulations!

Your Twovue backend is now live on Railway with:
- ✅ **Real-time multiplayer gaming**
- ✅ **Persistent game data**
- ✅ **Live object detection**
- ✅ **Cross-device synchronization**
- ✅ **Production-ready infrastructure**

The live system will provide a much better user experience than the mock API, with instant updates and persistent game state across devices!

## 📞 Support

If you run into issues:

1. **Check Railway Logs**: Most issues show up in deployment/runtime logs
2. **Verify Environment Variables**: Missing variables cause most failures
3. **Test API Endpoints**: Use curl to test individual endpoints
4. **Check GitHub Repository**: Ensure all files are committed
5. **Railway Documentation**: [docs.railway.app](https://docs.railway.app)

Your app is now ready for production use! 🚀 