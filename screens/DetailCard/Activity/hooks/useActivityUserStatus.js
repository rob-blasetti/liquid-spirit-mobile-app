import { useMemo } from 'react';

const normalizeLimit = value => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const useActivityUserStatus = ({
  activity,
  userId,
  optimisticFacilitatorRequest,
  optimisticParticipantRequest,
}) => useMemo(() => {
  const facilitators = activity?.facilitators || [];
  const participants = activity?.participants || [];
  const facilitatorLimit = normalizeLimit(activity?.facilitatorLimit);
  const participantLimit = normalizeLimit(activity?.participantLimit);

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
    facilitatorCount: facilitators.length,
    participantCount: participants.length,
    facilitatorLimit,
    participantLimit,
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
