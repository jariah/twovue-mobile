import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';
import { theme } from '../styles/theme';

interface GridBackgroundProps {
  children: React.ReactNode;
  gridSize?: number;
  showDiagonals?: boolean;
}

export function GridBackground({ 
  children, 
  gridSize = 20, 
  showDiagonals = false 
}: GridBackgroundProps) {
  const { width, height } = Dimensions.get('window');
  
  return (
    <View style={styles.container}>
      <Svg 
        width={width} 
        height={height} 
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          <Pattern
            id="grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal grid lines */}
            <Line
              x1="0"
              y1={gridSize}
              x2={gridSize}
              y2={gridSize}
              stroke={theme.colors.softGridGray}
              strokeWidth="0.5"
              opacity="0.6"
            />
            {/* Vertical grid lines */}
            <Line
              x1={gridSize}
              y1="0"
              x2={gridSize}
              y2={gridSize}
              stroke={theme.colors.softGridGray}
              strokeWidth="0.5"
              opacity="0.6"
            />
            
            {/* Diagonal guide lines (optional) */}
            {showDiagonals && (
              <>
                <Line
                  x1="0"
                  y1="0"
                  x2={gridSize}
                  y2={gridSize}
                  stroke={theme.colors.softGridGray}
                  strokeWidth="0.3"
                  opacity="0.3"
                  strokeDasharray="2,2"
                />
                <Line
                  x1={gridSize}
                  y1="0"
                  x2="0"
                  y2={gridSize}
                  stroke={theme.colors.softGridGray}
                  strokeWidth="0.3"
                  opacity="0.3"
                  strokeDasharray="2,2"
                />
              </>
            )}
          </Pattern>
        </Defs>
        
        {/* Background */}
        <Rect width="100%" height="100%" fill={theme.colors.agedVellum} />
        
        {/* Grid overlay */}
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
      
      {/* Content overlay */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.agedVellum,
  },
  content: {
    flex: 1,
  },
}); 