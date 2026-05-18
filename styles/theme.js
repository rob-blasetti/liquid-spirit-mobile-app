import { processColor, StyleSheet } from 'react-native';

export const THEME_STORAGE_KEY = 'liquidSpirit.themeMode';

const baseTheme = {
  blueColor: '#0a488c',
  greenColor: '#58db33',
  redColor: '#e52f2f',
  pinkColor: '#fc59f8',
  greyColor: '#f3f3f3',
  blackColor: '#000000',
  whiteColor: '#ffffff',

  lightGreyColor: '#f3f3f3',
  darkGreyColor: '#e0e0e0',
  midGreyColor: '#fafafa',

  primaryColor: '#312783',
  primaryLightColor: '#3578a8',
  primaryLighterColor: '#5b9ac8',

  secondaryColor: '#58db33',
  secondaryLightColor: '#72e457',
  secondaryDarkColor: '#44b628',

  tertiaryColor: '#fc59f8',
  tertiaryLightColor: '#ff85fc',
  tertiaryDarkColor: '#e046d1',

  textColor: '#333333',
  textMutedColor: '#808080',
  textInverseColor: '#ffffff',
  textStrongColor: '#333333',
  textMutedStrongColor: '#666666',
  textSubtleColor: '#6c757d',
  textSoftInverseColor: '#f1f4ff',

  surfaceLightColor: '#f5f5f5',
  surfaceDark1Color: '#1f1f1f',
  surfaceDark2Color: '#232323',
  surfaceDark3Color: '#2a2a2a',
  surfaceDark4Color: '#353535',
  surfaceDarkBaseColor: '#121212',
  surfaceDarkNavColor: '#1c1c1c',
  surfaceDarkAuthColor: '#1f232b',
  surfaceDarkAuthElevatedColor: '#2a2f39',

  neutralLight: '#f3f3f3',
  neutralDark: '#e0e0e0',

  buttonPrimaryBg: '#0a488c',
  buttonPrimaryHoverBg: '#3578a8',
  buttonSecondaryBg: '#58db33',
  buttonSecondaryHoverBg: '#72e457',
  buttonDisabledBg: '#f3f3f3',
  buttonDisabledText: '#b3b3b3',

  borderColor: '#e0e0e0',
  borderLightColor: '#f3f3f3',
  borderMutedColor: '#cccccc',
  borderSoftColor: '#e0e0e0',
  borderSubtleColor: '#e5e7eb',

  screenBackgroundColor: '#ffffff',

  menuBgColor: '#0a488c',
  menuTextColor: '#ffffff',
  menuHoverBg: '#58db33',
  menuHoverText: '#ffffff',

  formInputBg: '#ffffff',
  formInputBorder: '#e0e0e0',
  formInputFocusBorder: '#0a488c',
  formErrorBorder: '#e52f2f',
  formSuccessBorder: '#58db33',

  alertSuccessBg: '#58db33',
  alertErrorBg: '#e52f2f',
  alertWarningBg: '#ffcc00',
  alertTextColor: '#ffffff',

  fontFamily: "'Noto Sans', sans-serif",

  borderRadiusSharp: 0,
  borderRadiusPill: 20,
  borderRadiusJumbo: 44,

  boxShadowCard: 'rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px',
  boxShadowInfo: '0px 0px 12px -9px',

  spacing: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    xxl: 32,
  },

  pad: 10,
  margin: 10,
};

