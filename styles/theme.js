import { Appearance } from 'react-native';

const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
};

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

  primaryColor: '#312783',
  primaryLightColor: '#3578a8',
  primaryLighterColor: '#5b9ac8',

  secondaryColor: '#58db33',
  secondaryLightColor: '#72e457',
  secondaryDarkColor: '#44b628',

  tertiaryColor: '#fc59f8',
  tertiaryLightColor: '#ff85fc',
  tertiaryDarkColor: '#e046d1',

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
  spacing,
  pad: 10,
  margin: 10,
};

const darkTheme = {
  ...baseTheme,
  greyColor: '#111827',
  blackColor: '#f8fafc',
  whiteColor: '#0b1220',
  lightGreyColor: '#1f2937',
  darkGreyColor: '#334155',
  neutralLight: '#111827',
  neutralDark: '#334155',
  buttonDisabledBg: '#1f2937',
  buttonDisabledText: '#94a3b8',
  borderColor: '#334155',
  borderLightColor: '#1f2937',
  screenBackgroundColor: '#0b1220',
  menuBgColor: '#111827',
  menuTextColor: '#f8fafc',
  formInputBg: '#111827',
  formInputBorder: '#334155',
  alertTextColor: '#f8fafc',
  boxShadowCard: 'rgba(0, 0, 0, 0.5) 0px 10px 36px 0px, rgba(0, 0, 0, 0.2) 0px 0px 0px 1px',
};

export const getThemeVariables = scheme => (scheme === 'dark' ? darkTheme : baseTheme);

const themeVariables = getThemeVariables(Appearance.getColorScheme());

export default themeVariables;
