import { Appearance } from 'react-native';

const lightColors = {
  primary: '#312783',
  secondary: '#3FA7A1',
  background: '#ecf0f1',
  text: '#2c3e50',
  error: '#e74c3c',
};

const darkColors = {
  primary: '#8b7cf5',
  secondary: '#63c7c2',
  background: '#0b1220',
  text: '#f8fafc',
  error: '#f87171',
};

export const getColors = scheme => (scheme === 'dark' ? darkColors : lightColors);

export const colors = getColors(Appearance.getColorScheme());
