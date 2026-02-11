import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import SectionTitle from '../../common/SectionTitle';
import themeVariables from '../../../../styles/theme';

const isFiniteNumber = (n) => typeof n === 'number' && Number.isFinite(n);

const HostLocationSection = ({ region, fullAddress, styles, onOpenMaps }) => {
  const normalized = useMemo(() => {
    if (!region || typeof region !== 'object') return null;
    const lat = Number(region.latitude);
    const lng = Number(region.longitude);
    const latDelta = Number(region.latitudeDelta);
    const lngDelta = Number(region.longitudeDelta);

    if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;

    return {
      mapRegion: {
        latitude: lat,
        longitude: lng,
        // Keep deltas if valid, otherwise use safe defaults.
        latitudeDelta: isFiniteNumber(latDelta) ? latDelta : 0.01,
        longitudeDelta: isFiniteNumber(lngDelta) ? lngDelta : 0.01,
      },
      markerCoord: { latitude: lat, longitude: lng },
    };
  }, [region]);

  return (
    <>
      <SectionTitle title="Where is it?" showTooltip={false} titleStyle={styles.mapTitle} />
      <View style={styles.mapWrapper}>
        {normalized ? (
          <MapView
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={normalized.mapRegion}
          >
            <Marker coordinate={normalized.markerCoord} />
          </MapView>
        ) : (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="small" color={themeVariables.primaryColor} />
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
