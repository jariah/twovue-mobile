export interface Game {
  id: string;
  player1Name: string;
  player2Name?: string;
  status: 'WAITING_FOR_PLAYER2' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
  turns?: Turn[];
}

export interface Turn {
  id: string;
  gameId: string;
  playerName: string;
  photoUrl: string;
  tags: string[];        // 3 tags total
  sharedTag: string;     // The tag shared from previous turn
  detectedTags: string[]; // All tags detected by AI
  turnNumber: number;
  createdAt: Date;
}

export interface DetectionResult {
  labels: string[];
  error?: string;
  raw_response?: string;
  debug?: {
    source: 'mock' | 'openai' | 'mock_fallback';
    count: number;
    original_count?: number;
    filtered_count?: number;
    error_code?: number;
    api_key_present?: boolean;
    api_key_starts_with?: string;
  };
} 