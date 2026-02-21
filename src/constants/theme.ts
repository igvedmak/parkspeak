export const colors = {
  textPrimary: '#2D2D2D',
  textSecondary: '#5C5C5C',
  background: '#FAFAF8',
  surface: '#FFFFFF',
  accent: '#4A90D9',
  accentLight: '#E8F0FE',
  accentDark: '#3A7BC8',
  success: '#2E7D4F',
  successLight: '#E8F5EC',
  warning: '#C47F17',
  warningLight: '#FEF3E0',
  error: '#C0392B',
  errorLight: '#FDECEB',
  border: '#E5E5E3',
  overlay: 'rgba(0,0,0,0.04)',
} as const;

// Per-exercise-type accent colors
export const exerciseColors = {
  phonation: '#4A90D9',
  reading: '#2E7D4F',
  articulation: '#C47F17',
  pitch: '#8B5CF6',
  functional: '#0D9488',
  warmup: '#E67E22',
  breath: '#3498DB',
  facial: '#E91E8A',
  guided: '#4A90D9',
} as const;

export const exerciseColorsLight = {
  phonation: '#E8F0FE',
  reading: '#E8F5EC',
  articulation: '#FEF3E0',
  pitch: '#EDE9FE',
  functional: '#CCFBF1',
  warmup: '#FEF3E0',
  breath: '#E8F0FE',
  facial: '#FCE4F3',
  guided: '#E8F0FE',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  fontFamily: 'System',
  sizes: {
    base: 18,
    lg: 22,
    xl: 28,
    heading: 32,
    small: 15,
    xs: 12,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
