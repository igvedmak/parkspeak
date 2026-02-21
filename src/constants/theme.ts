export const colors = {
  textPrimary: '#2D2D2D',
  textSecondary: '#5C5C5C',
  background: '#FAFAF8',
  surface: '#FFFFFF',
  accent: '#4A90D9',
  accentLight: '#E8F0FE',
  success: '#2E7D4F',
  successLight: '#E8F5EC',
  warning: '#C47F17',
  warningLight: '#FEF3E0',
  error: '#C0392B',
  errorLight: '#FDECEB',
  border: '#E5E5E3',
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
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
