# Quick Guide: Test Twovue with Friends NOW! 🎮

## Option 1: Fastest (5 minutes) - Expo Tunnel

1. **Stop your current Expo server** (Ctrl+C)

2. **Install ngrok for tunneling:**
   ```bash
   npm install -g @expo/ngrok
   ```

3. **Start with tunnel:**
   ```bash
   npx expo start --tunnel
   ```

4. **Share the link with friends:**
   - They need the Expo Go app (iOS/Android)
   - Send them the `exp://` link that appears
   - They can play immediately!

## Option 2: Deploy Backend First (30 minutes)

### Step 1: Deploy Backend to Render (Free)

1. **Push yolo-backend to GitHub:**
   ```bash
   cd yolo-backend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Sign up/login
   - New > Web Service
   - Connect your GitHub repo
   - It will auto-detect the render.yaml
   - Deploy!

3. **Get your backend URL** (like `https://twovue-yolo-backend.onrender.com`)

### Step 2: Update Your App

1. **Update the backend URL:**
   ```typescript
   // src/services/api.ts
   const YOLO_API_URL = 'https://twovue-yolo-backend.onrender.com';
   ```

2. **Restart Expo with tunnel:**
   ```bash
   npx expo start --tunnel
   ```

### Step 3: Test with Friends!
- Share the Expo link
- Both players can now play from anywhere!

## Playing Instructions for Testers

1. **Player 1:**
   - Open app > Enter name > Create Game
   - Take photo > Select 3 objects > Submit
   - Share game ID with Player 2

2. **Player 2:**
   - Open app > Enter name > Join Game (paste ID)
   - See Player 1's photo and tags
   - Take photo with at least 1 matching object
   - Select 2 new objects > Submit

3. **Continue alternating turns!**

## Troubleshooting

**"Backend error"**: Make sure backend is deployed and URL is updated
**"No objects detected"**: Toggle "Use AI Vision" for better detection
**Can't connect**: Make sure both players are using the tunnel link

## Next Steps

Once testing is successful, consider:
- Creating proper development builds with EAS
- Setting up TestFlight for iOS beta testing
- Adding the game state backend (currently using mock) 