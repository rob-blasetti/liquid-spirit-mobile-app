import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import SectionTitle from '../../common/SectionTitle';
import themeVariables from '../../../../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getMarkerCoordinate, normalizeMapRegion } from '../../common/mapRegion';

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
  resolvedOnlineLink,
  styles,
}) => {
  const normalizedRegion = normalizeMapRegion(region);
  const markerCoordinate = getMarkerCoordinate(region);
  const showLiveMap = hasRegion && normalizedRegion && markerCoordinate;

  return (
    <>
      {showMapSection && (
        <>
          <SectionTitle
            title="Host Address"
            note="Address reflects the next upcoming session."
            titleStyle={styles.mapTitle}
          />
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
          <View style={styles.divider} />
        </>
      )}

      {showOnlineSection && (
        <>
          <SectionTitle
            title="Join Online"
            note="This session is available in person and online."
            showTooltip={isHybridSession}
            titleStyle={styles.mapTitle}
          />
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
          <View style={styles.divider} />
        </>
      )}

      {!showMapSection && !showOnlineSection && (
        <>
          <Text style={styles.mapTitle}>Location</Text>
          <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
            Location details will be shared soon.
          </Text>
          <View style={styles.divider} />
        </>
      )}
    </>
  );
};

export default LocationSection;
