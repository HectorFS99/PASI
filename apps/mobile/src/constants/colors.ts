/**
 * Cores literais para props que não aceitam className (ícones,
 * ActivityIndicator, placeholderTextColor, Switch...). Os tokens da marca
 * espelham tailwind.config.js — altere os dois juntos.
 */
export const colors = {
  // Marca (tailwind.config.js)
  primary: '#0D2347',
  muted: '#718096',
  border: '#E2E8F0',
  placeholder: '#A0AEC0',
  infoText: '#2B6CB0',
  successText: '#276749',

  // Neutros
  white: '#FFFFFF',
  black: '#000000',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4A5568',
  gray700: '#374151',

  // Semânticas
  success: '#16A34A',
  danger: '#DC2626',
  dangerLight: '#F87171',
  warning: '#C05621',
} as const;
