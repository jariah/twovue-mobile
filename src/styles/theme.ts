export const theme = {
  colors: {
    // 1950s Scientific Drafting Palette
    agedVellum: '#e7dcc5',     // Paper background
    graphiteBlack: '#1c1c1c',  // Primary linework and text
    fadedInkBlue: '#4a6274',   // Secondary linework or callouts
    archiveRed: '#a4463c',     // Annotation/redline accents
    softGridGray: '#bcbcbc',   // Drafting grid and scaffolding
    
    // Functional colors
    background: '#e7dcc5',
    surface: '#f5f0e8',
    primary: '#1c1c1c',
    secondary: '#4a6274',
    accent: '#a4463c',
    text: '#1c1c1c',
    textSecondary: '#4a6274',
    border: '#bcbcbc',
    grid: '#bcbcbc',
    
    // Status colors
    success: '#4a6274',
    warning: '#a4463c',
    error: '#a4463c',
  },
  
  typography: {
    // Primary Font (Titles & Labels) - Geometric sans
    primary: {
      fontFamily: 'System', // We'll use system font for now, can upgrade to Futura PT
      fontWeight: '600' as const,
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
    },
    
    // Secondary Font (Annotations) - Monospace
    secondary: {
      fontFamily: 'Courier', // Built-in monospace, can upgrade to IBM Plex Mono
      fontWeight: '300' as const,
      letterSpacing: 0.3,
    },
    
    // Font sizes
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
      xxxl: 32,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
    
    // Grid system
    gutter: 16,
    margin: {
      mobile: 16,
      tablet: 24,
      desktop: 64,
    },
    
    // Component spacing
    viewfinder: 32,
    tagSelection: 24,
    button: {
      vertical: 12,
      horizontal: 24,
    },
  },
  
  layout: {
    grid: {
      columns: 12,
      baseline: 8,
    },
    
    borderRadius: {
      none: 0,
      sm: 2,
      md: 4,
      lg: 8,
    },
    
    borderWidth: {
      thin: 0.5,
      normal: 1,
      thick: 2,
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