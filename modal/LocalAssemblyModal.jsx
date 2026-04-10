import React, {useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {CommunityContext, UserContext} from '../contexts';
import UserBodyModal from '../components/UserBodyModal';

// LocalAssemblyModal now consumes assembly member data from CommunityContext
const LocalAssemblyModal = ({ visible, onClose }) => {
  const {homeOverview} = useContext(CommunityContext);
  const {user} = useContext(UserContext);
  const members = homeOverview?.localSpiritualAssembly || [];
  const communityName =
    user?.community?.name?.trim?.() || homeOverview?.community?.name?.trim?.();

  return (
    <UserBodyModal
      visible={visible}
      onClose={onClose}
      title="Your Local Spiritual Assembly"
      members={members}
      emptyTitle="No assembly members available"
      emptySubtitle="Assembly members will appear here when available."
      headerContent={
        communityName ? (
          <View style={styles.communityChip}>
            <Ionicons
              name="leaf-outline"
              size={12}
              style={styles.communityChipIcon}
            />
            <Text style={styles.communityChipText} numberOfLines={1}>
              {communityName}
            </Text>
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  communityChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF7F0',
    borderWidth: 1,
    borderColor: '#D6EBD9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    maxWidth: '100%',
  },
  communityChipIcon: {
    color: '#2F7A46',
    marginRight: 6,
  },
  communityChipText: {
    color: '#2F7A46',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LocalAssemblyModal;
