import React, { useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * A ScrollView that dismisses the current screen when the user swipes down past a threshold.
 * Props:
 * - threshold: number of pixels the user must pull down beyond 0 offset to trigger goBack (default 0).
 * All other ScrollView props are supported.
 */
const SwipeToCloseScrollView = ({ threshold = 0, onScrollEndDrag, children, ...props }) => {
  const navigation = useNavigation();
  const timeoutRef = useRef(null);
  // Cleanup pending timeout on unmount
  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleScrollEndDrag = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y < -threshold) {
      navigation.goBack();
    }
    if (typeof onScrollEndDrag === 'function') {
      onScrollEndDrag(e);
    }
  };

  return (
    <ScrollView
      {...props}
      onScrollEndDrag={handleScrollEndDrag}
    >
      {children}
    </ScrollView>
  );
};

export default SwipeToCloseScrollView;
