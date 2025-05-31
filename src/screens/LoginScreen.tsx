import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Storage } from '../utils/storage';
import { GridBackground } from '../components/GridBackground';
import { ScientificButton } from '../components/ScientificButton';
import { theme } from '../styles/theme';

export function LoginScreen() {
  const [name, setName] = useState('');
  const navigation = useNavigation<any>();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your operator identification');
      return;
    }

    try {
      await Storage.setPlayerName(name.trim());
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to save operator identification');
    }
  };

  return (
    <GridBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header frame */}
          <View style={styles.headerFrame}>
            <Text style={styles.figureLabel}>FIG. 1B — OPERATOR REGISTRATION</Text>
            <Text style={styles.title}>IDENTIFICATION PROTOCOL</Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsFrame}>
            <Text style={styles.instructionsTitle}>REGISTRATION REQUIREMENTS:</Text>
            <Text style={styles.instruction}>• ALPHANUMERIC DESIGNATION REQUIRED</Text>
            <Text style={styles.instruction}>• MINIMUM 2 CHARACTER LENGTH</Text>
            <Text style={styles.instruction}>• CASE SENSITIVITY MAINTAINED</Text>
          </View>

          {/* Input form */}
          <View style={styles.formFrame}>
            <Text style={styles.inputLabel}>OPERATOR DESIGNATION:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="ENTER IDENTIFICATION"
                placeholderTextColor={theme.colors.softGridGray}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <View style={styles.inputUnderline} />
            </View>
            
            <ScientificButton
              title="Register Operator"
              onPress={handleSubmit}
              variant="primary"
              size="large"
              disabled={!name.trim()}
              style={styles.submitButton}
            />
          </View>

          {/* Technical note */}
          <View style={styles.noteFrame}>
            <Text style={styles.noteTitle}>NOTICE:</Text>
            <Text style={styles.noteText}>
              Operator identification will be stored locally on device.
              Data transmission occurs only during active analysis sessions.
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
    paddingVertical: theme.spacing.xl,
    justifyContent: 'center',
  },
  headerFrame: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.graphiteBlack,
    borderStyle: 'dashed',
    padding: theme.spacing.xl,
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
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.graphiteBlack,
    letterSpacing: 1.5,
  },
  instructionsFrame: {
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.fadedInkBlue,
    borderStyle: 'solid',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxxl,
    backgroundColor: 'rgba(74, 98, 116, 0.05)',
  },
  instructionsTitle: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.md,
  },
  instruction: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.fadedInkBlue,
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
  },
  formFrame: {
    borderWidth: theme.layout.borderWidth.normal,
    borderColor: theme.colors.graphiteBlack,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: 'rgba(245, 240, 232, 0.8)',
  },
  inputLabel: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.graphiteBlack,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  input: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.graphiteBlack,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  inputUnderline: {
    height: theme.layout.borderWidth.normal,
    backgroundColor: theme.colors.graphiteBlack,
    marginTop: theme.spacing.xs,
  },
  submitButton: {
    alignSelf: 'center',
  },
  noteFrame: {
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.softGridGray,
    borderStyle: 'dashed',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(188, 188, 188, 0.05)',
  },
  noteTitle: {
    ...theme.typography.primary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.softGridGray,
    marginBottom: theme.spacing.sm,
  },
  noteText: {
    ...theme.typography.secondary,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.softGridGray,
    lineHeight: theme.typography.sizes.sm,
  },
}); 