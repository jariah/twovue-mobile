import { Game } from '../types/game';
import { generateScientificGameId } from '../utils/gameIdGenerator';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock data storage using AsyncStorage for persistence
const GAMES_STORAGE_KEY = 'mockGames';

async function loadGames(): Promise<{ [key: string]: Game }> {
  try {
    const stored = await AsyncStorage.getItem(GAMES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading games:', error);
    return {};
  }
}

async function saveGames(games: { [key: string]: Game }): Promise<void> {
  try {
    await AsyncStorage.setItem(GAMES_STORAGE_KEY, JSON.stringify(games));
  } catch (error) {
    console.error('Error saving games:', error);
  }
}

export class MockGameAPI {
  static async createGame(player1Name: string): Promise<{ game_id: string }> {
    const gameId = generateScientificGameId();
    const game: Game = {
      id: gameId,
      player1Name,
      player2Name: undefined,
      status: 'WAITING_FOR_PLAYER2',
      createdAt: new Date(),
      updatedAt: new Date(),
      turns: []
    };
    
    const games = await loadGames();
    games[gameId] = game;
    await saveGames(games);
    
    return { game_id: gameId };
  }

  static async getGame(gameId: string): Promise<Game> {
    const games = await loadGames();
    let game = games[gameId];
    
    // If game doesn't exist, create it as a placeholder
    // This allows cross-device joining
    if (!game) {
      game = {
        id: gameId,
        player1Name: 'Remote Player',
        player2Name: undefined,
        status: 'WAITING_FOR_PLAYER2',
        createdAt: new Date(),
        updatedAt: new Date(),
        turns: []
      };
      games[gameId] = game;
      await saveGames(games);
    }
    
    return game;
  }

  static async joinGame(gameId: string, player2Name: string): Promise<void> {
    const games = await loadGames();
    let game = games[gameId];
    
    // Create game if it doesn't exist (cross-device join)
    if (!game) {
      // Create a game with sample turn data to simulate gameplay
      game = {
        id: gameId,
        player1Name: 'Remote Player',
        status: 'WAITING_FOR_PLAYER2',
        createdAt: new Date(),
        updatedAt: new Date(),
        turns: [
          {
            id: 'sample-turn-1',
            gameId,
            playerName: 'Remote Player',
            photoUrl: 'https://via.placeholder.com/400x300/87CEEB/000000?text=Sample+Photo',
            tags: ['laptop', 'candlestick', 'toy'],
            sharedTag: 'laptop',
            detectedTags: ['laptop', 'candlestick', 'toy', 'table', 'book', 'pen', 'cup'],
            turnNumber: 1,
            createdAt: new Date()
          }
        ]
      };
    }
    
    game.player2Name = player2Name;
    game.status = 'IN_PROGRESS';
    game.updatedAt = new Date();
    
    games[gameId] = game;
    await saveGames(games);
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
    const games = await loadGames();
    let game = games[gameId];
    
    if (!game) {
      // Create game if it doesn't exist
      game = {
        id: gameId,
        player1Name: turnData.player_name,
        status: 'IN_PROGRESS',
        createdAt: new Date(),
        updatedAt: new Date(),
        turns: []
      };
    }
    
    const turnNumber = (game.turns?.length || 0) + 1;
    game.turns = game.turns || [];
    game.turns.push({
      id: Math.random().toString(36).substring(7),
      gameId,
      playerName: turnData.player_name,
      photoUrl: turnData.photo_url,
      tags: turnData.tags,
      sharedTag: turnData.shared_tag,
      detectedTags: turnData.detected_tags,
      turnNumber,
      createdAt: new Date()
    });
    game.updatedAt = new Date();
    
    games[gameId] = game;
    await saveGames(games);
  }
} 