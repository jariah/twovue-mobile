#!/bin/bash

echo "Starting Twovue Mobile..."

# Start YOLO backend in background
echo "Starting YOLO object detection backend..."
cd yolo-backend
source venv/bin/activate
python3 main.py &
YOLO_PID=$!
cd ..

# Give YOLO backend a moment to start
sleep 2

# Start Expo
echo "Starting React Native app..."
npm start

# When Expo is closed, also kill the YOLO backend
kill $YOLO_PID 2>/dev/null
echo "Stopped YOLO backend" 