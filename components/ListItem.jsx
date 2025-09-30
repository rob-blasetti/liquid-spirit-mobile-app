import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import themeVariables from '../styles/theme';

const ListItem = ({ imageSource, leadingComponent, title, content, date, time, onPress, commentCount, countLabel = 'Comments', chipText }) => {
  const hasLeading = Boolean(imageSource) || Boolean(leadingComponent);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {hasLeading && (
        <View style={styles.imageContainer}>
          {leadingComponent ? (
            <View style={styles.customImageWrapper}>
              {leadingComponent}
            </View>
          ) : (
            <FastImage source={imageSource} style={styles.image} />
          )}
          {chipText && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{chipText}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.mainContainer}>
        <View style={styles.textContainer}>
          {title && (
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          )}
          {content && (
            <Text style={styles.content} numberOfLines={2}>
              {content}
            </Text>
          )}
        </View>
        <View style={styles.footerContainer}>
          {commentCount !== undefined && (
            <Text style={styles.commentCount}>
              {countLabel}: {commentCount}
            </Text>
          )}
          {date && (
            <Text style={styles.date}>
              {time ? `${time} • ${date}` : date}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    // remove horizontal margin to center chip under imageContainer
  },
  imageContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    marginTop: 4,
    backgroundColor: themeVariables.primaryColor,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    color: themeVariables.whiteColor,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: themeVariables.primaryColor,
  },
  content: {
    fontSize: 14,
    color: themeVariables.blackColor,
    marginTop: 4,
  },
  date: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#555',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    fontSize: 12,
    color: '#555',
    marginRight: 8,
  },
  customImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ListItem;