const darkTheme = {
  ...baseTheme,
  blackColor: '#f1f4ff',
  whiteColor: '#1f1f1f',
  greyColor: '#2a2a2a',
  lightGreyColor: '#353535',
  darkGreyColor: '#4a4a4a',
  midGreyColor: '#232323',
  primaryColor: '#8d9cff',
  primaryLightColor: '#aeb8ff',
  primaryLighterColor: '#c7ceff',
  secondaryColor: '#72e457',
  secondaryLightColor: '#93ec7e',
  tertiaryColor: '#ff85fc',
  textColor: '#f1f4ff',
  textMutedColor: 'rgba(241, 244, 255, 0.68)',
  textStrongColor: '#f1f4ff',
  textMutedStrongColor: 'rgba(241, 244, 255, 0.72)',
  textSubtleColor: 'rgba(241, 244, 255, 0.6)',
  neutralLight: '#2a2a2a',
  neutralDark: '#353535',
  buttonPrimaryBg: '#4b42a8',
  buttonPrimaryHoverBg: '#5a50bc',
  buttonDisabledBg: '#353535',
  buttonDisabledText: 'rgba(241, 244, 255, 0.4)',
  borderColor: 'rgba(255, 255, 255, 0.2)',
  borderLightColor: 'rgba(255, 255, 255, 0.14)',
  borderMutedColor: 'rgba(255, 255, 255, 0.22)',
  borderSoftColor: 'rgba(255, 255, 255, 0.18)',
  borderSubtleColor: 'rgba(255, 255, 255, 0.12)',
  screenBackgroundColor: '#121212',
  menuBgColor: '#1c1c1c',
  formInputBg: '#262626',
  formInputBorder: 'rgba(255, 255, 255, 0.2)',
  formInputFocusBorder: '#8d9cff',
};

const modeState = {
  mode: 'light',
};

const subscribers = new Set();

const lightToDarkBackground = {
  '#fff': darkTheme.surfaceDark1Color,
  '#ffffff': darkTheme.surfaceDark1Color,
  '#f3f3f3': darkTheme.surfaceDark2Color,
  '#f5f5f5': darkTheme.surfaceDark2Color,
  '#f6f6f8': darkTheme.surfaceDark2Color,
  '#f6f7fb': darkTheme.surfaceDark2Color,
  '#fafafa': darkTheme.surfaceDark2Color,
  '#eceff3': darkTheme.surfaceDark3Color,
  '#ececec': darkTheme.surfaceDark3Color,
  '#eee': darkTheme.surfaceDark3Color,
  '#eeeeee': darkTheme.surfaceDark3Color,
  '#e1e1e1': darkTheme.surfaceDark3Color,
  '#e0e0e0': darkTheme.surfaceDark3Color,
  '#ddd': darkTheme.surfaceDark4Color,
  'rgba(255,255,255,0.04)': 'rgba(255, 255, 255, 0.08)',
  'rgba(255,255,255,0.16)': 'rgba(255, 255, 255, 0.16)',
  'rgba(255,255,255,0.2)': 'rgba(255, 255, 255, 0.18)',
  'rgba(255,255,255,0.72)': 'rgba(31, 31, 31, 0.72)',
  'rgba(255,255,255,0.92)': 'rgba(31, 31, 31, 0.94)',
  'rgba(255,255,255,0.96)': 'rgba(31, 31, 31, 0.96)',
};

const lightToDarkText = {
  '#000': darkTheme.textSoftInverseColor,
  '#000000': darkTheme.textSoftInverseColor,
  '#111': darkTheme.textSoftInverseColor,
  '#333': darkTheme.textSoftInverseColor,
  '#333333': darkTheme.textSoftInverseColor,
  '#444': 'rgba(241, 244, 255, 0.86)',
  '#555': 'rgba(241, 244, 255, 0.72)',
  '#666': 'rgba(241, 244, 255, 0.68)',
  '#6c757d': 'rgba(241, 244, 255, 0.62)',
  '#777': 'rgba(241, 244, 255, 0.58)',
  '#808080': 'rgba(241, 244, 255, 0.58)',
  '#999': 'rgba(241, 244, 255, 0.52)',
  'rgba(0,0,0,0.87)': 'rgba(241, 244, 255, 0.9)',
  'rgba(0,0,0,0.54)': 'rgba(241, 244, 255, 0.7)',
  'rgba(0,0,0,0.38)': 'rgba(241, 244, 255, 0.52)',
  'rgba(0,0,0,0.6)': 'rgba(241, 244, 255, 0.62)',
};

