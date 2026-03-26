import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import SectionTitle from '../../common/SectionTitle';
import themeVariables from '../../../../styles/theme';
import { getMarkerCoordinate, normalizeMapRegion } from '../../common/mapRegion';
import StaticMapPreview from '../../common/StaticMapPreview';
import debugLog from '../../../../utils/debugLog';
import { HAS_NATIVE_GOOGLE_MAPS } from '../../../../config';

const HostLocationSection = ({ region, fullAddress, styles, onOpenMaps }) => {
  const normalizedRegion = normalizeMapRegion(region);
  const markerCoordinate = getMarkerCoordinate(region);
  const canUseNativeMap = Platform.OS !== 'android' || HAS_NATIVE_GOOGLE_MAPS;
  const showLiveMap = normalizedRegion && markerCoordinate && canUseNativeMap;
  const showStaticMap = normalizedRegion && markerCoordinate && !canUseNativeMap;
  const provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  useEffect(() => {
    debugLog('[EventDetailMap] render state', {
      fullAddress,
      region,
      normalizedRegion,
      markerCoordinate,
      showLiveMap: Boolean(showLiveMap),
      provider,
      canUseNativeMap,
      showStaticMap: Boolean(showStaticMap),
    });
  }, [canUseNativeMap, fullAddress, markerCoordinate, normalizedRegion, provider, region, showLiveMap, showStaticMap]);

  useEffect(() => {
    if (!showLiveMap) return undefined;

    debugLog('[EventDetailMap] mounting MapView', {
      provider,
      normalizedRegion,
      markerCoordinate,
    });

    return () => {
      debugLog('[EventDetailMap] unmounting MapView', {
        provider,
      });
    };
  }, [markerCoordinate, normalizedRegion, provider, showLiveMap]);

  return (
    <>
      <SectionTitle title="Where is it?" showTooltip={false} titleStyle={styles.mapTitle} />
      <View style={styles.mapWrapper}>
        {showLiveMap ? (
          <MapView
            provider={provider}
            style={styles.map}
            initialRegion={normalizedRegion}
            onMapReady={() => {
              debugLog('[EventDetailMap] onMapReady', {
                provider,
                normalizedRegion,
                markerCoordinate,
              });
            }}
            onLayout={(event) => {
              debugLog('[EventDetailMap] onLayout', {
                layout: event?.nativeEvent?.layout,
              });
            }}
          >
            <Marker coordinate={markerCoordinate} />
          </MapView>
        ) : showStaticMap ? (
          <StaticMapPreview
            region={normalizedRegion}
            styles={styles}
            fallbackSubtitle={fullAddress ? 'Tap the address to open in Maps' : ''}
          />
        ) : (
          <View style={[styles.mapLoader, styles.mapFallback]}>
            <ActivityIndicator size="small" color={themeVariables.primaryColor} />
            <Text style={styles.mapFallbackText}>Map preview unavailable</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => fullAddress && onOpenMaps?.()}
        style={{ alignSelf: 'flex-start' }}
      >
        <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
          {fullAddress}
        </Text>
      </TouchableOpacity>
      <View style={styles.divider} />
    </>
  );
};

export default HostLocationSection;
