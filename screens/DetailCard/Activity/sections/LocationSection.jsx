import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import DetailSection from '../../common/DetailSection';
import themeVariables from '../../../../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LiquidGlassIconButton from '../../../../components/LiquidGlassIconButton';
import { getMarkerCoordinate, normalizeMapRegion } from '../../common/mapRegion';
import StaticMapPreview from '../../common/StaticMapPreview';
import debugLog from '../../../../utils/debugLog';
import { HAS_NATIVE_GOOGLE_MAPS } from '../../../../config';

const LocationSection = ({
  showMapSection,
  showOnlineSection,
  isHybridSession,
  mapDisplayName,
  mapDisplayAddress,
  mapAddress,
  region,
  hasRegion,
  openGoogleMaps,
  onExpandMap,
  resolvedOnlineLink,
  styles,
}) => {
  const normalizedRegion = normalizeMapRegion(region);
  const markerCoordinate = getMarkerCoordinate(region);
  const canUseNativeMap = Platform.OS !== 'android' || HAS_NATIVE_GOOGLE_MAPS;
  const showLiveMap = hasRegion && normalizedRegion && markerCoordinate && canUseNativeMap;
  const showStaticMap = hasRegion && normalizedRegion && markerCoordinate && !canUseNativeMap;
  const provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;
  const canExpandMap = Boolean(normalizedRegion && markerCoordinate);

  useEffect(() => {
    debugLog('[ActivityDetailMap] render state', {
      showMapSection,
      showOnlineSection,
      isHybridSession,
      hasRegion,
      showLiveMap: Boolean(showLiveMap),
      mapAddress,
      mapDisplayName,
      mapDisplayAddress,
      region,
      normalizedRegion,
      markerCoordinate,
      provider,
      canUseNativeMap,
      showStaticMap,
    });
  }, [
    canUseNativeMap,
    hasRegion,
    isHybridSession,
    mapAddress,
    mapDisplayAddress,
    mapDisplayName,
    markerCoordinate,
    normalizedRegion,
    provider,
    region,
    showLiveMap,
    showStaticMap,
    showMapSection,
    showOnlineSection,
  ]);

  useEffect(() => {
    if (!showLiveMap) return undefined;

    debugLog('[ActivityDetailMap] mounting MapView', {
      provider,
      normalizedRegion,
      markerCoordinate,
    });

    return () => {
      debugLog('[ActivityDetailMap] unmounting MapView', {
        provider,
      });
    };
  }, [markerCoordinate, normalizedRegion, provider, showLiveMap]);

  return (
    <>
      {showMapSection && (
        <DetailSection
          title="Host Address"
          note="Address reflects the next upcoming session."
          titleStyle={styles.mapTitle}>
          <View style={styles.mapWrapper}>
            {showLiveMap ? (
              <MapView
                provider={provider}
                style={styles.map}
                initialRegion={normalizedRegion}
                onMapReady={() => {
                  debugLog('[ActivityDetailMap] onMapReady', {
                    provider,
                    normalizedRegion,
                    markerCoordinate,
                  });
                }}
                onLayout={(event) => {
                  debugLog('[ActivityDetailMap] onLayout', {
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
                fallbackSubtitle={mapAddress ? 'Tap the address to open in Maps' : ''}
              />
            ) : (
              <View style={[styles.mapLoader, styles.mapFallback]}>
                <Ionicons
                  name="map-outline"
                  size={28}
                  color={themeVariables.primaryColor}
                  style={{ marginBottom: 6 }}
                />
                <Text style={styles.mapFallbackText}>Map preview unavailable</Text>
                {mapAddress ? (
                  <Text style={styles.mapFallbackSubtext}>Tap the address to open in Maps</Text>
                ) : null}
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
          {mapDisplayName || mapDisplayAddress ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => mapAddress && openGoogleMaps(mapAddress)}
              style={styles.hostAddressContainer}
            >
              {mapDisplayName ? (
                <Text style={styles.hostAddressTitle}>{mapDisplayName}</Text>
              ) : null}
              {mapDisplayAddress ? (
                <Text style={styles.hostAddressSubtitle}>{mapDisplayAddress}</Text>
              ) : null}
            </TouchableOpacity>
          ) : (
            <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
              Address unavailable
            </Text>
          )}
        </DetailSection>
      )}

      {showOnlineSection && (
        <DetailSection
          title="Join Online"
          note="This session is available in person and online."
          showTooltip={isHybridSession}
          titleStyle={styles.mapTitle}>
          <View style={styles.onlineRow}>
            <Ionicons
              name="videocam-outline"
              size={20}
              color={themeVariables.primaryColor}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.headerInfoText,
                { color: themeVariables.primaryColor, textDecorationLine: 'underline' },
              ]}
              onPress={() => resolvedOnlineLink && Linking.openURL(resolvedOnlineLink)}
            >
              Tap to join the online session
            </Text>
          </View>
        </DetailSection>
      )}

      {!showMapSection && !showOnlineSection && (
        <DetailSection
          title="Location"
          showTooltip={false}
          titleStyle={styles.mapTitle}>
          <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
            Location details will be shared soon.
          </Text>
        </DetailSection>
      )}
    </>
  );
};

export default LocationSection;
