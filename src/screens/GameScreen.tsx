import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Share,
  Clipboard,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Storage } from '../utils/storage';
import { GameAPI } from '../services/api';
import { Game, Turn } from '../types/game';
import { GridBackground } from '../components/GridBackground';
import { theme } from '../styles/theme';
import { formatGameIdForDisplay } from '../utils/gameIdGenerator';
import { WebSocketService } from '../services/websocket';

const { width } = Dimensions.get('window');

export function GameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { gameId } = route.params;

  const [playerName, setPlayerName] = useState<string>('');
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load game data
  const loadGame = useCallback(async () => {
    try {
      const name = await Storage.getPlayerName();
      if (!name) {
        navigation.replace('Login');
        return;
      }
      setPlayerName(name);

      const gameData = await GameAPI.getGame(gameId);
      setGame(gameData);

      // Join game if needed
      if (gameData.player1Name !== name && !gameData.player2Name) {
        await GameAPI.joinGame(gameId, name);
        await Storage.addGameId(gameId);
        await loadGame(); // Reload to get updated game state
      }
    } catch (error) {
      console.error('Error loading game:', error);
      setError('Failed to load game session');
    } finally {
      setLoading(false);
    }
  }, [gameId, navigation]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!gameId) return;

    const wsService = WebSocketService.getInstance(gameId);
    wsService.connect('https://twovue-mobile-production.up.railway.app');
    
    const handleMessage = (message: any) => {
      console.log('🔔 WebSocket message received:', message);
      
      if (message.type === 'player_joined') {
        Alert.alert('Player Joined!', `${message.player_name} joined the session!`);
        loadGame(); // Reload to show updated game state
      }
      
      if (message.type === 'turn_submitted') {
        Alert.alert('Turn Submitted!', `${message.player_name} submitted their analysis!`);
        loadGame(); // Reload to show new turn
      }
    };
    
    wsService.addListener(handleMessage);
    
    return () => {
      wsService.removeListener(handleMessage);
    };
  }, [gameId, loadGame]);

  // Game logic calculations
  const turns = game?.turns || [];
  const currentTurn = turns.length + 1;
  const isPlayer1 = playerName === game?.player1Name;
  const isPlayer2 = playerName === game?.player2Name;
  const myTurn = (isPlayer1 && turns.length % 2 === 0) || (isPlayer2 && turns.length % 2 === 1);
  const prevTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const prevTags = prevTurn ? prevTurn.tags : [];

  const navigateToCamera = () => {
    navigation.navigate('Camera', {
      gameId,
      playerName,
      currentTurn,
      prevTags,
    });
  };

  const shareGame = async () => {
    const gameIdDisplay = formatGameIdForDisplay(gameId);
    const message = `Join my Twovue session! Game ID: ${gameIdDisplay}\n\nOpen the Twovue app and enter this Game ID to join.`;
    
    try {
      await Share.share({
        message,
        title: 'Join my Twovue Session!',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share game session');
    }
  };

  const copyGameId = async () => {
    const gameIdDisplay = formatGameIdForDisplay(gameId);
    Clipboard.setString(gameIdDisplay);
    Alert.alert('Copied!', `Game ID "${gameIdDisplay}" copied to clipboard`);
  };

  const renderCarouselCard = (turn: Turn, index: number) => (
    <View key={turn.id} style={styles.carouselCard}>
      <Text style={styles.cardHeader}>
        TURN {turn.turnNumber} — {turn.playerName.toUpperCase()}
      </Text>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: turn.photoUrl }} 
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.tagsContainer}>
        {turn.tags.map((tag, tagIndex) => (
          <View key={tag} style={styles.tagBox}>
            <Text style={styles.tagText}>
              {tagIndex + 1}. {tag.toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderActionCard = () => {
    if (myTurn) {
      return (
        <View style={styles.carouselCard}>
          <Text style={styles.cardHeader}>
            TURN {currentTurn} — YOUR ANALYSIS
          </Text>
          <TouchableOpacity style={styles.captureCard} onPress={navigateToCamera}>
            <View style={styles.captureIcon}>
              <Text style={styles.captureSymbol}>📷</Text>
            </View>
            <Text style={styles.captureText}>TAP TO CAPTURE</Text>
            <Text style={styles.captureSubtext}>
              {currentTurn === 1 ? 'Select 3 objects' : 'Find shared object + 2 new'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.carouselCard}>
          <Text style={styles.cardHeader}>
            TURN {currentTurn} — AWAITING ANALYSIS
          </Text>
          <View style={styles.waitingCard}>
            <ActivityIndicator size="large" color={theme.colors.fadedBlue} />
            <Text style={styles.waitingText}>AWAITING OPERATOR</Text>
            <Text style={styles.waitingSubtext}>
              {game?.player2Name ? 
                `${isPlayer1 ? game.player2Name : game.player1Name} is analyzing...` :
                'Waiting for second player to join...'
              }
            </Text>
          </View>
        </View>
      );
    }
  };

  if (loading) {
    return (
      <GridBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.inkBlack} />
          <Text style={styles.statusText}>LOADING SESSION DATA...</Text>
        </View>
      </GridBackground>
    );
  }

  if (!game || (!isPlayer1 && !isPlayer2)) {
    return (
      <GridBackground>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>SESSION NOT FOUND</Text>
            <Text style={styles.statusText}>Unable to load game session</Text>
          </View>
        </SafeAreaView>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Session Header */}
          <View style={styles.header}>
            <View style={styles.sessionFrame}>
              <Text style={styles.sessionLabel}>SESSION {formatGameIdForDisplay(gameId)}</Text>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionDetail}>
                  OPERATOR 1: {game.player1Name?.toUpperCase() || 'UNKNOWN'}
                </Text>
                <Text style={styles.sessionDetail}>
                  OPERATOR 2: {game.player2Name?.toUpperCase() || 'PENDING'}
                </Text>
                <Text style={styles.sessionDetail}>
                  ANALYSES COMPLETED: {turns.length}
                </Text>
              </View>
              <TouchableOpacity onPress={copyGameId} style={styles.copyButton}>
                <Text style={styles.copyButtonText}>COPY SESSION ID</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Analysis Timeline */}
          <View style={styles.timelineContainer}>
            <Text style={styles.timelineTitle}>
              ANALYSIS TIMELINE
            </Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}
              snapToInterval={width * 0.8 + 16}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
            >
              {/* Historical turns */}
              {turns.map((turn, index) => renderCarouselCard(turn, index))}
              
              {/* Action card (capture or waiting) */}
              {renderActionCard()}
            </ScrollView>
          </View>

          {/* Share button */}
          {!game.player2Name && (
            <View style={styles.shareContainer}>
              <TouchableOpacity style={styles.shareButton} onPress={shareGame}>
                <Text style={styles.shareText}>INVITE SECOND OPERATOR</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GridBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    paddingHorizontal: theme.spacing.margin.mobile,
    paddingVertical: theme.spacing.lg,
  },
  sessionFrame: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.inkBlack,
    borderStyle: 'dashed',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(231, 220, 197, 0.8)',
  },
  sessionLabel: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.inkBlack,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  sessionInfo: {
    marginBottom: theme.spacing.md,
  },
  sessionDetail: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedBlue,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
  },
  copyButton: {
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.fadedBlue,
    backgroundColor: 'transparent',
  },
  copyButtonText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedBlue,
    textTransform: 'uppercase',
  },
  timelineContainer: {
    marginHorizontal: theme.spacing.margin.mobile,
    marginBottom: theme.spacing.lg,
  },
  timelineTitle: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.inkBlack,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  carousel: {
    marginBottom: theme.spacing.lg,
  },
  carouselContent: {
    paddingHorizontal: theme.spacing.sm,
  },
  carouselCard: {
    width: width * 0.8,
    marginRight: theme.spacing.md,
    padding: theme.spacing.md,
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.inkBlack,
    borderStyle: 'solid',
    backgroundColor: 'rgba(231, 220, 197, 0.9)',
  },
  cardHeader: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.inkBlack,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
  },
  imageContainer: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.inkBlack,
    marginBottom: theme.spacing.md,
    height: 150,
    width: '100%',
    backgroundColor: theme.colors.surface,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  tagsContainer: {
    gap: theme.spacing.xs,
  },
  tagBox: {
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.fadedBlue,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderStyle: 'dashed',
  },
  tagText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedBlue,
  },
  captureCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    borderWidth: theme.layout.borderWidth.thick,
    borderColor: theme.colors.archiveRed,
    borderStyle: 'solid',
    backgroundColor: 'rgba(164, 70, 60, 0.1)',
    minHeight: 150,
  },
  captureIcon: {
    marginBottom: theme.spacing.md,
  },
  captureSymbol: {
    fontSize: theme.typography.sizes.xxl,
  },
  captureText: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.archiveRed,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  captureSubtext: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedBlue,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  waitingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.fadedBlue,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(74, 98, 116, 0.1)',
    minHeight: 150,
  },
  waitingText: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.fadedBlue,
    marginTop: theme.spacing.md,
    textTransform: 'uppercase',
  },
  waitingSubtext: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedBlue,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  shareContainer: {
    marginHorizontal: theme.spacing.margin.mobile,
    marginBottom: theme.spacing.lg,
  },
  shareButton: {
    padding: theme.spacing.lg,
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.archiveRed,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  shareText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.archiveRed,
    textTransform: 'uppercase',
  },
  errorContainer: {
    marginHorizontal: theme.spacing.margin.mobile,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.archiveRed,
    borderStyle: 'solid',
    backgroundColor: 'rgba(164, 70, 60, 0.1)',
  },
  errorText: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.archiveRed,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  statusText: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedBlue,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    textTransform: 'uppercase',
  },
}); 