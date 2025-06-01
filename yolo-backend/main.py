from fastapi import FastAPI
import uvicorn
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
    print("🚀 Starting minimal Twovue API server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000) 