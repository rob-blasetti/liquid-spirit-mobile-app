import React from 'react';
import { API_URL } from '../config';
import localImages from '../utils/localImages';
import ListItem from './ListItem';

const EventItem = ({ item, onPress }) => {
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
  const rawDate = item.date || item.startTime;
  const formatted = rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A';

  return (
    <ListItem
      imageSource={imageSource}
      title={item.title || item.name}
      content={item.description || item.venue}
      date={formatted}
      onPress={onPress}
    />
  );
};

export default EventItem;
