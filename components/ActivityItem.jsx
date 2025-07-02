import React from 'react';
import { API_URL } from '../config';
import localImages from '../utils/localImages';
import ListItem from './ListItem';

const ActivityItem = ({ item, onPress }) => {
  let imageSource;
  const uri = item.imageUrl;
  if (uri) {
    if (localImages[uri]) {
      imageSource = localImages[uri];
    } else if (!uri.startsWith('http')) {
      imageSource = { uri: `${API_URL}/${uri}` };
    } else {
      imageSource = { uri };
    }
  }
  const date = item.date || item.createdAt;
  const formatted = date ? new Date(date).toLocaleDateString() : 'N/A';

  return (
    <ListItem
      imageSource={imageSource}
      title={item.title || item.name}
      content={item.description}
      date={formatted}
      onPress={onPress}
    />
  );
};

export default ActivityItem;
