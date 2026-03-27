const common = {
  primary: '#5C7CFF',
  secondary: '#8B9DC3',
  accent: '#FF453A',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
};

const dark = {
  ...common,
  background: '#121212',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#D1D1D6',
  border: '#2C2C2E',
};

const light = {
  ...common,
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#3C3C43',
  border: '#C7C7CC',
  primary: '#007AFF',
};

export const Colors = {
  ...light, // Default for non-migrated components
  common,
  light,
  dark,
};
