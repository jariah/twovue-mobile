from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import io
import uvicorn
import base64
from pydantic import BaseModel
import os
import httpx
import json
import random
import uuid
from datetime import datetime
from typing import List, Dict, Optional
import asyncio
from sqlalchemy import create_engine, Column, String, DateTime, Text, Integer, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, Session
import shutil
from pathlib import Path

app = FastAPI(title="Twovue Game API", version="1.0.0")

# Allow CORS for mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create photos directory for file storage
PHOTOS_DIR = Path("photos")
PHOTOS_DIR.mkdir(exist_ok=True)

# Serve static files (photos)
app.mount("/photos", StaticFiles(directory="photos"), name="photos")

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./twovue.db")

# Fix PostgreSQL URL format for SQLAlchemy (Railway uses postgres:// but SQLAlchemy needs postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"📊 Connecting to database: {DATABASE_URL[:50]}...")

try:
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300     # Recycle connections every 5 minutes
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    print("✅ Database engine created successfully")
except Exception as e:
    print(f"❌ Database connection error: {e}")
    # Continue anyway for debugging
    engine = None
    SessionLocal = None
    Base = None

# Database Models
class DBGame(Base):
    __tablename__ = "games"
    
    id = Column(String, primary_key=True)
    player1_name = Column(String, nullable=False)
    player2_name = Column(String, nullable=True)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DBTurn(Base):
    __tablename__ = "turns"
    
    id = Column(String, primary_key=True)
    game_id = Column(String, nullable=False)
    player_name = Column(String, nullable=False)
    photo_url = Column(String, nullable=False)
    tags = Column(Text, nullable=False)  # JSON string
    shared_tag = Column(String, nullable=False)
    detected_tags = Column(Text, nullable=False)  # JSON string
    turn_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create tables with error handling
if engine and Base:
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified successfully")
    except Exception as e:
        print(f"❌ Database table creation error: {e}")
        print("⚠️  App will continue but database features may not work")
else:
    print("⚠️  Skipping table creation due to database connection issues")

# OpenAI API configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Scientific Game ID Generator (from mobile app)
SCIENTIFIC_ADJECTIVES = [
    'quantum', 'atomic', 'neural', 'stellar', 'cosmic', 'optical', 'kinetic', 
    'thermal', 'magnetic', 'electric', 'photonic', 'sonic', 'crystalline',
    'molecular', 'orbital', 'plasma', 'gamma', 'alpha', 'beta', 'delta',
    'micro', 'nano', 'meta', 'ultra', 'hyper', 'neo', 'proto', 'pseudo',
    'cyber', 'digital', 'analog', 'synthetic', 'organic', 'bionic', 'ionic',
    'spectral', 'temporal', 'spatial', 'dimensional', 'fractal', 'holographic'
]

SCIENTIFIC_NOUNS = [
    'vector', 'matrix', 'prism', 'catalyst', 'reactor', 'generator', 'scanner',
    'analyzer', 'synthesizer', 'amplifier', 'detector', 'sensor', 'probe',
    'beacon', 'transmitter', 'receiver', 'oscillator', 'resonator', 'capacitor',
    'conductor', 'isolator', 'converter', 'processor', 'calculator', 'computer',
    'algorithm', 'protocol', 'sequence', 'pattern', 'frequency', 'wavelength',
    'spectrum', 'field', 'chamber', 'module', 'unit', 'device', 'apparatus',
    'instrument', 'mechanism', 'engine', 'turbine', 'dynamo', 'circuit',
    'array', 'grid', 'network', 'system', 'core', 'nexus', 'hub', 'node'
]

SCIENTIFIC_SUFFIXES = [
    'alpha', 'beta', 'gamma', 'delta', 'omega', 'prime', 'max', 'ultra',
    'plus', 'neo', 'pro', 'x', 'z', 'one', 'two', 'three', 'seven', 'nine'
]

def generate_scientific_game_id() -> str:
    """Generate a whimsical scientific game ID like 'quantum-vector-alpha'"""
    adjective = random.choice(SCIENTIFIC_ADJECTIVES)
    noun = random.choice(SCIENTIFIC_NOUNS)
    suffix = random.choice(SCIENTIFIC_SUFFIXES)
    return f"{adjective}-{noun}-{suffix}"

# Pydantic Models
class ImageData(BaseModel):
    image: str  # Base64 encoded image

class CreateGameRequest(BaseModel):
    player1_name: str

class JoinGameRequest(BaseModel):
    player2_name: str

