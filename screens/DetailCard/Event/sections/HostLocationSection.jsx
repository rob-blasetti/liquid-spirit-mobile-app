import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import SectionTitle from '../../common/SectionTitle';
import themeVariables from '../../../../styles/theme';
import { getMarkerCoordinate, normalizeMapRegion } from '../../common/mapRegion';

const HostLocationSection = ({ region, fullAddress, styles, onOpenMaps }) => {
  const normalizedRegion = normalizeMapRegion(region);
  const markerCoordinate = getMarkerCoordinate(region);
  const showLiveMap = normalizedRegion && markerCoordinate;

  return (
    <>
      <SectionTitle title="Where is it?" showTooltip={false} titleStyle={styles.mapTitle} />
      <View style={styles.mapWrapper}>
        {showLiveMap ? (
          <MapView
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={normalizedRegion}
          >
            <Marker coordinate={markerCoordinate} />
          </MapView>
        ) : (
          <View style={styles.mapLoader}>
            <ActivityIndicator size="small" color={themeVariables.primaryColor} />
            <Text style={[styles.headerInfoText, { marginTop: 8, textAlign: 'center' }]}>
              Map preview unavailable
            </Text>
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
