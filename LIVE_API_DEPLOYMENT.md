# 🚀 Live API Deployment Guide

This guide will help you deploy the complete Twovue backend with real-time multiplayer functionality.

## 📋 What You'll Get

- **Real-time multiplayer** with WebSocket notifications
- **Photo upload and storage** 
- **PostgreSQL database** for persistent game data
- **Live object detection** with OpenAI GPT-4 Vision
- **Production-ready deployment** on Railway
- **Cross-device synchronization** without manual refresh

## 🛠️ Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Account**: Your code needs to be in a GitHub repo
3. **OpenAI API Key**: Get one from [platform.openai.com](https://platform.openai.com)

## 📦 Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
cd /Users/jamiebelsky/twovue-mobile
git add .
git commit -m "Add live API backend"
git push origin main
```

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create New Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `twovue-mobile` repository

### 2.2 Configure Service
1. Railway will detect multiple buildable paths
2. Choose the `yolo-backend` directory as your service root
3. Or manually set the root directory to `/yolo-backend`

### 2.3 Add Environment Variables
In your Railway project dashboard, go to Variables and add:

```
OPENAI_API_KEY=your_openai_api_key_here
```

### 2.4 Add PostgreSQL Database
1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically set the `DATABASE_URL` variable

### 2.5 Deploy
1. Railway will automatically deploy when you push to GitHub
2. Get your deployment URL from the Railway dashboard
3. It will look like: `https://twovue-backend-production.up.railway.app`

## 📱 Step 3: Update Mobile App

### 3.1 Update API Configuration
Edit `src/services/api.ts`:

```typescript
const USE_MOCK_API = false; // Switch to live APIs
const API_BASE_URL = 'https://your-railway-url.up.railway.app'; // Your Railway URL
```

### 3.2 Add WebSocket Support (Optional)
Edit `src/screens/GameScreen.tsx` to add real-time updates:

```typescript
import { WebSocketService } from '../services/websocket';

// In your GameScreen component:
useEffect(() => {
  if (!USE_MOCK_API && gameId) {
    const wsService = WebSocketService.getInstance(gameId);
    wsService.connect(API_BASE_URL);
    
    const handleMessage = (message: any) => {
      if (message.type === 'turn_submitted') {
        // Reload game data when opponent submits turn
        loadGame();
      }
      if (message.type === 'player_joined') {
        // Show notification when player joins
        Alert.alert('Player Joined!', message.message);
        loadGame();
      }
    };
    
    wsService.addListener(handleMessage);
    
    return () => {
      wsService.removeListener(handleMessage);
    };
  }
}, [gameId]);
```

## 🧪 Step 4: Test the System

### 4.1 Test Backend Health
Visit: `https://your-railway-url.up.railway.app/health`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "openai_configured": true
}
```

### 4.2 Test Game Flow
1. **Create Game**: One device creates a new game
2. **Join Game**: Second device joins using Game ID
3. **Take Photos**: Alternate taking photos and selecting objects
4. **Real-time Updates**: Changes should appear instantly on both devices

### 4.3 Test Object Detection
- Take photos and verify GPT-4 Vision detects objects properly
- Check Railway logs if detection fails

## 🔧 Step 5: Production Optimizations

### 5.1 Environment-Specific Settings
```typescript
// In src/services/api.ts
const __DEV__ = process.env.NODE_ENV === 'development';
const USE_MOCK_API = __DEV__; // Automatically use mock in development
```

### 5.2 Error Handling
Add comprehensive error handling for network issues:

```typescript
// In api.ts
static async createGame(player1Name: string): Promise<{ game_id: string }> {
  try {
    if (USE_MOCK_API) {
      return MockGameAPI.createGame(player1Name);
    }
    
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player1_name: player1Name }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Create game error:', error);
    // Fallback to mock API on network failure
    return MockGameAPI.createGame(player1Name);
  }
}
```

## 💰 Cost Breakdown

### Railway (Backend + Database)
- **Hobby Plan**: $5/month per service
- **Backend**: $5/month
- **PostgreSQL**: $5/month
- **Total**: $10/month

### OpenAI API (Object Detection)
- **GPT-4 Vision**: ~$0.01 per image
- **Estimated**: $5-20/month depending on usage

### **Total Monthly Cost**: ~$15-30/month

## 🚨 Troubleshooting

### Backend Won't Start
1. Check Railway logs for Python/dependency errors
2. Verify all environment variables are set
3. Ensure `requirements.txt` has all dependencies

### Object Detection Fails
1. Verify OpenAI API key is valid and has credits
2. Check if API key has GPT-4 Vision access
3. Review Railway logs for API errors

### WebSocket Connection Issues
1. Ensure Railway allows WebSocket connections (it should by default)
2. Check browser/mobile network for WebSocket blocking
3. Verify the WebSocket URL format

### Database Connection Errors
1. Ensure PostgreSQL service is running on Railway
2. Check if `DATABASE_URL` environment variable is set
3. Verify database tables were created (check logs)

### Photo Upload Issues
1. Check Railway storage limits (500MB free)
2. Verify file permissions in `/photos` directory
3. Ensure `photos` directory is created and writable

## 🎯 Next Steps

1. **Deploy Backend**: Follow Railway deployment steps
2. **Update Mobile App**: Switch `USE_MOCK_API = false`
3. **Test End-to-End**: Verify all functionality works
4. **Add WebSockets**: Implement real-time updates
5. **Monitor Performance**: Use Railway metrics dashboard

## 📞 Support

If you encounter issues:
1. Check Railway logs for backend errors
2. Test API endpoints directly with curl/Postman
3. Verify environment variables are correctly set
4. Review this guide for missed steps

The live API system will provide a much better user experience with real-time synchronization and persistent game data across devices! 