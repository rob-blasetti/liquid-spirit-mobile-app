import React from 'react';
import { Card } from 'react-native-material-cards';
import FastImage from 'react-native-fast-image';

const CardContainer = ({ imageUrl, cardStyle, bannerStyle, resizeMode = FastImage.resizeMode.cover, children }) => (
  <Card style={cardStyle}>
    {imageUrl ? (
      <FastImage
        source={imageUrl}
        style={bannerStyle}
        resizeMode={resizeMode}
      />
    ) : null}
    {children}
  </Card>
);

export default CardContainer;
