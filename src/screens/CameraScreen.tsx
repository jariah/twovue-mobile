import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GameAPI } from '../services/api';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  gameId: string;
  playerName: string;
  currentTurn: number;
  prevTags: string[];
}

export function CameraScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { gameId, playerName, currentTurn, prevTags = [] } = route.params as RouteParams;
  const cameraRef = useRef<CameraView>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Animation values for sci-fi effects
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const analysisBoxes = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Sci-fi scanning animation
  const startScanAnimation = () => {
    // Scanning line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Random analysis boxes appearing
    analysisBoxes.forEach((anim, index) => {
      const delay = Math.random() * 3000;
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(1000 + Math.random() * 1000),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, delay);
    });
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        setPhoto(photo.uri);
        setIsAnalyzing(true);
        startScanAnimation();

        try {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
        } catch (saveError) {
          console.error('Error saving to library:', saveError);
        }

        try {
          const result = await GameAPI.detectObjects(photo.uri);
          const objects = result.labels.slice(0, 20);
          
          if (objects.length === 0) {
            setError('NO OBJECTS DETECTED — RETAKE SPECIMEN');
          } else {
            setDetectedObjects(objects);
          }
        } catch (detectError: any) {
          console.error('Object detection error:', detectError);
          setError(`ANALYSIS FAILED — ${detectError.message || 'SYSTEM ERROR'}`);
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      setError(`CAPTURE FAILED — ${error.message || 'UNKNOWN ERROR'}`);
    }
  };

  const retakePicture = () => {
    setPhoto(null);
    setDetectedObjects([]);
    setSelectedTags([]);
    setError(null);
  };

  const selectTag = (tag: string) => {
    const maxSelection = currentTurn === 1 ? 3 : 2;
    if (selectedTags.length < maxSelection && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const canSubmit = () => {
    if (currentTurn === 1) {
      return selectedTags.length === 3;
    }
    // For turn 2+: Must have shared tag and 2 selections
    const sharedTag = prevTags.find(tag => detectedObjects.includes(tag));
    return sharedTag && selectedTags.length === 2;
  };

  const submitAnalysis = async () => {
    if (!photo) return;

    try {
      let finalTags = selectedTags;
      let sharedTag = selectedTags[0];

      if (currentTurn > 1) {
        const detectedSharedTag = prevTags.find(tag => detectedObjects.includes(tag));
        if (detectedSharedTag) {
          finalTags = [detectedSharedTag, ...selectedTags];
          sharedTag = detectedSharedTag;
        }
      }

      await GameAPI.submitTurn(gameId, {
        player_name: playerName,
        photo_url: photo,
        tags: finalTags,
        shared_tag: sharedTag,
        detected_tags: detectedObjects,
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert('SUBMISSION FAILED', 'Unable to process analysis');
    }
  };

  const renderTagSlots = () => {
    const maxTags = currentTurn === 1 ? 3 : 2;
    const sharedTag = currentTurn > 1 ? prevTags.find(tag => detectedObjects.includes(tag)) : null;
    
    return (
      <View style={styles.tagSlotsContainer}>
        {currentTurn > 1 && (
          <View style={[styles.tagSlot, styles.sharedTagSlot]}>
            <Text style={styles.tagSlotLabel}>SHARED</Text>
            <Text style={styles.sharedTagText}>
              {sharedTag ? sharedTag.toUpperCase() : '⚠️ NONE DETECTED'}
            </Text>
          </View>
        )}
        
        {Array.from({ length: maxTags }, (_, index) => (
          <View key={index} style={[styles.tagSlot, selectedTags[index] && styles.filledTagSlot]}>
            <Text style={styles.tagSlotLabel}>TAG {index + 1}</Text>
            {selectedTags[index] ? (
              <TouchableOpacity onPress={() => removeTag(selectedTags[index])}>
                <Text style={styles.selectedTagText}>{selectedTags[index].toUpperCase()}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.emptyTagText}>EMPTY</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.inkBlack} />
        <Text style={styles.statusText}>INITIALIZING CAPTURE SYSTEM</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>CAMERA ACCESS DENIED</Text>
        <Text style={styles.statusText}>Enable camera permissions to continue</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {!photo ? (
        // Camera View
        <View style={styles.cameraContainer}>
          <CameraView 
            ref={cameraRef} 
            style={styles.camera}
            facing="back"
          />
          
          {/* Camera Overlay */}
          <View style={styles.cameraOverlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Text style={styles.backText}>← ABORT</Text>
                </TouchableOpacity>
                <Text style={styles.turnLabel}>TURN {currentTurn} CAPTURE</Text>
              </View>
              
              {/* Square viewfinder with 1940s sci-fi elements */}
              <View style={styles.viewfinderContainer}>
                <View style={styles.viewfinder}>
                  {/* Corner brackets */}
                  <View style={[styles.cornerBracket, styles.topLeft]} />
                  <View style={[styles.cornerBracket, styles.topRight]} />
                  <View style={[styles.cornerBracket, styles.bottomLeft]} />
                  <View style={[styles.cornerBracket, styles.bottomRight]} />
                  
                  {/* Center crosshairs */}
                  <View style={styles.crosshairs}>
                    <View style={styles.crosshairHorizontal} />
                    <View style={styles.crosshairVertical} />
                  </View>
                  
                  {/* Technical annotations */}
                  <View style={styles.technicalOverlay}>
                    <Text style={styles.technicalText}>FOCAL LENGTH: 35MM</Text>
                    <Text style={styles.technicalText}>EXPOSURE: AUTO</Text>
                    <Text style={styles.technicalText}>FILM: READY</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.footer}>
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </View>
      ) : (
        // Analysis View
        <SafeAreaView style={styles.analysisContainer}>
          <View style={styles.analysisHeader}>
            <TouchableOpacity onPress={retakePicture} style={styles.backButton}>
              <Text style={styles.backText}>← RETAKE</Text>
            </TouchableOpacity>
            <Text style={styles.analysisTitle}>SPECIMEN ANALYSIS</Text>
          </View>

          <View style={styles.photoContainer}>
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
            
            {/* Sci-fi scanning overlay */}
            {isAnalyzing && (
              <View style={styles.scanningOverlay}>
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [{
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-2, height * 0.6],
                        }),
                      }],
                    },
                  ]}
                />
                
                {analysisBoxes.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.analysisBox,
                      {
                        left: Math.random() * width * 0.7,
                        top: Math.random() * height * 0.4 + 100,
                        opacity: anim,
                        transform: [{ scale: anim }],
                      },
                    ]}
                  />
                ))}
                
                <View style={styles.analysisStatus}>
                  <ActivityIndicator size="large" color={theme.colors.archiveRed} />
                  <Text style={styles.analysisText}>ANALYZING SPECIMEN...</Text>
                </View>
              </View>
            )}
          </View>

          {!isAnalyzing && detectedObjects.length > 0 && (
            <View style={styles.selectionContainer}>
              {renderTagSlots()}
              
              <View style={styles.objectsContainer}>
                <Text style={styles.objectsTitle}>DETECTED OBJECTS</Text>
                <View style={styles.objectsGrid}>
                  {detectedObjects
                    .filter(obj => !selectedTags.includes(obj))
                    .map((object, index) => (
                      <TouchableOpacity
                        key={object}
                        style={styles.objectButton}
                        onPress={() => selectTag(object)}
                      >
                        <Text style={styles.objectText}>{object.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
              
              <TouchableOpacity
                style={[styles.submitButton, !canSubmit() && styles.submitButtonDisabled]}
                onPress={submitAnalysis}
                disabled={!canSubmit()}
              >
                <Text style={styles.submitText}>SUBMIT ANALYSIS</Text>
              </TouchableOpacity>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.inkBlack,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  footer: {
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  backText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.paperBeige,
    textTransform: 'uppercase',
  },
  turnLabel: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.paperBeige,
    textTransform: 'uppercase',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  viewfinder: {
    aspectRatio: 1, // Square viewfinder
    width: '100%',
    maxWidth: 300,
    maxHeight: 300,
    borderWidth: 2,
    borderColor: theme.colors.paperBeige,
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: theme.colors.paperBeige,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  crosshairs: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: -20,
    marginLeft: -20,
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.paperBeige,
    opacity: 0.7,
  },
  crosshairVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: theme.colors.paperBeige,
    opacity: 0.7,
  },
  technicalOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
  },
  technicalText: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.paperBeige,
    opacity: 0.8,
    marginBottom: 2,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: theme.colors.paperBeige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.paperBeige,
  },
  analysisContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  analysisTitle: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.inkBlack,
  },
  photoContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginVertical: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.inkBlack,
    aspectRatio: 1, // Square photo display
    width: '85%',
    maxWidth: 300,
  },
  photo: {
    width: '100%',
    height: '100%',
    aspectRatio: 1, // Square photo
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.archiveRed,
    shadowColor: theme.colors.archiveRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  analysisBox: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: theme.colors.archiveRed,
    backgroundColor: 'rgba(164, 70, 60, 0.2)',
  },
  analysisStatus: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  analysisText: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.archiveRed,
    marginTop: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  selectionContainer: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  tagSlotsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  tagSlot: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gridGray,
    borderStyle: 'dashed',
    padding: theme.spacing.md,
    alignItems: 'center',
    minHeight: 60,
  },
  sharedTagSlot: {
    borderColor: theme.colors.fadedBlue,
    backgroundColor: 'rgba(74, 98, 116, 0.1)',
  },
  filledTagSlot: {
    borderColor: theme.colors.archiveRed,
    backgroundColor: 'rgba(164, 70, 60, 0.1)',
  },
  tagSlotLabel: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedBlue,
    marginBottom: theme.spacing.xs,
  },
  selectedTagText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.inkBlack,
    textAlign: 'center',
  },
  sharedTagText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedBlue,
    textAlign: 'center',
  },
  emptyTagText: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.gridGray,
    textAlign: 'center',
  },
  objectsContainer: {
    marginBottom: theme.spacing.xl,
  },
  objectsTitle: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.inkBlack,
    marginBottom: theme.spacing.md,
  },
  objectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  objectButton: {
    borderWidth: 1,
    borderColor: theme.colors.inkBlack,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  objectText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.inkBlack,
  },
  submitButton: {
    borderWidth: 2,
    borderColor: theme.colors.archiveRed,
    padding: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  submitButtonDisabled: {
    borderColor: theme.colors.gridGray,
  },
  submitText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.archiveRed,
    textTransform: 'uppercase',
  },
  statusText: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedBlue,
    marginTop: theme.spacing.md,
    textTransform: 'uppercase',
  },
  errorText: {
    ...theme.typography.annotation,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.archiveRed,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
}); 