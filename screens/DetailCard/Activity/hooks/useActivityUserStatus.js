import { useMemo } from 'react';

const useActivityUserStatus = ({
  activity,
  userId,
  optimisticFacilitatorRequest,
  optimisticParticipantRequest,
}) => useMemo(() => {
  const facilitators = activity?.facilitators || [];
  const participants = activity?.participants || [];
  const facilitatorLimit = activity?.facilitatorLimit;
  const participantLimit = activity?.participantLimit;

  const isUserFacilitator = facilitators.some(
    (f) => f.details?._id === userId
  );
  const isUserParticipant = participants.some(
    (p) => p.details?._id === userId
  );

  const hasFacilitatorSpace =
    facilitatorLimit == null ? true : facilitators.length < facilitatorLimit;
  const hasParticipantSpace =
    participantLimit == null ? true : participants.length < participantLimit;

  const isPendingFacilitator =
    Array.isArray(activity?.pendingFacilitators) &&
    activity.pendingFacilitators.some((p) =>
      (typeof p === 'string' ? p : p.details?._id) === userId
    );
  const isPendingParticipant =
    Array.isArray(activity?.pendingParticipants) &&
    activity.pendingParticipants.some((p) =>
      (typeof p === 'string' ? p : p.details?._id) === userId
    );
  const hasRequestedFacilitator =
    optimisticFacilitatorRequest || isPendingFacilitator;
  const hasRequestedParticipant =
    optimisticParticipantRequest || isPendingParticipant;

  return {
    isUserFacilitator,
    isUserParticipant,
    hasFacilitatorSpace,
    hasParticipantSpace,
    hasRequestedFacilitator,
    hasRequestedParticipant,
  };
}, [
  activity?.facilitators,
  activity?.participants,
  activity?.pendingFacilitators,
  activity?.pendingParticipants,
  activity?.facilitatorLimit,
  activity?.participantLimit,
  optimisticFacilitatorRequest,
  optimisticParticipantRequest,
  userId,
]);

export default useActivityUserStatus;
