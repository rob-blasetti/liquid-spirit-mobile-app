import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Image as RNImage, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import resolveImageSource from '../utils/imageSource';

const ZoomableImage = ({ uri, style, onRequestClose }) => {
  if (__DEV__) {
    console.log('[ZoomableImage] mount', {
      prefix: uri ? uri.slice(0, 64) : null,
      suffix: uri ? uri.slice(-32) : null,
      length: uri ? uri.length : 0,
    });
  }
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!loaded) {
        if (__DEV__) console.warn('[ZoomableImage] timeout waiting for load; using fallback');
        setUseFallback(true);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [loaded]);
  // Scale values
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const dismissScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(Animated.multiply(baseScale, pinchScale), dismissScale);
  const lastScaleRef = useRef(1);
  const pinchScaleRef = useRef(1);

  useEffect(() => {
    const id = pinchScale.addListener(({ value }) => {
      pinchScaleRef.current = value || 1;
    });
    return () => pinchScale.removeListener(id);
  }, [pinchScale]);

  const onPinchEvent = Animated.event([{ nativeEvent: { scale: pinchScale } }], { useNativeDriver: true });
  const onPinchStateChange = ({ nativeEvent }) => {
    if (__DEV__) {
      console.log('[ZoomableImage] pinch state', nativeEvent.state, 'scale', pinchScaleRef.current);
    }
    if (nativeEvent.oldState === State.ACTIVE || nativeEvent.state === State.END) {
      const next = Math.max(1, Math.min(lastScaleRef.current * (pinchScaleRef.current || 1), 4));
      lastScaleRef.current = next;
      baseScale.setValue(next);
      pinchScale.setValue(1);
      if (__DEV__) {
        console.log('[ZoomableImage] pinch end -> baseScale', next);
      }
    }
  };

  // Pan values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = ({ nativeEvent }) => {
    if (__DEV__) {
      console.log('[ZoomableImage] pan state', nativeEvent.state, 'trans', nativeEvent.translationX, nativeEvent.translationY);
    }
    if (nativeEvent.state === State.BEGAN) {
      const approxScale = lastScaleRef.current * (pinchScaleRef.current || 1);
      const notZoomed = approxScale <= 1.02;
      if (notZoomed) {
        Animated.parallel([
          Animated.timing(dismissScale, { toValue: 0.98, duration: 100, useNativeDriver: true }),
        ]).start();
      }
    }
    if (nativeEvent.oldState === State.ACTIVE || nativeEvent.state === State.END) {
      lastOffset.current.x += nativeEvent.translationX;
      lastOffset.current.y += nativeEvent.translationY;
      translateX.setOffset(lastOffset.current.x);
      translateX.setValue(0);
      translateY.setOffset(lastOffset.current.y);
      translateY.setValue(0);

      // Swipe-to-close when not zoomed: large vertical fling or drag
      const approxScale = lastScaleRef.current * (pinchScaleRef.current || 1);
      const notZoomed = approxScale <= 1.02;
      const dragX = nativeEvent.translationX || 0;
      const dragY = nativeEvent.translationY || 0;
      const vX = nativeEvent.velocityX || 0;
      const vY = nativeEvent.velocityY || 0;
      const thresholdDrag = 120; // px in any direction
      const thresholdVel = 1000; // px/s magnitude
      const dragExceeded = Math.max(Math.abs(dragX), Math.abs(dragY)) > thresholdDrag;
      const velExceeded = Math.hypot(vX, vY) > thresholdVel;
      if (notZoomed && (dragExceeded || velExceeded)) {
        if (__DEV__) console.log('[ZoomableImage] swipe-to-close', { dragY, vY, approxScale });
        if (typeof onRequestClose === 'function') {
          onRequestClose();
        }
      } else {
        // Restore scale if we didn't close
        Animated.timing(dismissScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      }
    }
    if (nativeEvent.state === State.BEGAN) {
      translateX.setOffset(lastOffset.current.x);
      translateY.setOffset(lastOffset.current.y);
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  const { width: winW, height: winH } = Dimensions.get('window');

  return (
    <View
      style={[
        styles.container,
        { position: 'absolute', top: 0, left: 0, width: winW, height: winH },
        style,
      ]}
      onLayout={e => {
        if (__DEV__) {
          const { width, height } = e.nativeEvent.layout || {};
          console.log('[ZoomableImage] layout', { width, height });
        }
      }}
    >
      <PanGestureHandler onGestureEvent={onPanEvent} onHandlerStateChange={onPanStateChange} enabled>
        <Animated.View style={{ width: winW, height: winH }}>
          <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
            <Animated.View
              style={{
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                ],
                width: winW,
                height: winH,
              }}
            >
              <FastImage
                source={resolveImageSource(uri, { priority: 'normal' })}
                style={[styles.image, { width: winW, height: winH }]}
                resizeMode={FastImage.resizeMode.contain}
                onLoadStart={() => __DEV__ && console.log('[ZoomableImage] onLoadStart')}
                onLoad={() => { setLoaded(true); __DEV__ && console.log('[ZoomableImage] onLoad'); }}
                onError={e => { __DEV__ && console.log('[ZoomableImage] onError', e?.nativeEvent); setUseFallback(true); }}
              />
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
      {useFallback && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'black' }]}>
          <RNImage
            source={{ uri }}
            style={[styles.image, { width: winW, height: winH }]}
            resizeMode="contain"
            onLoad={() => { setLoaded(true); __DEV__ && console.log('[ZoomableImage] fallback RNImage onLoad'); }}
            onError={e => __DEV__ && console.log('[ZoomableImage] fallback RNImage onError', e?.nativeEvent)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' },
  image: { },
});

export default ZoomableImage;
