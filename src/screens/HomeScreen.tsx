import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GridBackground } from '../components/GridBackground';
import { ScientificButton } from '../components/ScientificButton';
import { Storage } from '../utils/storage';
import { theme } from '../styles/theme';

export function HomeScreen() {
  const navigation = useNavigation<any>();

  // Check if user already has a name and go directly to dashboard
  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const existingName = await Storage.getPlayerName();
        if (existingName) {
          navigation.replace('Dashboard');
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
        // If there's an error, just stay on home screen
      }
    };

    checkExistingUser();
  }, [navigation]);

  return (
    <GridBackground showDiagonals>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Scientific title block */}
          <View style={styles.titleFrame}>
            <Text style={styles.figureLabel}>FIG. 1A — SPECIMEN ANALYSIS PROTOCOL</Text>
            <Text style={styles.title}>TWOVUE</Text>
            <Text style={styles.subtitle}>VISUAL OBJECT DETECTION GAME</Text>
            <View style={styles.underline} />
          </View>

          {/* Instructions block */}
          <View style={styles.instructionsFrame}>
            <Text style={styles.instructionsTitle}>OPERATIONAL PARAMETERS:</Text>
            <Text style={styles.instruction}>1. CAPTURE PHOTOGRAPHIC SPECIMEN</Text>
            <Text style={styles.instruction}>2. SELECT OBJECT CLASSIFICATIONS</Text>
            <Text style={styles.instruction}>3. TRANSMIT TO REMOTE OPERATOR</Text>
            <Text style={styles.instruction}>4. AWAIT SECONDARY ANALYSIS</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            <ScientificButton
              title="Initiate New Session"
              onPress={() => navigation.navigate('Dashboard')}
              variant="primary"
              size="large"
            />
            
            <ScientificButton
              title="Access Login Protocol"
              onPress={() => navigation.navigate('Login')}
              variant="secondary"
              size="medium"
            />
          </View>

          {/* Technical note */}
          <View style={styles.technicalNote}>
            <Text style={styles.noteText}>
              NOTE: ENSURE DEVICE CAMERA PERMISSIONS ENABLED
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </GridBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.margin.mobile,
    paddingVertical: theme.spacing.xxl,
    justifyContent: 'center',
  },
  titleFrame: {
    borderWidth: theme.layout.borderWidth.thick,
    borderColor: theme.colors.graphiteBlack,
    padding: theme.spacing.xxl,
    marginBottom: theme.spacing.xxxl,
    backgroundColor: 'rgba(231, 220, 197, 0.9)',
    alignItems: 'center',
  },
  figureLabel: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.fadedInkBlue,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  title: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.xxxl,
    color: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.sm,
    letterSpacing: 3,
  },
  subtitle: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedInkBlue,
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
  underline: {
    width: '60%',
    height: 2,
    backgroundColor: theme.colors.archiveRed,
  },
  instructionsFrame: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.fadedInkBlue,
    borderStyle: 'dashed',
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xxxl,
    backgroundColor: 'rgba(74, 98, 116, 0.05)',
  },
  instructionsTitle: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.lg,
  },
  instruction: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedInkBlue,
    marginBottom: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
  },
  buttonsContainer: {
    gap: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  technicalNote: {
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.softGridGray,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(188, 188, 188, 0.1)',
  },
  noteText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.softGridGray,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
}); 