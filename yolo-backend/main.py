from fastapi import FastAPI
import uvicorn
import os
from datetime import datetime

# Create the FastAPI app
app = FastAPI(title="Twovue Game API", version="1.0.0")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Twovue Game API is running!",
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat()
    }

# Simple health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "twovue-api"
    }

if __name__ == "__main__":
    # Use Railway's PORT environment variable, default to 8000
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting Twovue API server on 0.0.0.0:{port}")
    print(f"📊 PORT env var: {os.getenv('PORT', 'not set')}")
    uvicorn.run(app, host="0.0.0.0", port=port) 