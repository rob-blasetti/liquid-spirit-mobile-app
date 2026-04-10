import React from 'react';

import UserBodyModal from '../../../../components/UserBodyModal';

const EventAttendeesModal = ({visible, onClose, attendees = []}) => (
  <UserBodyModal
    visible={visible}
    onClose={onClose}
    title="Attendees"
    members={attendees}
    emptyTitle="No attendees yet"
    emptySubtitle="People who join this event will appear here."
  />
);

export default EventAttendeesModal;
