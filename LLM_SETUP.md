# LLM-Based Object Detection Setup

## Overview

The app now supports using Large Language Models (LLMs) for object detection, which provides much more comprehensive and flexible object recognition compared to YOLO.

## How It Works

When "Use AI Vision" is enabled:
- Photos are sent to an LLM (GPT-4 Vision by default)
- The LLM analyzes the entire image and identifies ALL visible objects
- Returns a comprehensive list including:
  - Common objects (furniture, electronics, etc.)
  - Architectural features (walls, doors, windows)
  - Natural elements (plants, sky, ground)
  - Abstract concepts (shadows, reflections)
  - Small details YOLO might miss

## Setup Options

### Option 1: Use Mock Data (Default - No API Key Required)

The app will work out of the box with mock data that simulates LLM responses. This is great for testing the game mechanics.

### Option 2: Use OpenAI GPT-4 Vision (Recommended)

1. Get an OpenAI API key from https://platform.openai.com
2. Set the environment variable before starting the backend:
   ```bash
   cd yolo-backend
   source venv/bin/activate
   export OPENAI_API_KEY="your-api-key-here"
   python3 main.py
   ```

### Option 3: Use Other LLMs

You can modify `yolo-backend/main.py` to use other vision-capable LLMs:
- Anthropic Claude (with vision)
- Google Gemini Vision
- Replicate's LLaVA
- Local models via Ollama

## In-App Usage

1. Toggle "Use AI Vision" ON in the game screen
2. Take a photo
3. The LLM will detect many more objects than YOLO
4. Select from a rich variety of detected objects

## Benefits Over YOLO

- **More Objects**: Detects 20-50+ objects vs YOLO's 5-10
- **Better Variety**: Includes abstract concepts, materials, colors
- **Context Awareness**: Understands relationships between objects
- **No Training Required**: Works with any object, not limited to 80 classes

## Cost Considerations

- Mock mode: Free
- OpenAI GPT-4 Vision: ~$0.01-0.02 per image
- Consider rate limiting for production use 