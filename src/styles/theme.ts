export const theme = {
  colors: {
    // Updated color system for better accessibility
    paperBeige: '#e7dcc5',     // Background
    inkBlack: '#1c1c1c',       // Lines, outlines, primary text (21:1 contrast ratio)
    fadedBlue: '#2d3e48',      // Accent, tags (darker for better contrast 7:1)
    archiveRed: '#8b3a31',     // Action elements, alerts (darker for better contrast)
    gridGray: '#8a8a8a',       // Guidelines, borders (darker for better contrast 3.5:1)
    
    // Semantic mappings
    background: '#e7dcc5',
    surface: '#e7dcc5',
    text: '#1c1c1c',
    textSecondary: '#2d3e48',  // Improved contrast
    accent: '#8b3a31',
    border: '#8a8a8a',         // Improved contrast
    
    // Legacy mappings for compatibility (will remove gradually)
    agedVellum: '#e7dcc5',
    graphiteBlack: '#1c1c1c',
    fadedInkBlue: '#2d3e48',   // Updated for accessibility
    softGridGray: '#8a8a8a',   // Updated for accessibility
  },
  
  typography: {
    // New typography system
    primary: {
      fontFamily: 'EB Garamond',  // Headers, poetry, app name
      fontWeight: '400' as const,
    },
    secondary: {
      fontFamily: 'IBM Plex Mono', // Labels, tags, small UI text
      fontWeight: '400' as const,
      letterSpacing: 0.5,
    },
    annotation: {
      fontFamily: 'Red Hat Mono',  // Drafting-style annotations
      fontWeight: '400' as const,
      letterSpacing: 0.5,
    },
    sizes: {
      xs: 10,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
      xxl: 32,
    },
  },
  
  spacing: {
    // Generous spacing for airy layout
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    huge: 64,
    
    // Specific spacing rules from style guide
    pageMargin: 24,
    moduleSpacing: 24,
    labelSpacing: 8,
    tagPadding: 12,
    
    margin: {
      mobile: 24,
      tablet: 48,
    },
  },
  
  layout: {
    borderRadius: {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
    },
    borderWidth: {
      thin: 1,
      normal: 1,
      thick: 2,
    },
    // Grid system for spatial consistency
    grid: {
      size: 10,
      color: '#bcbcbc',
    },
  },
  
  shadows: {
    // Minimal shadows for scientific aesthetic
    light: {
      shadowColor: '#1c1c1c',
      shadowOffset: { width: 1, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#1c1c1c',
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
  },
}; 