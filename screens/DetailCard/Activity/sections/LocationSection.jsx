import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import SectionTitle from '../../common/SectionTitle';
import themeVariables from '../../../../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

const LocationSection = ({
  showMapSection,
  showOnlineSection,
  isHybridSession,
  mapDisplayName,
  mapDisplayAddress,
  mapAddress,
  region,
  openGoogleMaps,
  resolvedOnlineLink,
  styles,
}) => (
  <>
    {showMapSection && (
      <>
        <SectionTitle
          title="Host Address"
          note="Address reflects the next upcoming session."
          titleStyle={styles.mapTitle}
        />
        <View style={styles.mapWrapper}>
          {region ? (
            <MapView
              provider={MapView.PROVIDER_DEFAULT}
              style={styles.map}
              initialRegion={region}
            >
              <Marker coordinate={region} />
            </MapView>
          ) : (
            <View style={styles.mapLoader}>
              <ActivityIndicator size="small" color={themeVariables.primaryColor} />
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

export default LocationSection;
