import * as FileSystem from 'expo-file-system';
import { Game, Turn, DetectionResult } from '../types/game';
import { MockGameAPI } from './mockApi';

// Configure your backend URL here
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://twovue-mobile-production.up.railway.app';
const LLM_API_URL = process.env.EXPO_PUBLIC_LLM_URL || 'https://twovue-mobile-production.up.railway.app';

// Set to false to use live API (Railway deployment)
const USE_MOCK_API = false;

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

  static async uploadPhoto(photoUri: string): Promise<string> {
    if (USE_MOCK_API) {
      // For mock API, just return the local URI
      return photoUri;
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    
    const response = await fetch(`${API_BASE_URL}/upload-photo`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload photo');
    }
    
    const result = await response.json();
    return result.photo_url;
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
    
    // First upload the photo if it's a local URI
    let photoUrl = turnData.photo_url;
    if (photoUrl.startsWith('file://')) {
      photoUrl = await this.uploadPhoto(photoUrl);
    }
    
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...turnData,
        photo_url: photoUrl,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit turn');
    }
  }

  static async detectObjects(photoUri: string): Promise<{ labels: string[]; debug?: any; raw_response?: string }> {
    try {
      // Convert photo to base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (USE_MOCK_API) {
        // Fallback to mock data
        const mockObjects = [
          "person", "chair", "table", "laptop", "phone", "cup", 
          "book", "pen", "window", "door", "floor", "wall",
          "light", "picture frame", "plant", "bag", "bottle", "keyboard"
        ];
        
        return {
          labels: mockObjects.slice(0, Math.floor(Math.random() * 8) + 10),
          debug: { source: 'mock_fallback' }
        };
      }
      
      console.log('🔍 Calling live API:', LLM_API_URL);
      console.log('📱 Base64 length:', base64.length);
      
      // Use live API
      const response = await fetch(`${LLM_API_URL}/detect-llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Detection service returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Success:', result.debug?.source, result.labels?.length, 'objects');
      return result;
    } catch (error) {
      console.error('💥 Object detection error:', error);
      
      // Fallback to mock data on any error
      const mockObjects = [
        "person", "chair", "table", "laptop", "phone", "cup", 
        "book", "pen", "window", "door", "floor", "wall",
        "light", "picture frame", "plant", "bag", "bottle", "keyboard"
      ];
      
      return {
        labels: mockObjects.slice(0, Math.floor(Math.random() * 8) + 10),
        debug: { 
          source: 'mock_fallback_after_error',
          error: error instanceof Error ? error.message : String(error),
          api_url: LLM_API_URL
        }
      };
    }
  }
} 