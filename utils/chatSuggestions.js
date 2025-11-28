import { API_URL } from '../config';

export const resolveAvatarSource = (avatar) => {
  if (!avatar) return '';
  if (typeof avatar === 'object') {
    if (typeof avatar.uri === 'string') {
      return resolveAvatarSource(avatar.uri);
    }
    const nested =
      avatar.url ||
      avatar.path ||
      avatar.href ||
      avatar.value;
    if (nested) {
      return resolveAvatarSource(nested);
    }
    return '';
  }
  if (typeof avatar !== 'string') return '';
  const trimmed = avatar.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^data:/i.test(trimmed)) {
    return trimmed;
  }
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_URL}${normalized}`;
};

export const normalizeMemberEntries = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.memberDetails)) return payload.memberDetails;
  if (Array.isArray(payload?.data?.memberDetails)) return payload.data.memberDetails;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

export const isUserMemberEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return false;
  const candidate =
    entry.details ||
    entry.user ||
    entry.profile ||
    entry.account ||
    entry.member ||
    entry.refId ||
    entry.ref ||
    entry.reference ||
    entry;

  const typeCandidates = [
    entry.type,
    entry.entityType,
    entry.memberType,
    entry.referenceType,
    entry.refType,
    entry.targetType,
    candidate?.type,
    candidate?.entityType,
    candidate?.memberType,
  ];

  return typeCandidates.some((value) => {
    if (!value || typeof value !== 'string') return false;
    const normalized = value.trim().toLowerCase();
    return normalized === 'user';
  });
};

export const normalizeMemberRecord = (entry) => {
  if (!entry) return null;
  const candidate =
    entry.details ||
    entry.profile ||
    entry.user ||
    entry.account ||
    entry.member ||
    entry.refId ||
    entry.ref ||
    entry.reference ||
    entry;

  const id =
    candidate?._id ||
    candidate?.id ||
    candidate?.userId ||
    candidate?.user_id ||
    entry?._id ||
    entry?.id ||
    null;

  const firstName =
    entry.fullName ||
    candidate?.fullName ||
    candidate?.firstName ||
    candidate?.first_name ||
    entry.firstName ||
    entry.first_name ||
    '';

  const lastName =
    candidate?.lastName ||
    candidate?.last_name ||
    entry.lastName ||
    entry.last_name ||
    '';

  const composedName =
    typeof firstName === 'string' && firstName.includes(' ')
      ? firstName
      : [firstName, lastName]
          .map((part) => (typeof part === 'string' ? part.trim() : ''))
          .filter(Boolean)
          .join(' ');

  const email = candidate?.email || entry.email || '';
  const role = entry.communityRole || entry.role || candidate?.role || '';
  const phone =
    candidate?.phoneNumber ||
    candidate?.phone_number ||
    entry.phoneNumber ||
    '';
  const avatar = resolveAvatarSource(
    candidate?.profilePicture ||
      candidate?.profilePictureUrl ||
      candidate?.profile?.profilePicture ||
      candidate?.profile?.avatar ||
      candidate?.avatar ||
      candidate?.avatarUrl ||
      candidate?.photo ||
      candidate?.image ||
      candidate?.media?.avatar ||
      entry.profilePicture ||
      entry.profile_picture ||
      entry.profile?.profilePicture ||
      entry.avatar ||
      entry.avatarUrl ||
      entry.photo ||
      entry.image ||
      entry.media?.avatar,
  );

  const displayName = entry.fullName || composedName || email || phone || 'Member';
  const subtitle = email || role || phone || '';

  const searchHaystack = [displayName, email, role, phone]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    _id: id ? String(id) : null,
    displayName,
    subtitle,
    avatar,
    searchHaystack,
    source: candidate || entry,
    raw: entry,
  };
};

export const buildNormalizedMemberList = (payload, currentUserId = null) => {
  const normalizedId = currentUserId ? String(currentUserId) : '';
  return normalizeMemberEntries(payload)
    .filter((entry) => isUserMemberEntry(entry))
    .map(normalizeMemberRecord)
    .filter(
      (member) =>
        member &&
        member._id &&
        (!normalizedId || member._id !== normalizedId),
    );
};

export const extractActivityId = (activity) => {
  if (!activity) return '';
  const candidates = [
    activity._id,
    activity.id,
    activity.activityId,
    activity.activity_id,
    activity.slug,
    activity.activity?.id,
    activity.activity?._id,
    activity.activity?.activityId,
    activity.details?.activityId,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const value = String(candidate).trim();
    if (value) return value;
  }
  return '';
};

export const resolveActivityImage = (activity = {}) => {
  const candidates = [
    activity.bannerImage,
    activity.imageUrl,
    activity.imageURL,
    activity.bannerUrl,
    activity.bannerURL,
    activity.heroImage,
    activity.photo,
    activity.image,
    activity.coverImage,
    activity.media?.banner,
  ];
  for (const candidate of candidates) {
    const normalized = resolveAvatarSource(candidate);
    if (normalized) return normalized;
  }
  return '';
};

export const getActivityTitle = (activity = {}) => {
  return (
    activity.title ||
    activity.name ||
    activity.activityTitle ||
    activity.groupName ||
    'Activity Chat'
  );
};

export const hasMinimumParticipants = (activity = {}) => {
  const participants = Array.isArray(activity.participantIds)
    ? activity.participantIds
    : [];
  const facilitators = Array.isArray(activity.facilitatorIds)
    ? activity.facilitatorIds
    : [];
  const uniqueIds = new Set();
  [...participants, ...facilitators].forEach((id) => {
    if (!id) return;
    const value = String(id).trim();
    if (value) uniqueIds.add(value);
  });
  return uniqueIds.size >= 2;
};

export const prepareSuggestedActivities = (activities = []) => {
  const map = new Map();
  activities.forEach((activity) => {
    const id = extractActivityId(activity);
    if (!id || map.has(id)) return;
    if (activity.hasChat) return;
    if (!hasMinimumParticipants(activity)) return;
    map.set(id, activity);
  });
  return Array.from(map.values());
};
