import React, { useRef, useEffect, useState } from 'react';
import { View, FlatList, Dimensions, StyleSheet, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import Lightbox from 'react-native-lightbox';

const { width } = Dimensions.get('window');

/**
 * A highly-performant carousel component using FlatList and snappointing
 * @param {Array<{ uri: string }>} data - Array of items with an image URI
 * @param {number} [itemWidth] - Width of each item (defaults to 80% of screen width)
 * @param {number} [separatorWidth] - Space between items (defaults to 5% of screen width)
 */
const Carousel = ({ data, itemWidth = width * 0.8, separatorWidth = width * 0.05, itemHeight = 200 }) => {
  // Preload images to improve lightbox opening performance
  useEffect(() => {
    if (Array.isArray(data) && data.length) {
      FastImage.preload(data.map(item => ({ uri: item.uri })));
    }
  }, [data]);
  const flatListRef = useRef(null);
  const snapToInterval = itemWidth + separatorWidth;
  const originalDataCount = data.length;
  // Prepare cyclic data: prepend last and append first for infinite swipe
  const carouselData = originalDataCount > 1
    ? [data[originalDataCount - 1], ...data, data[0]]
    : data;
  // Randomize initial position (1..N) for cyclic carousel
  const [initialIndex] = useState(() => (
    originalDataCount > 1
      ? Math.floor(Math.random() * originalDataCount) + 1
      : 1
  ));
  // Track active slide index (1-based)
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const renderItem = React.useCallback(
    ({ item }) => (
      <View style={{ width: itemWidth, marginRight: separatorWidth, height: itemHeight }}>
        <Lightbox
          underlayColor="transparent"
          springConfig={{ tension: 30, friction: 20 }}
          activeProps={{
            style: styles.fullscreenImage,
            resizeMode: FastImage.resizeMode.contain,
          }}
        >
          <FastImage
            style={styles.image}
            source={{
              uri: item.uri,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        </Lightbox>
      </View>
    ),
    [itemWidth, separatorWidth, itemHeight]
  );

  // On mount, scroll to the first real item if cyclic
  useEffect(() => {
    if (flatListRef.current && originalDataCount > 1) {
      flatListRef.current.scrollToOffset({ offset: initialIndex * snapToInterval, animated: false });
    }
  }, [initialIndex, snapToInterval, originalDataCount]);
  // Handle wrap-around and index tracking on scroll end
  const handleScrollEnd = React.useCallback(({ nativeEvent }) => {
    if (originalDataCount <= 1) return;
    const offsetX = nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapToInterval);
    if (index === 0) {
      // before first: wrap to last
      flatListRef.current.scrollToOffset({ offset: originalDataCount * snapToInterval, animated: false });
      setActiveIndex(originalDataCount);
    } else if (index === originalDataCount + 1) {
      // past last: wrap to first
      flatListRef.current.scrollToOffset({ offset: snapToInterval, animated: false });
      setActiveIndex(1);
    } else {
      // normal
      setActiveIndex(index);
    }
  }, [snapToInterval, originalDataCount, setActiveIndex]);
  return (
    <View style={{ height: itemHeight, position: 'relative' }}>
      <FlatList
        style={{ flex: 1 }}
        ref={flatListRef}
        data={carouselData}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapToInterval}
        snapToAlignment="start"
        contentContainerStyle={{ paddingHorizontal: (width - itemWidth) / 2 }}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => (
          { length: snapToInterval, offset: snapToInterval * index, index }
        )}
        initialNumToRender={Math.min(carouselData.length, 5)}
        windowSize={3}
      />
      {/* Counter x/y */}
      <View style={styles.counterContainer} pointerEvents="none">
        <Text style={styles.counterText}>{`${activeIndex}/${originalDataCount}`}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    resizeMode: 'cover',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  counterContainer: {
    position: 'absolute',
    bottom: 5,
    right: 20,
    width: 32,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default React.memo(Carousel);
