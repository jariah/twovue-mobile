from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
import uvicorn
import base64
from pydantic import BaseModel
import os
import httpx
import json
import random

app = FastAPI()

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("yolov8n.pt")  # You can use yolov8n.pt (nano), yolov8s.pt (small), etc.

class ImageData(BaseModel):
    image: str  # Base64 encoded image

# You'll need to set this environment variable with your OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

@app.post("/detect")
async def detect(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    # Lower confidence threshold to 0.25 (default is 0.5)
    results = model(image, conf=0.25, verbose=False)
    labels = []
    label_confidences = {}
    
    for r in results:
        if r.boxes is not None:
            for box, conf, cls in zip(r.boxes.xyxy, r.boxes.conf, r.boxes.cls):
                label = model.model.names[int(cls)]
                confidence = float(conf)
                # Keep track of the highest confidence for each label
                if label not in label_confidences or confidence > label_confidences[label]:
                    label_confidences[label] = confidence
    
    # Sort by confidence and return all detected objects
    sorted_labels = sorted(label_confidences.items(), key=lambda x: x[1], reverse=True)
    labels = [label for label, conf in sorted_labels]
    
    print(f"Detected {len(labels)} objects: {labels}")
    return {"labels": labels}

@app.post("/detect-base64")
async def detect_base64(data: ImageData):
    try:
        # Decode base64 image
        image_data = base64.b64decode(data.image)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        # Lower confidence threshold to 0.25 (default is 0.5)
        results = model(image, conf=0.25, verbose=False)
        labels = []
        label_confidences = {}
        
        for r in results:
            if r.boxes is not None:
                for box, conf, cls in zip(r.boxes.xyxy, r.boxes.conf, r.boxes.cls):
                    label = model.model.names[int(cls)]
                    confidence = float(conf)
                    # Keep track of the highest confidence for each label
                    if label not in label_confidences or confidence > label_confidences[label]:
                        label_confidences[label] = confidence
        
        # Sort by confidence and return all detected objects
        sorted_labels = sorted(label_confidences.items(), key=lambda x: x[1], reverse=True)
        labels = [label for label, conf in sorted_labels]
        
        print(f"Detected {len(labels)} objects: {labels}")
        return {"labels": labels}
    except Exception as e:
        print(f"Error in detect_base64: {str(e)}")
        return {"error": str(e), "labels": []}

@app.post("/detect-llm")
async def detect_llm(data: ImageData):
    """Use LLM (GPT-4 Vision) to detect objects in the image"""
    try:
        # Check if we have a valid-looking OpenAI API key
        use_mock = not OPENAI_API_KEY or OPENAI_API_KEY == "mock-key-for-testing" or not OPENAI_API_KEY.startswith("sk-")
        
        if use_mock:
            # If no OpenAI key, fall back to a mock response for testing
            print("Using mock LLM response (no valid OpenAI API key)")
            
            # Better curated objects for gameplay (removing abstract/weird ones)
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
            "max_tokens": 500  # Increased from 300
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
            
            # Log the raw response for debugging
            print(f"RAW LLM Response: {raw_content}")
            
            # Parse the comma-separated list
            labels = [obj.strip().lower() for obj in raw_content.split(',')]
            # Remove empty strings and duplicates
            labels = list(dict.fromkeys([label for label in labels if label]))
            
            # Filter out any remaining abstract concepts
            filtered_labels = [
                label for label in labels 
                if len(label) > 2 and label not in ['the', 'and', 'or', 'a', 'an']
            ]
            
            print(f"LLM detected {len(filtered_labels)} objects after filtering")
            
            return {
                "labels": filtered_labels[:30],  # Cap at 30 objects
                "raw_response": raw_content,
                "debug": {
                    "source": "openai",
                    "original_count": len(labels),
                    "filtered_count": len(filtered_labels)
                }
            }
        else:
            # Get the full error response for debugging
            try:
                error_response = response.json()
                error_message = error_response.get('error', {}).get('message', 'Unknown error')
                print(f"OpenAI API error: {response.status_code} - {error_message}")
            except:
                error_message = response.text
                print(f"OpenAI API error: {response.status_code} - {error_message}")
            
            # Fallback to mock data on API errors
            if response.status_code == 401:
                print("Authentication failed - falling back to mock data. Please check your API key and account credits.")
            elif response.status_code == 429:
                print("Rate limit exceeded - falling back to mock data.")
            elif response.status_code == 400:
                print(f"Bad request - falling back to mock data. Error: {error_message}")
            
            # Return mock data instead of error
            base_objects = [
                "person", "chair", "table", "laptop", "phone", "cup", 
                "book", "pen", "window", "door", "floor", "wall",
                "light", "picture frame", "plant", "bag", "bottle", "keyboard",
                "monitor", "mouse", "desk", "lamp", "ceiling", "carpet",
                "couch", "television", "remote control", "pillow", "blanket", "clock",
                "mirror", "shelf", "box", "paper", "notebook", "pencil",
                "glasses", "wallet", "keys", "headphones", "charger", "cable",
                "mug", "plate", "fork", "spoon", "napkin", "tissue box",
                "shoe", "jacket", "backpack", "water bottle", "coffee cup",
                "smartphone", "tablet", "watch", "calendar", "poster",
                "trash can", "outlet", "switch", "handle", "button"
            ]
            
            num_objects = random.randint(15, 25)
            selected_objects = random.sample(base_objects, min(num_objects, len(base_objects)))
            
            return {
                "labels": selected_objects,
                "raw_response": f"API Error {response.status_code}: {error_message}",
                "debug": {
                    "source": "mock_fallback",
                    "count": len(selected_objects),
                    "error_code": response.status_code,
                    "error_message": error_message
                }
            }
            
    except Exception as e:
        print(f"Error in detect_llm: {str(e)}")
        return {"error": str(e), "labels": []}

@app.post("/detect-llm-debug")
async def detect_llm_debug(data: ImageData):
    """Debug endpoint that always returns detailed information"""
    result = await detect_llm(data)
    
    # Add extra debugging info
    if "debug" not in result:
        result["debug"] = {}
    
    result["debug"]["api_key_present"] = bool(OPENAI_API_KEY)
    result["debug"]["api_key_starts_with"] = OPENAI_API_KEY[:7] if OPENAI_API_KEY else "None"
    
    return result

if __name__ == "__main__":
    print("Starting YOLO object detection server on http://localhost:8000")
    print(f"OpenAI API Key configured: {'Yes' if OPENAI_API_KEY else 'No (using mock data)'}")
    uvicorn.run(app, host="0.0.0.0", port=8000) 