import React from 'react';
import { View } from 'react-native';
import ImageBanner, { IMAGE_BANNER_HEIGHT } from '../../../components/ImageBanner';

const CardContainer = ({
  imageUrl,
  cardStyle,
  bannerStyle,
  bannerHeight = IMAGE_BANNER_HEIGHT,
  bannerOverlayColor = null,
  bannerDefaultImageSource = null,
  renderBanner,
  topInset = 0,
  children,
}) => {
  const arrayChildren = React.Children.toArray(children);

  const sanitizedChildren = [];
  arrayChildren.forEach((child) => {
    const isValid = child && React.isValidElement(child);
    const type = child?.type;
    const typeName =
      typeof type === 'string' ? type : type?.displayName || type?.name;
    if (isValid && typeName) {
      sanitizedChildren.push(child);
    }
  });

  if (!children || sanitizedChildren.length === 0) {
    return null;
  }

  return (
    <View style={[{ overflow: 'hidden' }, cardStyle]}>
      {(imageUrl || renderBanner) ? (
        <ImageBanner
          imageSource={renderBanner ? null : imageUrl}
          defaultImageSource={bannerDefaultImageSource}
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
