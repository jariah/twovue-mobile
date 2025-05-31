import { Game, Turn, DetectionResult } from '../types/game';
import { MockGameAPI } from './mockApi';

// Configure your backend URL here
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const LLM_API_URL = process.env.EXPO_PUBLIC_LLM_URL || 'http://192.168.1.204:8000';

// Set to true to use mock API (for testing without backend)
const USE_MOCK_API = true;

export class GameAPI {
  static async createGame(player1Name: string): Promise<{ game_id: string }> {
    if (USE_MOCK_API) {
      return MockGameAPI.createGame(player1Name);
    }
    
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player1_name: player1Name }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create game');
    }
    
    return response.json();
  }

  static async getGame(gameId: string): Promise<Game> {
    if (USE_MOCK_API) {
      return MockGameAPI.getGame(gameId);
    }
    
    const response = await fetch(`${API_BASE_URL}/games/${gameId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch game');
    }
    
    return response.json();
  }

  static async joinGame(gameId: string, player2Name: string): Promise<void> {
    if (USE_MOCK_API) {
      return MockGameAPI.joinGame(gameId, player2Name);
    }
    
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player2_name: player2Name }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to join game');
    }
  }

  static async submitTurn(
    gameId: string,
    turnData: {
      player_name: string;
      photo_url: string;
      tags: string[];
      shared_tag: string;
      detected_tags: string[];
    }
  ): Promise<void> {
    if (USE_MOCK_API) {
      return MockGameAPI.submitTurn(gameId, turnData);
    }
    
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(turnData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit turn');
    }
  }

  static async detectObjects(imageUri: string): Promise<DetectionResult> {
    // Always use real backend for object detection
    
    try {
      console.log(`Detecting objects using LLM for image:`, imageUri);
      
      // Fetch the image and convert to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result) {
            // Extract just the base64 data without the data:image/jpeg;base64, prefix
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;
      
      // Choose endpoint based on detection method
      const endpoint = '/detect-llm';
      
      console.log(`Sending base64 image to ${endpoint}`);
      const detectionResponse = await fetch(`${LLM_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
        }),
      });
      
      if (!detectionResponse.ok) {
        const errorText = await detectionResponse.text();
        console.error('Backend error:', detectionResponse.status, errorText);
        throw new Error(`Backend error: ${detectionResponse.status}`);
      }
      
      const result = await detectionResponse.json();
      console.log('Detection result:', result);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error: any) {
      console.error('Detection error details:', error);
      throw error;
    }
  }
} 