class SubmitTurnRequest(BaseModel):
    player_name: str
    photo_url: str
    tags: List[str]
    shared_tag: str
    detected_tags: List[str]

class GameResponse(BaseModel):
    id: str
    player1_name: str
    player2_name: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime
    turns: List[dict]

# Database dependency with error handling
def get_db():
    if not SessionLocal:
        raise HTTPException(status_code=503, detail="Database not available")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, game_id: str):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)
        print(f"WebSocket connected to game {game_id}. Total connections: {len(self.active_connections[game_id])}")
    
    def disconnect(self, websocket: WebSocket, game_id: str):
        if game_id in self.active_connections:
            self.active_connections[game_id].remove(websocket)
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]
    
    async def broadcast_to_game(self, game_id: str, message: dict):
        if game_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[game_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    dead_connections.append(connection)
            
            # Remove dead connections
            for connection in dead_connections:
                self.active_connections[game_id].remove(connection)

manager = ConnectionManager()

# Helper Functions
def db_game_to_response(db_game: DBGame, db_turns: List[DBTurn]) -> dict:
    return {
        "id": db_game.id,
        "player1Name": db_game.player1_name,
        "player2Name": db_game.player2_name,
        "status": db_game.status,
        "createdAt": db_game.created_at.isoformat(),
        "updatedAt": db_game.updated_at.isoformat(),
        "turns": [
            {
                "id": turn.id,
                "gameId": turn.game_id,
                "playerName": turn.player_name,
                "photoUrl": turn.photo_url,
                "tags": json.loads(turn.tags),
                "sharedTag": turn.shared_tag,
                "detectedTags": json.loads(turn.detected_tags),
                "turnNumber": turn.turn_number,
                "createdAt": turn.created_at.isoformat()
            } for turn in sorted(db_turns, key=lambda x: x.turn_number)
        ]
    }

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"🌐 Incoming request: {request.method} {request.url}")
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

# Game Management Endpoints
@app.post("/games")
async def create_game(request: CreateGameRequest, db: Session = Depends(get_db)):
    """Create a new game"""
    game_id = generate_scientific_game_id()
    
    db_game = DBGame(
        id=game_id,
        player1_name=request.player1_name,
        status="WAITING_FOR_PLAYER2"
    )
    
    db.add(db_game)
    db.commit()
    
    print(f"Created game {game_id} for player {request.player1_name}")
    return {"game_id": game_id}

