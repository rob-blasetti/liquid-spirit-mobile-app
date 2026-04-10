import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../styles/theme';

const BaseModal = ({
  visible,
  onClose,
  title,
  headerContent,
  children,
  sheetStyle,
  bodyStyle,
  contentContainerStyle,
}) => {
  const [isRendered, setIsRendered] = useState(visible);
  const animationProgress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      return;
    }

    if (!isRendered) return;

    animationProgress.stopAnimation();
    Animated.timing(animationProgress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setIsRendered(false);
      }
    });
  }, [animationProgress, isRendered, visible]);

  useEffect(() => {
    if (!visible || !isRendered) return;

    animationProgress.stopAnimation();
    Animated.timing(animationProgress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [animationProgress, isRendered, visible]);

  if (!isRendered) {
    return null;
  }

  const sheetTranslateY = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [320, 0],
  });

  return (
    <Modal animationType="none" transparent visible={isRendered} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[
              styles.backdropTapArea,
              {opacity: animationProgress},
            ]}
          />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {transform: [{translateY: sheetTranslateY}]},
          ]}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
              style={styles.closeButton}>
              <Ionicons
                name="close"
                size={22}
                color="#111"
              />
            </TouchableOpacity>
          </View>
          {headerContent ? (
            <View style={styles.headerContent}>
              {headerContent}
            </View>
          ) : null}
          <ScrollView
            style={[styles.body, bodyStyle]}
            contentContainerStyle={contentContainerStyle}
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTapArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: themeVariables.whiteColor,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: '80%',
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginRight: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    minHeight: 0,
    flexShrink: 1,
  },
});

export default BaseModal;
