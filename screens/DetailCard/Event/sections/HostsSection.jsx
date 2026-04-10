import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserBadge from '../../../../components/UserBadge';
import themeVariables from '../../../../styles/theme';
import DetailSection from '../../common/DetailSection';

const HostsSection = ({ hosts, isAdmin, onAddHost, onRemoveHost, styles }) => (
  <DetailSection
    title={hosts.length === 1 ? 'Host' : 'Hosts'}
    titleStyle={styles.mapTitle}
    rightContent={
      isAdmin ? (
        <TouchableOpacity
          style={styles.requestButton}
          onPress={onAddHost}
          activeOpacity={0.8}>
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={themeVariables.whiteColor}
          />
          <Text style={styles.requestButtonText}>Add Host</Text>
        </TouchableOpacity>
      ) : null
    }>
    {hosts.length > 0 ? (
      <View style={styles.userListContainer}>
        {hosts.map((h, idx) => {
          const hostUser = h.details || h;
          const key = h._id || (hostUser && hostUser._id) || idx;
          return (
            <View
              key={key}
              style={{ position: 'relative', marginRight: 12, marginBottom: 12 }}>
              <UserBadge
                user={hostUser}
                userCertifications={h.certifications}
              />
              {isAdmin ? (
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
                  activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color="red" />
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>
    ) : (
      <View style={styles.emptyStateCard}>
        <View style={styles.emptyStateIconWrap}>
          <Ionicons
            name="people-outline"
            size={22}
            color={themeVariables.primaryColor}
          />
        </View>
        <Text style={styles.emptyStateTitle}>No hosts yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Hosts will appear here once someone is assigned.
        </Text>
      </View>
    )}
  </DetailSection>
);

export default HostsSection;
