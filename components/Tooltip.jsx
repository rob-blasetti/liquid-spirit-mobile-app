import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

const POINTER_SIZE = 12;
const SCREEN_MARGIN = 12;

const Tooltip = ({
  children,
  popover,
  withOverlay = true,
  overlayColor = 'rgba(0,0,0,0.15)',
  backgroundColor = 'rgba(33, 33, 33, 0.95)',
  pointerColor,
  placement = 'bottom',
  width,
  height,
  containerStyle,
  tooltipStyle,
  offset,
  skipAndroidStatusBar = false, // retained for API compatibility
}) => {
  const triggerRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [contentSize, setContentSize] = useState(null);
  const [bubblePos, setBubblePos] = useState(null);

  const resolvedPointerColor = pointerColor || backgroundColor;

  const measureAnchor = useCallback(() => {
    if (!triggerRef.current || typeof triggerRef.current.measureInWindow !== 'function') {
      return;
    }
    triggerRef.current.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y: skipAndroidStatusBar ? y : y, w, h });
      setVisible(true);
    });
  }, [skipAndroidStatusBar]);

  const close = useCallback(() => {
    setVisible(false);
    setBubblePos(null);
  }, []);

  const handleContentLayout = useCallback(event => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setContentSize({ width: w, height: h });
  }, []);

  const placementOffset = useMemo(() => {
    if (!offset) return 0;
    if (placement === 'top') return offset.bottom || offset.top || 0;
    if (placement === 'bottom') return offset.top || offset.bottom || 0;
    if (placement === 'left') return offset.right || offset.left || 0;
    if (placement === 'right') return offset.left || offset.right || 0;
    return 0;
  }, [offset, placement]);

  useEffect(() => {
    if (!visible || !anchor || !contentSize) return;

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const anchorCenterX = anchor.x + anchor.w / 2;
    const anchorCenterY = anchor.y + anchor.h / 2;
    const contentWidth = width || contentSize.width;
    const contentHeight = height || contentSize.height;
    const gap = placementOffset + POINTER_SIZE / 2;

    let top = anchor.y;
    let left = anchor.x;
    let pointerTop = anchorCenterY - POINTER_SIZE / 2;
    let pointerLeft = anchorCenterX - POINTER_SIZE / 2;

    switch (placement) {
      case 'top':
        top = anchor.y - contentHeight - gap;
        left = anchorCenterX - contentWidth / 2;
        pointerTop = top + contentHeight - POINTER_SIZE / 2;
        pointerLeft = anchorCenterX - POINTER_SIZE / 2;
        break;
      case 'left':
        top = anchorCenterY - contentHeight / 2;
        left = anchor.x - contentWidth - gap;
        pointerTop = anchorCenterY - POINTER_SIZE / 2;
        pointerLeft = left + contentWidth - POINTER_SIZE / 2;
        break;
      case 'right':
        top = anchorCenterY - contentHeight / 2;
        left = anchor.x + anchor.w + gap;
        pointerTop = anchorCenterY - POINTER_SIZE / 2;
        pointerLeft = left - POINTER_SIZE / 2;
        break;
      case 'bottom':
      default:
        top = anchor.y + anchor.h + gap;
        left = anchorCenterX - contentWidth / 2;
        pointerTop = top - POINTER_SIZE / 2;
        pointerLeft = anchorCenterX - POINTER_SIZE / 2;
        break;
    }

    // Clamp bubble within screen bounds and shift pointer accordingly
    const maxLeft = screenWidth - contentWidth - SCREEN_MARGIN;
    const maxTop = screenHeight - contentHeight - SCREEN_MARGIN;
    const clampedLeft = Math.max(SCREEN_MARGIN, Math.min(left, maxLeft));
    const clampedTop = Math.max(SCREEN_MARGIN, Math.min(top, maxTop));
    pointerLeft += clampedLeft - left;
    pointerTop += clampedTop - top;
    left = clampedLeft;
    top = clampedTop;

    setBubblePos({
      top,
      left,
      pointerTop,
      pointerLeft,
      contentWidth,
      contentHeight,
    });
  }, [visible, anchor, contentSize, placement, placementOffset, width, height]);

  const bubbleStyles = useMemo(() => {
    const base = [
      styles.tooltip,
      { backgroundColor, width, height },
      tooltipStyle,
    ];
    return base;
  }, [backgroundColor, height, tooltipStyle, width]);

  const pointerStyle = useMemo(
    () => [
      styles.pointer,
      { backgroundColor: resolvedPointerColor },
      placement === 'top' && styles.pointerDown,
      placement === 'bottom' && styles.pointerUp,
      placement === 'left' && styles.pointerRight,
      placement === 'right' && styles.pointerLeft,
    ],
    [placement, resolvedPointerColor],
  );

  return (
    <>
      <TouchableWithoutFeedback onPress={measureAnchor}>
        <View collapsable={false} ref={triggerRef}>
          {children}
        </View>
      </TouchableWithoutFeedback>

      {visible && (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
          <TouchableWithoutFeedback onPress={close}>
            <View style={[styles.overlay, withOverlay ? { backgroundColor: overlayColor } : null]} />
          </TouchableWithoutFeedback>

          {bubblePos ? (
            <>
              <View
                style={[
                  styles.bubbleContainer,
                  { top: bubblePos.top, left: bubblePos.left },
                  containerStyle,
                ]}
                onLayout={handleContentLayout}
              >
                <View style={bubbleStyles}>
                  {popover}
                </View>
              </View>
              <View
                pointerEvents="none"
                style={[
                  pointerStyle,
                  {
                    top: bubblePos.pointerTop,
                    left: bubblePos.pointerLeft,
                  },
                ]}
              />
            </>
          ) : (
            <View style={styles.measurePlaceholder} onLayout={handleContentLayout}>
              <View style={bubbleStyles}>{popover}</View>
            </View>
          )}
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bubbleContainer: {
    position: 'absolute',
  },
  tooltip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    maxWidth: Dimensions.get('window').width - SCREEN_MARGIN * 2,
  },
  pointer: {
    position: 'absolute',
    width: POINTER_SIZE,
    height: POINTER_SIZE,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  pointerUp: {
    // default rotation works for pointing up from anchor to bubble
  },
  pointerDown: {
    top: undefined,
  },
  pointerLeft: {
    // rotation already covers orientation; placement handled via positioning
  },
  pointerRight: {},
  measurePlaceholder: {
    position: 'absolute',
    opacity: 0,
  },
});

export default Tooltip;
