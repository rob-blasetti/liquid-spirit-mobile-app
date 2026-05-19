import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LiquidGlassIconButton from '../components/LiquidGlassIconButton';
import StaticMapPreview from './DetailCard/common/StaticMapPreview';
import { getMarkerCoordinate, normalizeMapRegion } from './DetailCard/common/mapRegion';
import themeVariables from '../styles/theme';
import { HAS_NATIVE_GOOGLE_MAPS } from '../config';

const MAP_CLOSE_ICON_COLOR = 'rgb(0, 0, 0)';

const MapPreviewScreen = ({ navigation, route }) => {
  const { bottom } = useSafeAreaInsets();
  const { title = 'Host Address', fullAddress = '', region } = route?.params || {};
  const normalizedRegion = normalizeMapRegion(region);
  const markerCoordinate = getMarkerCoordinate(region);
  const canUseNativeMap = Platform.OS !== 'android' || HAS_NATIVE_GOOGLE_MAPS;
  const showLiveMap = normalizedRegion && markerCoordinate && canUseNativeMap;
  const showStaticMap = normalizedRegion && markerCoordinate && !canUseNativeMap;
  const provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  const mapQuery = useMemo(() => {
    if (typeof fullAddress === 'string' && fullAddress.trim().length > 0) {
      return fullAddress.trim();
    }
    if (!markerCoordinate) return '';
    return `${markerCoordinate.latitude},${markerCoordinate.longitude}`;
  }, [fullAddress, markerCoordinate]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {showLiveMap ? (
          <MapView
            provider={provider}
            style={styles.map}
            initialRegion={normalizedRegion}
          >
            <Marker coordinate={markerCoordinate} />
          </MapView>
        ) : showStaticMap ? (
          <StaticMapPreview
            region={normalizedRegion}
            styles={styles}
            fallbackSubtitle={mapQuery ? 'Open the address in Maps for directions' : ''}
          />
        ) : (
          <View style={[styles.mapLoader, styles.mapFallback]}>
            <ActivityIndicator size="small" color={themeVariables.primaryColor} />
            <Text style={styles.mapFallbackText}>Map preview unavailable</Text>
            {mapQuery ? (
              <Text style={styles.mapFallbackSubtext}>Open the address in Maps for directions</Text>
            ) : null}
          </View>
        )}

        <View style={[styles.topBar, { top: 8 }]}>
          <View style={styles.topBarSpacer} />
          <LiquidGlassIconButton
            iconName="close"
            iconColor={MAP_CLOSE_ICON_COLOR}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close map"
            forceFallback
            glassStyle={styles.closeButtonGlass}
          />
        </View>

        {(title || fullAddress) ? (
          <View style={[styles.bottomCardContainer, { paddingBottom: bottom + 18 }]}>
            <View style={styles.bottomCard}>
              {title ? <Text style={styles.bottomCardTitle}>{title}</Text> : null}
              {fullAddress ? <Text style={styles.bottomCardAddress}>{fullAddress}</Text> : null}
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeVariables.blackColor,
  },
  container: {
    flex: 1,
    backgroundColor: themeVariables.blackColor,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoader: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapFallback: {
    backgroundColor: '#f3f4f8',
    paddingHorizontal: 24,
  },
  mapFallbackText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: themeVariables.blackColor,
    textAlign: 'center',
  },
  mapFallbackSubtext: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#5f6472',
    textAlign: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarSpacer: {
    width: 36,
    height: 36,
  },
  closeButtonGlass: {
    backgroundColor: 'rgba(236,237,242,0.96)',
    borderColor: 'rgba(0,0,0,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  bottomCardContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  bottomCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
  bottomCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: themeVariables.primaryColor,
    textTransform: 'uppercase',
  },
  bottomCardAddress: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    color: themeVariables.blackColor,
  },
});

export default MapPreviewScreen;
