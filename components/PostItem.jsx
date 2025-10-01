import React, { useState, useEffect } from 'react';
import ListItem from './ListItem';
import { Image } from 'react-native';
import resolveImageSource from '../utils/imageSource';
import { cachePostImageAspect, getPostImageAspect } from '../utils/navigateToPostDetail';

const PostItem = ({ item, onPress }) => {
  const imageSource = resolveImageSource(item.media?.[0], {
    priority: 'normal',
    fallback: '/img/events/Event_Placeholder.png',
  });
  const remoteUri = typeof imageSource === 'object' ? imageSource.uri : null;
  const date = item.createdAt || item.updatedAt;
  const formatted = date ? new Date(date).toLocaleDateString() : 'N/A';

  // Track image aspect ratio for detail screen
  const [imageAspect, setImageAspect] = useState(() => getPostImageAspect(item._id, remoteUri));
  useEffect(() => {
    if (imageSource) {
      // Local image (require) as number
      if (typeof imageSource === 'number') {
        const { width, height } = Image.resolveAssetSource(imageSource);
        if (width && height) {
          const ratio = width / height;
          setImageAspect(ratio);
          cachePostImageAspect(item._id, remoteUri, ratio);
        }
      }
      // Remote URI
      else if (imageSource.uri) {
        Image.getSize(
          imageSource.uri,
          (w, h) => {
            const ratio = w / h;
            setImageAspect(ratio);
            cachePostImageAspect(item._id, remoteUri, ratio);
          },
          () => {}
        );
      }
    }
  }, [imageSource, item._id, remoteUri]);

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
