import React from 'react';
import { View } from 'react-native';
import ImageBanner, { IMAGE_BANNER_HEIGHT } from '../../../components/ImageBanner';

const CardContainer = ({
  imageUrl,
  cardStyle,
  bannerStyle,
  bannerHeight = IMAGE_BANNER_HEIGHT,
  bannerOverlayColor = null,
  renderBanner,
  topInset = 0,
  children,
}) => {
  const arrayChildren = React.Children.toArray(children);

  const sanitizedChildren = [];
  const debugInvalids = [];

  if (__DEV__) {
    console.log('[CardContainer] received children', arrayChildren.length);
  }

  arrayChildren.forEach((child, idx) => {
    const isValid = child && React.isValidElement(child);
    const type = child?.type;
    const typeName =
      typeof type === 'string' ? type : type?.displayName || type?.name;
    if (isValid && typeName) {
      sanitizedChildren.push(child);
    } else if (__DEV__) {
      debugInvalids.push({
        idx,
        isValid,
        hasType: !!type,
        typeName: typeName || null,
        rawType: type,
        isNullish: child == null,
      });
    }
  });

  if (__DEV__ && debugInvalids.length) {
    console.log('[CardContainer] filtered invalid children', { debugInvalids, total: arrayChildren.length });
  }

  if (!children || sanitizedChildren.length === 0) {
    return null;
  }

  return (
    <View style={[{ overflow: 'hidden' }, cardStyle]}>
      {(imageUrl || renderBanner) ? (
        <ImageBanner
          imageSource={renderBanner ? null : imageUrl}
          renderContent={renderBanner}
          height={bannerHeight}
          topInset={topInset}
          overlayColor={bannerOverlayColor}
          containerStyle={bannerStyle}
        />
      ) : null}
      {sanitizedChildren}
    </View>
  );
};

export default CardContainer;
