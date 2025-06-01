import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Clipboard,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Storage } from '../utils/storage';
import { GameAPI } from '../services/api';
import { Game } from '../types/game';
import { GridBackground } from '../components/GridBackground';
import { ScientificButton } from '../components/ScientificButton';
import { theme } from '../styles/theme';
import { formatGameIdForDisplay } from '../utils/gameIdGenerator';

export function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [playerName, setPlayerName] = useState<string>('');
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinGameId, setJoinGameId] = useState<string>('');

  const loadData = async () => {
    try {
      const name = await Storage.getPlayerName();
      if (!name) {
        navigation.replace('Login');
        return;
      }
      setPlayerName(name);

      const gameIds = await Storage.getGameIds();
      
      // Load games individually to avoid Promise.all failing if one game fails
      const gamesData = [];
      for (const id of gameIds) {
        try {
          const game = await GameAPI.getGame(id);
          gamesData.push(game);
        } catch (gameError) {
          console.warn(`Failed to load game ${id}:`, gameError);
          // Continue with other games, don't fail entirely
        }
      }
      
      setGames(gamesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't show alert for loading errors, just log them
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const createNewGame = async () => {
    try {
      const game = await GameAPI.createGame(playerName);
      await Storage.addGameId(game.game_id);
      navigation.navigate('Game', { gameId: game.game_id });
    } catch (error) {
      Alert.alert('Error', 'Failed to create game');
    }
  };

  const joinGame = (gameId: string) => {
    navigation.navigate('Game', { gameId });
  };

  const copyGameId = (gameId: string) => {
    const gameIdDisplay = formatGameIdForDisplay(gameId);
    Clipboard.setString(gameIdDisplay);
    Alert.alert('Copied!', `Game ID "${gameIdDisplay}" copied to clipboard`);
  };

  const joinGameManually = async () => {
    if (!joinGameId.trim()) {
      Alert.alert('Error', 'Please enter a game ID');
      return;
    }

    const gameIdToJoin = joinGameId.trim().toLowerCase().replace(/\s+/g, '-');
    
    try {
      // Add to our games list and navigate
      await Storage.addGameId(gameIdToJoin);
      setJoinGameId(''); // Clear input
      navigation.navigate('Game', { gameId: gameIdToJoin });
    } catch (error) {
      Alert.alert('Error', 'Failed to join game. Please try again.');
    }
  };

  const getGameStatus = (game: Game) => {
    const turns = game.turns?.length || 0;
    const isPlayer1 = playerName === game.player1Name;
    const isPlayer2 = playerName === game.player2Name;
    const myTurn = (isPlayer1 && turns % 2 === 0) || (isPlayer2 && turns % 2 === 1);

    if (!game.player2Name) return 'AWAITING OPERATOR';
    if (myTurn) return 'YOUR ANALYSIS REQUIRED';
    return 'AWAITING RESPONSE';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'YOUR ANALYSIS REQUIRED':
        return theme.colors.archiveRed;
      case 'AWAITING OPERATOR':
        return theme.colors.fadedInkBlue;
      default:
        return theme.colors.softGridGray;
    }
  };

  if (loading) {
    return (
      <GridBackground>
        <SafeAreaView style={styles.container}>
          <Text style={styles.loadingText}>LOADING DASHBOARD...</Text>
        </SafeAreaView>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerFrame}>
              <Text style={styles.figureLabel}>FIG. 2A — CONTROL DASHBOARD</Text>
              <Text style={styles.operatorLabel}>OPERATOR: {playerName.toUpperCase()}</Text>
            </View>
          </View>

          {/* New session button */}
          <View style={styles.actionFrame}>
            <Text style={styles.sectionTitle}>NEW SESSION INITIALIZATION</Text>
            <ScientificButton
              title="Create New Analysis Session"
              onPress={createNewGame}
              variant="primary"
              size="large"
            />
          </View>

          {/* Join existing session */}
          <View style={styles.joinFrame}>
            <Text style={styles.sectionTitle}>JOIN EXISTING SESSION</Text>
            <Text style={styles.joinInstructions}>
              Enter the Game ID shared by another operator:
            </Text>
            <View style={styles.joinInputContainer}>
              <TextInput
                style={styles.joinInput}
                value={joinGameId}
                onChangeText={setJoinGameId}
                placeholder="QUANTUM VECTOR ALPHA"
                placeholderTextColor={theme.colors.softGridGray}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={joinGameManually}
              />
              <View style={styles.inputUnderline} />
            </View>
            <ScientificButton
              title="Join Session"
              onPress={joinGameManually}
              variant="secondary"
              size="medium"
              disabled={!joinGameId.trim()}
            />
          </View>

          {/* Active sessions */}
          <View style={styles.sessionsFrame}>
            <Text style={styles.sectionTitle}>
              ACTIVE SESSIONS ({games.length} TOTAL)
            </Text>
            
            {games.length === 0 ? (
              <View style={styles.noSessionsFrame}>
                <Text style={styles.noSessionsText}>
                  NO ACTIVE SESSIONS DETECTED
                </Text>
                <Text style={styles.instructionText}>
                  INITIALIZE NEW SESSION TO BEGIN ANALYSIS
                </Text>
              </View>
            ) : (
              <View style={styles.gamesList}>
                {games.map((game) => {
                  const status = getGameStatus(game);
                  const statusColor = getStatusColor(status);
                  const turns = game.turns?.length || 0;
                  
                  return (
                    <View key={game.id} style={styles.gameCard}>
                      <View style={styles.gameHeader}>
                        <View style={styles.gameIdSection}>
                          <Text style={styles.gameId}>
                            SESSION: {formatGameIdForDisplay(game.id)}
                          </Text>
                          <TouchableOpacity 
                            onPress={() => copyGameId(game.id)} 
                            style={styles.copyButton}
                          >
                            <Text style={styles.copyButtonText}>COPY</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {status}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.gameDetails}>
                        <Text style={styles.detailText}>
                          OPERATOR 1: {game.player1Name?.toUpperCase() || 'UNKNOWN'}
                        </Text>
                        <Text style={styles.detailText}>
                          OPERATOR 2: {game.player2Name?.toUpperCase() || 'PENDING'}
                        </Text>
                        <Text style={styles.detailText}>
                          ANALYSES COMPLETED: {turns}
                        </Text>
                      </View>
                      
                      <ScientificButton
                        title="Access Session"
                        onPress={() => joinGame(game.id)}
                        variant="secondary"
                        size="medium"
                        style={styles.joinButton}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GridBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  loadingText: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.graphiteBlack,
    textAlign: 'center',
    marginTop: theme.spacing.xxxl,
  },
  header: {
    paddingHorizontal: theme.spacing.margin.mobile,
    paddingVertical: theme.spacing.lg,
  },
  headerFrame: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.graphiteBlack,
    borderStyle: 'dashed',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(231, 220, 197, 0.8)',
  },
  figureLabel: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedInkBlue,
    marginBottom: theme.spacing.xs,
    letterSpacing: 1,
  },
  operatorLabel: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.graphiteBlack,
    letterSpacing: 0.5,
  },
  actionFrame: {
    marginHorizontal: theme.spacing.margin.mobile,
    marginBottom: theme.spacing.xl,
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.fadedInkBlue,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  sessionsFrame: {
    marginHorizontal: theme.spacing.margin.mobile,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.softGridGray,
    padding: theme.spacing.lg,
  },
  noSessionsFrame: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.softGridGray,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(188, 188, 188, 0.05)',
  },
  noSessionsText: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.softGridGray,
    marginBottom: theme.spacing.sm,
  },
  instructionText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.softGridGray,
    textAlign: 'center',
  },
  gamesList: {
    gap: theme.spacing.lg,
  },
  gameCard: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.graphiteBlack,
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(245, 240, 232, 0.8)',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  gameIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameId: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.graphiteBlack,
  },
  copyButton: {
    padding: theme.spacing.sm,
  },
  copyButtonText: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedInkBlue,
  },
  statusBadge: {
    borderWidth: theme.layout.borderWidth.normal,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  statusText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    letterSpacing: 0.5,
  },
  gameDetails: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  detailText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedInkBlue,
  },
  joinButton: {
    alignSelf: 'flex-start',
  },
  joinFrame: {
    marginHorizontal: theme.spacing.margin.mobile,
    marginBottom: theme.spacing.xl,
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.fadedInkBlue,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  joinInstructions: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.sm,
  },
  joinInputContainer: {
    marginBottom: theme.spacing.lg,
  },
  joinInput: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.graphiteBlack,
    padding: theme.spacing.sm,
  },
  inputUnderline: {
    height: 1,
    backgroundColor: theme.colors.softGridGray,
  },
}); 