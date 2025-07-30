import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import localImages from '../utils/localImages';
import ListItem from './ListItem';
import { Image } from 'react-native';

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

  // Track image aspect ratio for detail screen
  const [imageAspect, setImageAspect] = useState(null);
  useEffect(() => {
    if (imageSource) {
      // Local image (require) as number
      if (typeof imageSource === 'number') {
        const { width, height } = Image.resolveAssetSource(imageSource);
        if (width && height) setImageAspect(width / height);
      }
      // Remote URI
      else if (imageSource.uri) {
        Image.getSize(
          imageSource.uri,
          (w, h) => setImageAspect(w / h),
          () => {}
        );
      }
    }
  }, [imageSource]);

  return (
    <ListItem
      imageSource={imageSource}
      title={item.title}
      content={item.content}
      date={formatted}
      commentCount={item.comments?.length}
      onPress={() => onPress(imageAspect)}
    />
  );
};

export default PostItem;
