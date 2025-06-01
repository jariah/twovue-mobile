interface WebSocketMessage {
  type: string;
  message?: string;
  turn_number?: number;
  player_name?: string;
}

export class WebSocketService {
  private static instances: Map<string, WebSocketService> = new Map();
  private ws: WebSocket | null = null;
  private gameId: string;
  private listeners: ((message: WebSocketMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor(gameId: string) {
    this.gameId = gameId;
  }

  static getInstance(gameId: string): WebSocketService {
    if (!WebSocketService.instances.has(gameId)) {
      WebSocketService.instances.set(gameId, new WebSocketService(gameId));
    }
    return WebSocketService.instances.get(gameId)!;
  }

  connect(apiBaseUrl: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    const wsUrl = apiBaseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    try {
      this.ws = new WebSocket(`${wsUrl}/ws/${this.gameId}`);

      this.ws.onopen = () => {
        console.log(`WebSocket connected for game ${this.gameId}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.notifyListeners(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log(`WebSocket disconnected for game ${this.gameId}`);
        this.attemptReconnect(apiBaseUrl);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  private attemptReconnect(apiBaseUrl: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect(apiBaseUrl);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  addListener(callback: (message: WebSocketMessage) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (message: WebSocketMessage) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(message: WebSocketMessage): void {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners = [];
  }

  static cleanup(gameId: string): void {
    const instance = WebSocketService.instances.get(gameId);
    if (instance) {
      instance.disconnect();
      WebSocketService.instances.delete(gameId);
    }
  }

  static cleanupAll(): void {
    WebSocketService.instances.forEach((instance, gameId) => {
      instance.disconnect();
    });
    WebSocketService.instances.clear();
  }
} 