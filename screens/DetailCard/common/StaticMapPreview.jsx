import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import themeVariables from '../../../styles/theme';
import { getMarkerCoordinate } from './mapRegion';
import { buildStaticMapUrl } from './staticMap';

const StaticMapPreview = ({
  region,
  styles,
  fallbackTitle = 'Map preview unavailable',
  fallbackSubtitle = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const markerCoordinate = getMarkerCoordinate(region);
  const mapUri = useMemo(() => {
    if (!markerCoordinate) return '';
    return buildStaticMapUrl(markerCoordinate);
  }, [markerCoordinate]);

  if (!mapUri || failed) {
    return (
      <View style={[styles.mapLoader, styles.mapFallback]}>
        <Text style={styles.mapFallbackText}>{fallbackTitle}</Text>
        {fallbackSubtitle ? (
          <Text style={styles.mapFallbackSubtext}>{fallbackSubtitle}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.map}>
      <Image
        source={{ uri: mapUri }}
        style={styles.map}
        resizeMode="cover"
        onLoadStart={() => {
          setFailed(false);
          setLoading(true);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
      {loading ? (
        <View
          pointerEvents="none"
          style={[
            styles.mapLoader,
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(255,255,255,0.35)',
            },
          ]}
        >
          <ActivityIndicator size="small" color={themeVariables.primaryColor} />
        </View>
      ) : null}
    </View>
  );
};

export default StaticMapPreview;
