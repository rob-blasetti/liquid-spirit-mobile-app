import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserBadge from '../../../../components/UserBadge';
import themeVariables from '../../../../styles/theme';

const HostsSection = ({ hosts, isAdmin, onAddHost, onRemoveHost, styles }) => (
  <>
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.mapTitle, { marginTop: 0, marginBottom: 0 }]}>
        {hosts.length === 1 ? 'Host' : 'Hosts'}
      </Text>
      {isAdmin && (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={onAddHost}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={themeVariables.whiteColor}
          />
          <Text style={styles.requestButtonText}>Add Host</Text>
        </TouchableOpacity>
      )}
    </View>

    {hosts.length > 0 ? (
      <View style={styles.userListContainer}>
        {hosts.map((h, idx) => {
          const hostUser = h.details || h;
          const key = h._id || (hostUser && hostUser._id) || idx;
          return (
            <View key={key} style={{ position: 'relative', marginRight: 12, marginBottom: 12 }}>
              <UserBadge
                user={hostUser}
                userCertifications={h.certifications}
              />
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => onRemoveHost(h)}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: 6,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    padding: 2,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color="red" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    ) : (
      <Text style={[styles.headerInfoText, { marginVertical: 12, alignSelf: 'flex-start' }]}>
        No hosts yet.
      </Text>
    )}
    <View style={styles.divider} />
  </>
);

export default HostsSection;
