import React from 'react';
import { View } from 'react-native';
import { Title } from 'react-native-paper';

import MultiSelectMemberInput from '../../../components/forms/inputs/MultiSelectMemberInput';

const AttendeesSection = ({
  facilitators,
  participants,
  facilitatorSearch,
  participantSearch,
  onChangeFacilitatorSearch,
  onChangeParticipantSearch,
  onAddFacilitator,
  onAddParticipant,
  onRemoveFacilitator,
  onRemoveParticipant,
  memberOptions,
  memberLoading,
  memberError,
  styles,
}) => (
  <View style={styles.section}>
    <Title style={styles.sectionTitle}>People</Title>
    <MultiSelectMemberInput
      label="Facilitators"
      selected={facilitators}
      onRemove={onRemoveFacilitator}
      searchValue={facilitatorSearch}
      onChangeSearch={onChangeFacilitatorSearch}
      options={memberOptions}
      onSelectOption={onAddFacilitator}
      loading={memberLoading}
      error={memberError}
      textInputProps={{ style: styles.input }}
    />
    <MultiSelectMemberInput
      label="Participants"
      selected={participants}
      onRemove={onRemoveParticipant}
      searchValue={participantSearch}
      onChangeSearch={onChangeParticipantSearch}
      options={memberOptions}
      onSelectOption={onAddParticipant}
      loading={memberLoading}
      error={memberError}
      textInputProps={{ style: styles.input }}
    />
  </View>
);

export default AttendeesSection;
