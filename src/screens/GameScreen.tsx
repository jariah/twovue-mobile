import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Platform,
} from 'react-native';
import { Camera, CameraType, CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Storage } from '../utils/storage';
import { GameAPI } from '../services/api';
import { Game, Turn } from '../types/game';
import { GridBackground } from '../components/GridBackground';
import { ScientificButton } from '../components/ScientificButton';
import { theme } from '../styles/theme';
import { formatGameIdForDisplay } from '../utils/gameIdGenerator';

export function GameScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { gameId } = route.params;
  const cameraRef = useRef<CameraView>(null);

  const [playerName, setPlayerName] = useState<string>('');
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [turnSubmitted, setTurnSubmitted] = useState(false);

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
      Alert.alert('Error', 'Failed to load game');
    } finally {
      setLoading(false);
    }
  }, [gameId, navigation]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to play this game');
      }
    })();
  }, []);

  // Game logic calculations
  const turns = game?.turns || [];
  const currentTurn = turns.length + 1;
  const isPlayer1 = playerName === game?.player1Name;
  const isPlayer2 = playerName === game?.player2Name;
  const myTurn = (isPlayer1 && currentTurn % 2 === 1) || (isPlayer2 && currentTurn % 2 === 0);
  const prevTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const prevTags = prevTurn ? prevTurn.tags : [];

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        setPhoto(photo.uri);
        
        try {
          // Save to camera roll
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        } catch (saveError) {
          console.error('Error saving to library:', saveError);
          // Continue even if save fails
        }

        try {
          // Detect objects
          const result = await GameAPI.detectObjects(photo.uri);
          const objects = result.labels.slice(0, 20);
          
          if (objects.length === 0) {
            setError('No objects detected. Try taking a photo with more recognizable objects.');
          }
          
          setDetectedObjects(objects);
          
          // Show debug info in development
          if (__DEV__ && result.debug) {
            console.log('Detection Debug Info:', result.debug);
            console.log('Raw Response:', result.raw_response);
            
            // Only show alert if using mock data (fallback)
            if (result.debug.source === 'mock') {
              Alert.alert(
                'Debug Info',
                `Fallback to mock data - AI detection failed\nCount: ${result.debug.count}`,
                [{ text: 'OK' }]
              );
            }
          }
        } catch (detectError: any) {
          console.error('Object detection error:', detectError);
          setError(`Object detection failed: ${detectError.message || 'Network error'}. Make sure you're on the same WiFi network.`);
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setError(`Camera error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePicture = () => {
    setPhoto(null);
    setDetectedObjects([]);
    setSelectedObjects([]);
    setError(null);
    setTurnSubmitted(false);
  };

  const toggleObject = (object: string) => {
    setSelectedObjects((prev) => {
      if (prev.includes(object)) {
        return prev.filter((o) => o !== object);
      }
      const maxSelection = currentTurn === 1 ? 3 : 2;
      if (prev.length < maxSelection) {
        return [...prev, object];
      }
      return prev;
    });
  };

  const canSubmit = () => {
    if (!photo || !detectedObjects.length) return false;
    if (currentTurn === 1) {
      return selectedObjects.length === 3;
    }
    // Must have at least one shared tag
    const hasShared = prevTags.some((tag) => detectedObjects.includes(tag));
    return hasShared && selectedObjects.length === 2;
  };

  const submitTurn = async () => {
    setError(null);
    
    if (currentTurn === 1 && selectedObjects.length !== 3) {
      setError('Please select exactly 3 tags.');
      return;
    }

    if (currentTurn > 1) {
      const shared = prevTags.find((tag) => detectedObjects.includes(tag));
      if (!shared) {
        setError('Your photo must contain at least one of the previous tags.');
        return;
      }
      if (selectedObjects.length !== 2) {
        setError('Please select exactly 2 new tags.');
        return;
      }

      try {
        const tags = [shared, ...selectedObjects];
        await GameAPI.submitTurn(gameId, {
          player_name: playerName,
          photo_url: photo!,
          tags,
          shared_tag: shared,
          detected_tags: detectedObjects,
        });
        setTurnSubmitted(true);
        await loadGame();
      } catch (error) {
        Alert.alert('Error', 'Failed to submit turn');
      }
      return;
    }

    // First turn
    try {
      await GameAPI.submitTurn(gameId, {
        player_name: playerName,
        photo_url: photo!,
        tags: selectedObjects,
        shared_tag: selectedObjects[0],
        detected_tags: detectedObjects,
      });
      setTurnSubmitted(true);
      await loadGame();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit turn');
    }
  };

  const shareGame = async () => {
    const message = Platform.OS === 'ios' 
      ? `twovue://game/${gameId}`
      : `It's your turn in our Twovue game! Game ID: ${gameId}`;
    
    try {
      await Share.share({
        message,
        title: 'Your Turn on Twovue!',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share game');
    }
  };

  if (loading || hasPermission === null) {
    return (
      <GridBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.graphiteBlack} />
        </View>
      </GridBackground>
    );
  }

  if (!game || (!isPlayer1 && !isPlayer2)) {
    return (
      <GridBackground>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.errorText}>Unable to load game</Text>
        </SafeAreaView>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header with scientific labeling */}
          <View style={styles.header}>
            <View style={styles.labelFrame}>
              <Text style={styles.figureLabel}>FIG. {currentTurn}A — CAPTURE SESSION</Text>
              <Text style={styles.gameId}>GAME ID: {formatGameIdForDisplay(gameId)}</Text>
            </View>
          </View>

          {/* Controls panel */}
          <View style={styles.controlsFrame}>
            <View style={styles.controlsContainer}>
              <Text style={styles.statusLabel}>AI VISION ACTIVE</Text>
            </View>
          </View>

          {prevTurn && (
            <View style={styles.previousTurnFrame}>
              <Text style={styles.sectionTitle}>PREVIOUS SPECIMEN</Text>
              <View style={styles.imageFrame}>
                <Image 
                  source={{ uri: prevTurn.photoUrl }} 
                  style={styles.previousImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.tagsContainer}>
                {prevTurn.tags.map((tag, index) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{`${index + 1}. ${tag.toUpperCase()}`}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {myTurn && !turnSubmitted && (
            <View style={styles.gameContent}>
              {!photo ? (
                <>
                  {hasPermission ? (
                    <View style={styles.cameraFrame}>
                      <Text style={styles.sectionTitle}>OPTICAL CAPTURE FIELD</Text>
                      <View style={styles.cameraContainer}>
                        <CameraView 
                          ref={cameraRef} 
                          style={styles.camera}
                          facing="back"
                        />
                        <View style={styles.viewfinderOverlay}>
                          <View style={styles.cornerNotch} />
                          <View style={[styles.cornerNotch, styles.topRight]} />
                          <View style={[styles.cornerNotch, styles.bottomLeft]} />
                          <View style={[styles.cornerNotch, styles.bottomRight]} />
                        </View>
                        <ScientificButton
                          title={isProcessing ? 'Processing...' : 'Capture'}
                          onPress={takePicture}
                          disabled={isProcessing}
                          variant="accent"
                          style={styles.captureButton}
                        />
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.errorText}>Camera permission required</Text>
                  )}
                </>
              ) : (
                <View style={styles.photoReview}>
                  <Text style={styles.sectionTitle}>SPECIMEN ANALYSIS</Text>
                  <View style={[styles.imageFrame, { height: 300 }]}>
                    <Image 
                      source={{ uri: photo }} 
                      style={styles.capturedImage}
                      resizeMode="cover"
                    />
                  </View>
                  
                  <ScientificButton
                    title="Retake"
                    onPress={retakePicture}
                    variant="secondary"
                    size="small"
                    style={styles.retakeButton}
                  />

                  {detectedObjects.length > 0 && (
                    <View style={styles.objectsSection}>
                      <Text style={styles.sectionTitle}>
                        OBJECT CLASSIFICATION ({detectedObjects.length} DETECTED):
                      </Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.objectsScrollView}
                      >
                        <View style={styles.objectsGrid}>
                          {detectedObjects.map((object, index) => (
                            <TouchableOpacity
                              key={object}
                              style={[
                                styles.objectButton,
                                selectedObjects.includes(object) && styles.objectButtonSelected,
                              ]}
                              onPress={() => toggleObject(object)}
                            >
                              <Text style={styles.objectIndex}>{index + 1}</Text>
                              <Text
                                style={[
                                  styles.objectButtonText,
                                  selectedObjects.includes(object) && styles.objectButtonTextSelected,
                                ]}
                              >
                                {object.toUpperCase()}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>

                      <ScientificButton
                        title="Submit Analysis"
                        onPress={submitTurn}
                        disabled={!canSubmit()}
                        variant="primary"
                        style={styles.submitButton}
                      />
                    </View>
                  )}
                </View>
              )}

              {error && (
                <View style={styles.errorFrame}>
                  <Text style={styles.errorLabel}>ERROR:</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          )}

          {turnSubmitted && (
            <View style={styles.turnSubmittedFrame}>
              <Text style={styles.successText}>ANALYSIS SUBMITTED</Text>
              <ScientificButton
                title="Notify Operator"
                onPress={shareGame}
                variant="accent"
                style={styles.shareButton}
              />
            </View>
          )}

          {!myTurn && (
            <View style={styles.waitingFrame}>
              <Text style={styles.waitingText}>AWAITING OPERATOR RESPONSE...</Text>
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
  labelFrame: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.graphiteBlack,
    borderStyle: 'dashed',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(231, 220, 197, 0.8)',
  },
  figureLabel: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.xs,
  },
  gameId: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedInkBlue,
  },
  controlsFrame: {
    marginHorizontal: theme.spacing.margin.mobile,
    marginBottom: theme.spacing.lg,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.softGridGray,
    borderStyle: 'solid',
    backgroundColor: 'rgba(245, 240, 232, 0.6)',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  statusLabel: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.archiveRed,
    letterSpacing: 1,
  },
  previousTurnFrame: {
    marginHorizontal: theme.spacing.margin.mobile,
    marginBottom: theme.spacing.lg,
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.fadedInkBlue,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.md,
  },
  imageFrame: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.md,
    height: 200,
    width: '100%',
    backgroundColor: theme.colors.surface,
  },
  previousImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  tagsContainer: {
    gap: theme.spacing.sm,
  },
  tag: {
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.fadedInkBlue,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderStyle: 'dashed',
  },
  tagText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedInkBlue,
  },
  gameContent: {
    paddingHorizontal: theme.spacing.margin.mobile,
  },
  cameraFrame: {
    marginBottom: theme.spacing.lg,
  },
  cameraContainer: {
    position: 'relative',
    borderWidth: theme.layout.borderWidth.thick,
    borderColor: theme.colors.graphiteBlack,
    borderRadius: theme.layout.borderRadius.sm,
    overflow: 'hidden',
    height: 400,
  },
  camera: {
    flex: 1,
  },
  viewfinderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  cornerNotch: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.archiveRed,
    borderWidth: 2,
    top: 10,
    left: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    right: 10,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: 10,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 2,
  },
  bottomRight: {
    bottom: 10,
    right: 10,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  captureButton: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    alignSelf: 'center',
  },
  photoReview: {
    alignItems: 'center',
    width: '100%',
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  retakeButton: {
    marginVertical: theme.spacing.lg,
  },
  objectsSection: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  objectsScrollView: {
    maxHeight: 120,
    marginBottom: theme.spacing.lg,
  },
  objectsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  objectButton: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.graphiteBlack,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.layout.borderRadius.sm,
    backgroundColor: theme.colors.agedVellum,
    minWidth: 80,
    alignItems: 'center',
  },
  objectButtonSelected: {
    backgroundColor: theme.colors.archiveRed,
    borderColor: theme.colors.archiveRed,
  },
  objectIndex: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedInkBlue,
    marginBottom: theme.spacing.xs,
  },
  objectButtonText: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.graphiteBlack,
    textAlign: 'center',
  },
  objectButtonTextSelected: {
    color: theme.colors.agedVellum,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  errorFrame: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.archiveRed,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(164, 70, 60, 0.1)',
  },
  errorLabel: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.archiveRed,
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.archiveRed,
    textAlign: 'center',
  },
  turnSubmittedFrame: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.margin.mobile,
    paddingVertical: theme.spacing.xxl,
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.fadedInkBlue,
    marginHorizontal: theme.spacing.margin.mobile,
    backgroundColor: 'rgba(74, 98, 116, 0.1)',
  },
  successText: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.fadedInkBlue,
    marginBottom: theme.spacing.lg,
  },
  shareButton: {
    marginTop: theme.spacing.lg,
  },
  waitingFrame: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    marginHorizontal: theme.spacing.margin.mobile,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.softGridGray,
    borderStyle: 'dashed',
  },
  waitingText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.fadedInkBlue,
    textAlign: 'center',
  },
}); 