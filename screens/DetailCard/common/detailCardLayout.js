import themeVariables from '../../../styles/theme';

export const detailCardOverlay = {
  width: '100%',
  marginTop: -40,
  backgroundColor: themeVariables.whiteColor,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingHorizontal: 20,
  paddingTop: 18,
  paddingBottom: 20,
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
};

export const detailCardHorizontalPadding = detailCardOverlay.paddingHorizontal;

export const detailCardTitle = {
  fontSize: 24,
  fontWeight: '700',
  color: themeVariables.blackColor,
  textAlign: 'center',
};

export const detailCardSubtitle = {
  fontSize: 20,
  color: '#444',
  textAlign: 'center',
};

export const detailCardContent = {
  paddingTop: 10,
};
