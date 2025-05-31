import { Game } from '../types/game';
import { generateScientificGameId } from '../utils/gameIdGenerator';

// Mock data storage
const mockGames: { [key: string]: Game } = {};

export class MockGameAPI {
  static async createGame(player1Name: string): Promise<{ game_id: string }> {
    const gameId = generateScientificGameId();
    const game: Game = {
      id: gameId,
      player1Name,
      status: 'WAITING_FOR_PLAYER2',
      createdAt: new Date(),
      updatedAt: new Date(),
      turns: []
    };
    mockGames[gameId] = game;
    return { game_id: gameId };
  }

  static async getGame(gameId: string): Promise<Game> {
    const game = mockGames[gameId];
    if (!game) {
      throw new Error('Game not found');
    }
    return game;
  }

  static async joinGame(gameId: string, player2Name: string): Promise<void> {
    const game = mockGames[gameId];
    if (game) {
      game.player2Name = player2Name;
      game.status = 'IN_PROGRESS';
      game.updatedAt = new Date();
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
    const game = mockGames[gameId];
    if (game) {
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
    }
  }
} 