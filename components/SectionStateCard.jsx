import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';
import {useTheme} from '../contexts/ThemeContext';

const CARD_DARK_BORDER_COLOR = 'rgba(255, 255, 255, 0.35)';

const SectionStateCard = ({
  title,
  message,
  icon = 'sparkles-outline',
  loading = false,
  dashboardCard = false,
}) => {
  const {isDarkMode} = useTheme();

  return (
    <View
      style={[
        styles.card,
        dashboardCard && styles.dashboardCard,
        dashboardCard && isDarkMode && styles.dashboardCardDark,
      ]}>
      <View style={styles.iconWrap}>
        {loading ? (
          <ActivityIndicator size="small" color={themeVariables.primaryColor} />
        ) : (
          <Ionicons name={icon} size={20} color={themeVariables.primaryColor} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  dashboardCard: {
    borderRadius: 8,
  },
  dashboardCardDark: {
    borderColor: CARD_DARK_BORDER_COLOR,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F4F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    color: '#666666',
    textAlign: 'center',
  },
});

export default SectionStateCard;
