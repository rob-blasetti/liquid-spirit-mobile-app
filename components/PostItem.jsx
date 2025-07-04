import React from 'react';
import { API_URL } from '../config';
import localImages from '../utils/localImages';
import ListItem from './ListItem';

const PostItem = ({ item, onPress }) => {
  let imageSource;
  const uri = item.media?.[0];
  if (uri) {
    if (localImages[uri]) {
      imageSource = localImages[uri];
    } else if (!uri.startsWith('http')) {
      imageSource = { uri: `${API_URL}/${uri}` };
    } else {
      imageSource = { uri };
    }
  }
  const date = item.createdAt || item.updatedAt;
  const formatted = date ? new Date(date).toLocaleDateString() : 'N/A';

  return (
    <ListItem
      imageSource={imageSource}
      title={item.title}
      content={item.content}
      date={formatted}
      commentCount={item.comments?.length}
      onPress={onPress}
    />
  );
};

export default PostItem;
