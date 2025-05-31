#!/bin/bash

# Start script for YOLO backend with OpenAI API key

echo "Starting YOLO backend with OpenAI API key..."

# Check if API key is provided
if [ -z "$1" ]; then
    echo "Usage: ./start_with_openai.sh YOUR_OPENAI_API_KEY"
    echo "Example: ./start_with_openai.sh sk-proj-xxxxx"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Set the OpenAI API key
export OPENAI_API_KEY="$1"

# Start the backend
echo "Starting backend with LLM support enabled..."
python3 main.py 