# Twovue Mobile Deployment Guide

## Quick Testing Options (Easiest)

### 1. Expo Go (Immediate Testing)
Share your development server with friends:
```bash
# In your project directory
npx expo start

# This gives you a QR code
# Others can scan it with Expo Go app (iOS/Android)
```

**Pros:** Instant sharing, no build needed
**Cons:** Requires Expo Go app, only works on same network

### 2. Expo Tunneling (Remote Testing)
```bash
npx expo start --tunnel

# Creates a public URL anyone can use
# Share the expo.dev link with testers
```

**Pros:** Works anywhere, instant updates
**Cons:** Slower, requires Expo Go app

## Development Builds (Recommended for Testing)

### 3. EAS Build for Development
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account
eas login

# Configure your project
eas build:configure

# Create development builds
eas build --profile development --platform ios
eas build --profile development --platform android
```

**eas.json configuration:**
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {}
  }
}
```

## Backend Deployment

### 1. Deploy YOLO Backend (Required)
Your detection backend needs to be publicly accessible.

**Option A: Render.com (Free tier)**
```bash
# Create render.yaml in yolo-backend/
```

**render.yaml:**
```yaml
services:
  - type: web
    name: twovue-yolo-backend
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: OPENAI_API_KEY
        sync: false  # Add via Render dashboard
```

**Option B: Railway.app**
```bash
# In yolo-backend directory
railway login
railway init
railway up
```

**Option C: Heroku**
Create `Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### 2. Update API URLs
After deploying backend, update your app:

**src/services/api.ts:**
```typescript
const YOLO_API_URL = process.env.EXPO_PUBLIC_YOLO_URL || 'https://your-backend.render.com';
```

## Beta Testing

### TestFlight (iOS)
1. Build for iOS:
   ```bash
   eas build --platform ios --profile preview
   ```

2. Submit to TestFlight:
   ```bash
   eas submit -p ios
   ```

3. Add testers in App Store Connect

### Google Play Beta (Android)
1. Build for Android:
   ```bash
   eas build --platform android --profile preview
   ```

2. Submit to Google Play:
   ```bash
   eas submit -p android
   ```

## Production Deployment

### Pre-launch Checklist:
- [ ] Backend deployed and stable
- [ ] API URLs updated to production
- [ ] Mock API disabled (`USE_MOCK_API = false`)
- [ ] App icons and splash screens added
- [ ] Privacy policy and terms of service
- [ ] App store descriptions and screenshots

### Build for Production:
```bash
# iOS App Store
eas build --platform ios --profile production
eas submit -p ios

# Google Play Store
eas build --platform android --profile production
eas submit -p android
```

## Environment Variables

Create `.env` files:
```bash
# .env.development
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_YOLO_URL=http://192.168.1.204:8000

# .env.production
EXPO_PUBLIC_API_URL=https://your-api.com/api
EXPO_PUBLIC_YOLO_URL=https://your-yolo-backend.com
```

## Quick Start for Testing with Friends

1. **Deploy backend to Render (free):**
   - Sign up at render.com
   - New > Web Service
   - Connect your GitHub repo (yolo-backend)
   - Use the render.yaml config above

2. **Update your app with the Render URL**

3. **Use Expo tunneling for immediate testing:**
   ```bash
   npx expo start --tunnel
   ```

4. **Or create a development build:**
   ```bash
   eas build --profile development --platform all
   ```

This will let you and your friends test the full game experience! 