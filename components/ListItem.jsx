import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import themeVariables from '../styles/theme';

const ListItem = ({ imageSource, title, content, date, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {imageSource && (
        <FastImage source={imageSource} style={styles.image} />
      )}
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
      {date && <Text style={styles.date}>{date}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 12,
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
    color: '#312783',
    marginTop: 4,
  },
  date: {
    marginLeft: 8,
    fontSize: 12,
    color: '#555',
  },
});

export default ListItem;
