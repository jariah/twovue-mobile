# Twovue Mobile

A creative turn-based photo game where players exchange photos and match objects using AI object detection.

## Game Overview

Twovue is a multiplayer game where:
1. Player 1 takes a photo and selects 3 objects detected by AI
2. Player 2 must take a photo containing at least 1 of those objects, then selects 2 new objects
3. Players continue alternating, always maintaining at least 1 shared object between consecutive photos
4. The game creates a visual chain of connected photos through common objects

## Setup

### Prerequisites

- Node.js and npm
- Python 3.x (for YOLO backend)
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator, or physical device with Expo Go app

### Installation

```bash
# Install React Native dependencies
npm install

# Set up Python environment for YOLO backend
cd yolo-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..
```

### Running the App

You'll need to run two services:

#### 1. Start the YOLO Object Detection Backend

In a terminal window:
```bash
cd yolo-backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python3 main.py
```

The YOLO backend will run on `http://localhost:8000`

#### 2. Start the React Native App

In another terminal window:
```bash
npm start
```

Then:
- **On Physical Device**: Install Expo Go app and scan the QR code
- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Web Browser**: Press `w` (limited functionality)

## Configuration

### API Backend

The app expects a Twovue API backend. You can either:
1. Use an existing deployment
2. Run the original Twovue Next.js backend locally

Update the API URLs in `src/services/api.ts`:

```typescript
const API_BASE_URL = 'your-api-url/api';
const YOLO_API_URL = 'http://localhost:8000';  // Default YOLO backend URL
```

## Features

- **Camera Integration**: Native camera access for photo capture
- **AI Object Detection**: Real-time object detection using YOLO v8
- **Turn-based Multiplayer**: Asynchronous gameplay with friends
- **Share Functionality**: Easy game sharing via native share sheet
- **Local Storage**: Persistent player name and game history
- **Beautiful UI**: Gradient backgrounds and smooth animations

## Project Structure

```
src/
├── screens/          # Main app screens
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   └── GameScreen.tsx
├── services/         # API communication
│   └── api.ts
├── types/           # TypeScript interfaces
│   └── game.ts
└── utils/           # Utility functions
    └── storage.ts

yolo-backend/         # YOLO object detection service
├── main.py          # FastAPI server
├── requirements.txt # Python dependencies
└── yolov8n.pt       # YOLO model weights
```

## Development

The app is built with:
- React Native with Expo
- TypeScript for type safety
- React Navigation for routing
- AsyncStorage for local data
- Expo Camera for photo capture
- YOLO v8 for object detection

## Troubleshooting

- **Camera Permission Denied**: Go to device settings and enable camera permission for Expo Go
- **Object Detection Failed**: Ensure YOLO backend is running on port 8000
- **Python Command Not Found**: Use `python3` instead of `python` on macOS/Linux
- **API Connection Issues**: Check backend URLs and network connectivity

## Quick Start Script (Optional)

For convenience, you can create a script to run both services:

```bash
# Create a file called start.sh
#!/bin/bash
cd yolo-backend && source venv/bin/activate && python3 main.py &
cd .. && npm start
```

Make it executable: `chmod +x start.sh`
Then run: `./start.sh`

## Contributing

1. Ensure code follows TypeScript best practices
2. Test on both iOS and Android platforms
3. Maintain the visual consistency with gradient themes 