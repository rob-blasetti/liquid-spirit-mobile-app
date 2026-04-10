import React from 'react';

import UserBodyModal from '../../../../components/UserBodyModal';

const EventOversightBodyModal = ({
  visible,
  onClose,
  title,
  members = [],
  headerContent,
}) => (
  <UserBodyModal
    visible={visible}
    onClose={onClose}
    title={title}
    members={members}
    headerContent={headerContent}
    emptyTitle="No oversight available"
    emptySubtitle="Committee members will appear here when available."
  />
);

export default EventOversightBodyModal;
