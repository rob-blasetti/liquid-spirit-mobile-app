import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';

export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

export const CardTitle = ({
  title,
  subtitle,
  avatarSource,
  subtitleAbove = false,
  style,
  titleStyle,
  subtitleStyle,
  avatarStyle,
  isDark = false,
}) => {
  const hasTitle = title !== undefined && title !== null;
  const hasSubtitle = subtitle !== undefined && subtitle !== null;
  const titleSpacing = hasTitle && hasSubtitle ? styles.titleSpacing : null;
  const avatarTitleAdjustment = avatarSource ? styles.avatarTitleText : null;

  const computedTitleStyle = [
    styles.titleText,
    isDark ? styles.lightText : styles.darkText,
    !subtitleAbove ? titleSpacing : null,
    avatarTitleAdjustment,
    titleStyle,
  ];

  const computedSubtitleStyle = [
    styles.subtitleText,
    isDark ? styles.lightText : null,
    subtitleAbove ? titleSpacing : null,
    subtitleStyle,
  ];

  return (
    <View style={[styles.cardTitle, style]}>
      {avatarSource ? (
        <Image source={avatarSource} resizeMode="stretch" style={[styles.avatarStyle, avatarStyle]} />
      ) : null}
      <View style={styles.cardTitleTextContainer}>
        {subtitleAbove && hasSubtitle ? <Text style={computedSubtitleStyle}>{subtitle}</Text> : null}
        {hasTitle ? <Text style={computedTitleStyle}>{title}</Text> : null}
        {!subtitleAbove && hasSubtitle ? <Text style={computedSubtitleStyle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

export const CardContent = ({
  children,
  text,
  avatarSource,
  style,
  textStyle,
  avatarStyle,
  isDark = false,
}) => {
  const contentText = text !== undefined && text !== null ? String(text) : null;
  const computedTextStyle = [
    styles.contentText,
    isDark ? styles.lightText : null,
    textStyle,
  ];

  return (
    <View style={[styles.cardContent, style]}>
      {avatarSource ? (
        <Image source={avatarSource} resizeMode="stretch" style={[styles.avatarStyle, styles.contentAvatar, avatarStyle]} />
      ) : null}
      <View style={styles.cardContentTextContainer}>
        {contentText ? <Text style={computedTextStyle}>{contentText}</Text> : children}
      </View>
    </View>
  );
};

Card.displayName = 'Card';
CardTitle.displayName = 'CardTitle';
CardContent.displayName = 'CardContent';

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  darkText: {
    color: 'rgba(0 ,0 ,0 , 0.87)',
  },
  lightText: {
    color: 'rgba(255 ,255 ,255 , 0.87)',
  },
  cardTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingTop: 16,
  },
  cardTitleTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  titleText: {
    fontSize: 24,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(0 ,0 ,0 , 0.38)',
  },
  titleSpacing: {
    marginBottom: 12,
  },
  avatarTitleText: {
    fontSize: 14,
  },
  avatarStyle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 16,
    paddingLeft: 16,
    paddingBottom: 16,
  },
  cardContentTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  contentText: {
    fontSize: 14,
    color: 'rgba(0 ,0 ,0 , 0.54)',
  },
  contentAvatar: {
    borderRadius: 150,
  },
});

export default Card;