@app.get("/games/{game_id}")
async def get_game(game_id: str, db: Session = Depends(get_db)):
    """Get game by ID"""
    db_game = db.query(DBGame).filter(DBGame.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    db_turns = db.query(DBTurn).filter(DBTurn.game_id == game_id).all()
    
    return db_game_to_response(db_game, db_turns)

@app.post("/games/{game_id}/join")
async def join_game(game_id: str, request: JoinGameRequest, db: Session = Depends(get_db)):
    """Join an existing game"""
    db_game = db.query(DBGame).filter(DBGame.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if db_game.player2_name:
        raise HTTPException(status_code=400, detail="Game is already full")
    
    db_game.player2_name = request.player2_name
    db_game.status = "IN_PROGRESS"
    db_game.updated_at = datetime.utcnow()
    
    db.commit()
    
    print(f"Player {request.player2_name} joined game {game_id}")
    return {"message": "Successfully joined game"}

@app.post("/games/{game_id}/turns")
async def submit_turn(game_id: str, request: SubmitTurnRequest, db: Session = Depends(get_db)):
    """Submit a turn"""
    db_game = db.query(DBGame).filter(DBGame.id == game_id).first()
    if not db_game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    # Get current turn number
    existing_turns = db.query(DBTurn).filter(DBTurn.game_id == game_id).count()
    turn_number = existing_turns + 1
    
    # Create new turn
    db_turn = DBTurn(
        id=str(uuid.uuid4()),
        game_id=game_id,
        player_name=request.player_name,
        photo_url=request.photo_url,
        tags=json.dumps(request.tags),
        shared_tag=request.shared_tag,
        detected_tags=json.dumps(request.detected_tags),
        turn_number=turn_number
    )
    
    db.add(db_turn)
    
    # Update game
    db_game.updated_at = datetime.utcnow()
    db.commit()
    
    print(f"Turn {turn_number} submitted for game {game_id} by {request.player_name}")
    return {"message": "Turn submitted successfully"}

# File Upload Endpoint
@app.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    """Upload a photo and return the URL"""
    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = PHOTOS_DIR / filename
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Return URL (adjust domain for production)
    domain = os.getenv("DOMAIN", f"https://twovue-mobile-production.up.railway.app")
    photo_url = f"{domain}/photos/{filename}"
    
    print(f"Uploaded photo: {photo_url}")
    return {"photo_url": photo_url}

# Object Detection Endpoint (LLM-only)
@app.post("/detect-llm")
async def detect_llm(data: ImageData):
    """Use LLM (GPT-4 Vision) to detect objects in the image"""
    try:
        # Check if we have a valid-looking OpenAI API key
        use_mock = not OPENAI_API_KEY or OPENAI_API_KEY == "mock-key-for-testing" or not OPENAI_API_KEY.startswith("sk-")
        
        if use_mock:
            # If no OpenAI key, fall back to a mock response for testing
            print("Using mock LLM response (no valid OpenAI API key)")
            
            # Better curated objects for gameplay
            base_objects = [
                # Common indoor objects
                "person", "chair", "table", "laptop", "phone", "cup", 
                "book", "pen", "window", "door", "floor", "wall",
                "light", "picture frame", "plant", "bag", "bottle", "keyboard",
                "monitor", "mouse", "desk", "lamp", "ceiling", "carpet",
                
                # Additional objects for variety
                "couch", "television", "remote control", "pillow", "blanket", "clock",
                "mirror", "shelf", "box", "paper", "notebook", "pencil",
                "glasses", "wallet", "keys", "headphones", "charger", "cable",
                "mug", "plate", "fork", "spoon", "napkin", "tissue box",
                
                # Common items that make sense
                "shoe", "jacket", "backpack", "water bottle", "coffee cup",
                "smartphone", "tablet", "watch", "calendar", "poster",
                "trash can", "outlet", "switch", "handle", "button"
            ]
            
            # Randomly select 15-25 objects for more reasonable gameplay
            num_objects = random.randint(15, 25)
            selected_objects = random.sample(base_objects, min(num_objects, len(base_objects)))
            
            return {
                "labels": selected_objects,
                "raw_response": "MOCK DATA - No LLM used",
                "debug": {
                    "source": "mock",
                    "count": len(selected_objects)
                }
            }
        
        # Prepare the image for GPT-4 Vision
        image_base64 = data.image
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }
        
        # Improved prompt for better results
        payload = {
            "model": "gpt-4o",  # Using GPT-4o which supports vision
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyze this image and list objects that would be good for a photo scavenger hunt game. Return a comma-separated list of specific, recognizable objects (not abstract concepts). Focus on tangible items like furniture, electronics, household items, etc. Limit to 30 most prominent objects."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 500
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
        if response.status_code == 200:
            result = response.json()
            raw_content = result['choices'][0]['message']['content']
            
            # Parse the comma-separated list
            labels = [obj.strip().lower() for obj in raw_content.split(',')]
            labels = list(dict.fromkeys([label for label in labels if label]))
            
            # Filter out abstract concepts
            filtered_labels = [
                label for label in labels 
                if len(label) > 2 and label not in ['the', 'and', 'or', 'a', 'an']
            ]
            
            print(f"LLM detected {len(filtered_labels)} objects after filtering")
            
            return {
                "labels": filtered_labels[:30],
                "raw_response": raw_content,
                "debug": {
                    "source": "openai",
                    "original_count": len(labels),
                    "filtered_count": len(filtered_labels)
                }
            }
        else:
            # Fallback to mock data on API errors
            print(f"OpenAI API error: {response.status_code}")
            
            base_objects = [
                "person", "chair", "table", "laptop", "phone", "cup", 
                "book", "pen", "window", "door", "floor", "wall",
                "light", "picture frame", "plant", "bag", "bottle", "keyboard",
                "monitor", "mouse", "desk", "lamp", "ceiling", "carpet"
            ]
            
            num_objects = random.randint(15, 25)
            selected_objects = random.sample(base_objects, min(num_objects, len(base_objects)))
            
            return {
                "labels": selected_objects,
                "raw_response": f"API Error {response.status_code}",
                "debug": {
                    "source": "mock_fallback",
                    "count": len(selected_objects),
                    "error_code": response.status_code
                }
            }
            
    except Exception as e:
        print(f"Error in detect_llm: {str(e)}")
        return {"error": str(e), "labels": []}

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
    print(f"🤖 OpenAI configured: {bool(OPENAI_API_KEY and OPENAI_API_KEY.startswith('sk-'))}")
    print(f"📸 Photos directory: {PHOTOS_DIR}")
    print(f"🗄️  Database engine: {'OK' if engine else 'Failed'}")
    print("✅ Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=port) 