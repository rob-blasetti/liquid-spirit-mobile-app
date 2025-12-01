import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import SectionTitle from '../../common/SectionTitle';
import themeVariables from '../../../../styles/theme';

const HostLocationSection = ({ region, fullAddress, styles, onOpenMaps }) => (
  <>
    <SectionTitle title="Where is it?" showTooltip={false} titleStyle={styles.mapTitle} />
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

export default HostLocationSection;
