from fastapi import FastAPI, Request
import uvicorn
import os
from datetime import datetime

# Create the FastAPI app
app = FastAPI(title="Twovue Game API", version="1.0.0")

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"🌐 Incoming request: {request.method} {request.url}")
    print(f"📋 Headers: {dict(request.headers)}")
    response = await call_next(request)
    print(f"✅ Response: {response.status_code}")
    return response

# Root endpoint
@app.get("/")
async def root():
    print("🏠 Root endpoint hit!")
    return {
        "message": "Twovue Game API is running!",
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "port": os.getenv("PORT", "unknown")
    }

# Simple health check endpoint
@app.get("/health")
async def health_check():
    print("❤️ Health check hit!")
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "twovue-api",
        "port": os.getenv("PORT", "unknown")
    }

# Debug endpoint
@app.get("/debug")
async def debug():
    print("🔍 Debug endpoint hit!")
    return {
        "message": "Debug endpoint working!",
        "env": {
            "PORT": os.getenv("PORT"),
            "HOST": "0.0.0.0"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    # Use Railway's PORT environment variable, default to 8000
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starting Twovue API server on 0.0.0.0:{port}")
    print(f"📊 PORT env var: {os.getenv('PORT', 'not set')}")
    uvicorn.run(app, host="0.0.0.0", port=port) 