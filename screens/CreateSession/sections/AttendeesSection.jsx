import React from 'react';
import { View, Text } from 'react-native';

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
  memberOptionsFull,
  memberLoading,
  memberError,
  styles,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Who will be attending?</Text>
    <MultiSelectMemberInput
      label="Facilitators"
      selected={facilitators}
      onRemove={onRemoveFacilitator}
      searchValue={facilitatorSearch}
      onChangeSearch={onChangeFacilitatorSearch}
      options={memberOptions}
      labelOptions={memberOptionsFull}
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
      labelOptions={memberOptionsFull}
      onSelectOption={onAddParticipant}
      loading={memberLoading}
      error={memberError}
      textInputProps={{ style: styles.input }}
    />
  </View>
);

export default AttendeesSection;
