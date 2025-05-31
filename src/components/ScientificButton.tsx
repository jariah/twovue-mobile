import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../styles/theme';

interface ScientificButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function ScientificButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
}: ScientificButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text 
        style={[
          styles.text,
          styles[`${variant}Text`],
          styles[`${size}Text`],
          disabled && styles.disabledText,
          textStyle,
        ]}
      >
        {title.toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: theme.layout.borderWidth.normal,
    borderStyle: 'solid',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: theme.layout.borderRadius.sm,
  },
  
  // Variants
  primary: {
    borderColor: theme.colors.graphiteBlack,
    backgroundColor: theme.colors.agedVellum,
  },
  secondary: {
    borderColor: theme.colors.fadedInkBlue,
    backgroundColor: 'transparent',
  },
  accent: {
    borderColor: theme.colors.archiveRed,
    backgroundColor: theme.colors.archiveRed,
  },
  
  // Sizes
  small: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minWidth: 80,
  },
  medium: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minWidth: 120,
  },
  large: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
    minWidth: 160,
  },
  
  // Disabled state
  disabled: {
    opacity: 0.5,
    borderColor: theme.colors.softGridGray,
  },
  
  // Text styles
  text: {
    ...theme.typography.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // Text variants
  primaryText: {
    color: theme.colors.graphiteBlack,
    fontSize: theme.typography.sizes.md,
  },
  secondaryText: {
    color: theme.colors.fadedInkBlue,
    fontSize: theme.typography.sizes.md,
  },
  accentText: {
    color: theme.colors.agedVellum,
    fontSize: theme.typography.sizes.md,
  },
  
  // Text sizes
  smallText: {
    fontSize: theme.typography.sizes.sm,
  },
  mediumText: {
    fontSize: theme.typography.sizes.md,
  },
  largeText: {
    fontSize: theme.typography.sizes.lg,
  },
  
  disabledText: {
    color: theme.colors.softGridGray,
  },
}); 