import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import DetailSection from '../../common/DetailSection';
import LiquidGlassIconButton from '../../../../components/LiquidGlassIconButton';
import themeVariables from '../../../../styles/theme';
import { getMarkerCoordinate, normalizeMapRegion } from '../../common/mapRegion';
import StaticMapPreview from '../../common/StaticMapPreview';
import debugLog from '../../../../utils/debugLog';
import { HAS_NATIVE_GOOGLE_MAPS } from '../../../../config';

const HostLocationSection = ({
  region,
  fullAddress,
  venueName,
  addressText,
  styles,
  onOpenMaps,
  onExpandMap,
}) => {
  const normalizedRegion = normalizeMapRegion(region);
  const markerCoordinate = getMarkerCoordinate(region);
  const canUseNativeMap = Platform.OS !== 'android' || HAS_NATIVE_GOOGLE_MAPS;
  const showLiveMap = normalizedRegion && markerCoordinate && canUseNativeMap;
  const showStaticMap = normalizedRegion && markerCoordinate && !canUseNativeMap;
  const provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
  const canExpandMap = Boolean(normalizedRegion && markerCoordinate);
  const hasDisplayContent = Boolean(venueName || addressText || fullAddress);

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
    <DetailSection
      title="Where is it?"
      showTooltip={false}
      titleStyle={styles.mapTitle}>
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
        {canExpandMap ? (
          <LiquidGlassIconButton
            iconName="expand-outline"
            iconColor={themeVariables.blackColor}
            onPress={onExpandMap}
            accessibilityLabel="Expand map"
            forceFallback
            glassStyle={{
              backgroundColor: 'rgba(236,237,242,0.96)',
              borderColor: 'rgba(0,0,0,0.08)',
              borderWidth: 1,
            }}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 5,
            }}
          />
        ) : null}
      </View>
      {hasDisplayContent ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => fullAddress && onOpenMaps?.()}
          style={styles.hostAddressContainer}
        >
          {venueName ? (
            <Text style={styles.hostAddressTitle}>{venueName}</Text>
          ) : null}
          {addressText ? (
            <Text style={styles.hostAddressSubtitle}>{addressText}</Text>
          ) : !venueName && fullAddress ? (
            <Text style={styles.hostAddressSubtitle}>{fullAddress}</Text>
          ) : null}
        </TouchableOpacity>
      ) : (
        <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
          Address unavailable
        </Text>
      )}
    </DetailSection>
  );
};

export default HostLocationSection;
