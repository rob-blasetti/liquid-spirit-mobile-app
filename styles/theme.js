const themeVariables = {
    blueColor: '#0a488c',
    greenColor: '#58db33',
    redColor: '#e52f2f',
    pinkColor: '#fc59f8',
    greyColor: '#f3f3f3',
    blackColor: '#000000',
    whiteColor: '#ffffff',
    
    // These will need manual color adjustments, as React Native doesn't support LESS functions like 'lighten' and 'darken'
    lightGreyColor: '#f3f3f3', // Lighter grey (adjust manually)
    darkGreyColor: '#e0e0e0',  // Darker grey (adjust manually)
    
    primaryColor: '#0a488c', // This references blueColor, so we replace it
    primaryLightColor: '#3578a8', // Adjust this manually to be lighter blue
    primaryLighterColor: '#5b9ac8', // Even lighter blue
    
    secondaryColor: '#58db33',
    secondaryLightColor: '#72e457', // Adjust this manually to be lighter green
    secondaryDarkColor: '#44b628',  // Darker green
  
    tertiaryColor: '#fc59f8',
    tertiaryLightColor: '#ff85fc', // Lighter pink
    tertiaryDarkColor: '#e046d1',  // Darker pink
    
    neutralLight: '#f3f3f3',  // General light grey
    neutralDark: '#e0e0e0',   // General dark grey
    
    buttonPrimaryBg: '#0a488c',
    buttonPrimaryHoverBg: '#3578a8', // Hover for primary button
    buttonSecondaryBg: '#58db33',
    buttonSecondaryHoverBg: '#72e457', // Hover for secondary button
    buttonDisabledBg: '#f3f3f3', // Disabled button background
    buttonDisabledText: '#b3b3b3', // Lighter disabled button text
    
    borderColor: '#e0e0e0',  // Dark grey for borders
    borderLightColor: '#f3f3f3',  // Light grey for light borders
  
    menuBgColor: '#0a488c',
    menuTextColor: '#ffffff', // Assuming text inverse color is white
    menuHoverBg: '#58db33',
    menuHoverText: '#ffffff',
    
    formInputBg: '#ffffff',
    formInputBorder: '#e0e0e0',
    formInputFocusBorder: '#0a488c',
    formErrorBorder: '#e52f2f',  // Assuming error color is red
    formSuccessBorder: '#58db33', // Assuming success color is green
    
    alertSuccessBg: '#58db33',
    alertErrorBg: '#e52f2f',
    alertWarningBg: '#ffcc00', // Assuming a standard warning color
    alertTextColor: '#ffffff',
    
    fontFamily: "'Noto Sans', sans-serif",
    
    borderRadiusSharp: 0,
    borderRadiusPill: 20,
    borderRadiusJumbo: 44,
    
    boxShadowCard: 'rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px',
    boxShadowInfo: '0px 0px 12px -9px',
    
    pad: 10,
    margin: 10
  };
  
  export default themeVariables;
  