const lightToDarkBorder = {
  '#fff': 'rgba(255, 255, 255, 0.14)',
  '#ffffff': 'rgba(255, 255, 255, 0.14)',
  '#f3f3f3': 'rgba(255, 255, 255, 0.12)',
  '#e5e7eb': 'rgba(255, 255, 255, 0.12)',
  '#e8ebf0': 'rgba(255, 255, 255, 0.12)',
  '#e0e0e0': 'rgba(255, 255, 255, 0.16)',
  '#ddd': 'rgba(255, 255, 255, 0.16)',
  '#cccccc': 'rgba(255, 255, 255, 0.2)',
  '#ccc': 'rgba(255, 255, 255, 0.2)',
  '#999': 'rgba(255, 255, 255, 0.28)',
  'rgba(0,0,0,0.08)': 'rgba(255, 255, 255, 0.12)',
  'rgba(0,0,0,0.12)': 'rgba(255, 255, 255, 0.14)',
  'rgba(0,0,0,0.2)': 'rgba(255, 255, 255, 0.2)',
};

const lightPrimaryValues = new Set(['#312783', '#0a488c', '#3578a8', '#5b9ac8']);

const normalizeColor = value => {
  if (typeof value !== 'string') return null;
  return value.replace(/\s+/g, '').toLowerCase();
};

const applyDarkColor = (property, value) => {
  const normalized = normalizeColor(value);
  if (!normalized || modeState.mode !== 'dark') {
    return value;
  }

  if (lightPrimaryValues.has(normalized)) {
    return darkTheme.primaryColor;
  }

  if (property === 'color') {
    return lightToDarkText[normalized] || value;
  }

  if (property === 'shadowColor') {
    return '#000000';
  }

  if (property.toLowerCase().includes('border')) {
    return lightToDarkBorder[normalized] || value;
  }

  if (property === 'backgroundColor') {
    return lightToDarkBackground[normalized] || value;
  }

  return value;
};

const installColorPreprocessors = () => {
  if (global.__LIQUID_SPIRIT_THEME_PREPROCESSORS__) return;
  global.__LIQUID_SPIRIT_THEME_PREPROCESSORS__ = true;

  let ReactNativeStyleAttributes = null;
  try {
    ReactNativeStyleAttributes = require('react-native/Libraries/Components/View/ReactNativeStyleAttributes').default;
  } catch (error) {
    ReactNativeStyleAttributes = null;
  }

  [
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'color',
    'shadowColor',
    'textDecorationColor',
    'textShadowColor',
    'tintColor',
  ].forEach(property => {
    const process = value => {
      const nextValue = applyDarkColor(property, value);
      return processColor(nextValue);
    };

    const attribute = ReactNativeStyleAttributes?.[property];
    if (attribute === true) {
      ReactNativeStyleAttributes[property] = { process };
      return;
    }
    if (typeof attribute === 'object') {
      ReactNativeStyleAttributes[property] = { ...attribute, process };
      return;
    }

    StyleSheet.setStyleAttributePreprocessor(property, process);
  });
};

installColorPreprocessors();

export const getThemeMode = () => modeState.mode;

export const isDarkTheme = () => modeState.mode === 'dark';

export const setThemeMode = nextMode => {
  const normalizedMode = nextMode === 'dark' ? 'dark' : 'light';
  if (modeState.mode === normalizedMode) return;
  modeState.mode = normalizedMode;
  subscribers.forEach(listener => listener(normalizedMode));
};

export const subscribeToThemeMode = listener => {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
};

export const getTheme = () => (isDarkTheme() ? darkTheme : baseTheme);

export const getThemeVariables = scheme => (scheme === 'dark' ? darkTheme : baseTheme);

export const lightThemeVariables = baseTheme;
export const darkThemeVariables = darkTheme;

const themeVariables = new Proxy(baseTheme, {
  get(target, property) {
    const activeTheme = getTheme();
    if (property in activeTheme) return activeTheme[property];
    return target[property];
  },
});

export default themeVariables;
