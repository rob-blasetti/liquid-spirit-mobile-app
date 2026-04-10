import { coalesceString } from './activityHelpers';

const resolveEntryDetails = (entry) => {
  if (!entry || typeof entry === 'string' || typeof entry === 'number') return null;
  if (entry.details && typeof entry.details === 'object') return entry.details;
  if (entry.refId && typeof entry.refId === 'object') return entry.refId;
  if (entry.user && typeof entry.user === 'object') return entry.user;
  if (entry.profile && typeof entry.profile === 'object') return entry.profile;
  return typeof entry === 'object' ? entry : null;
};

const resolveEntryType = (entry = {}) => {
  const details = resolveEntryDetails(entry);
  const candidates = [
    entry?.type,
    entry?.memberType,
    entry?.refType,
    entry?.referenceType,
    entry?.entityType,
    details?.type,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const normalized = candidate.trim().toLowerCase();
    if (normalized.length) return normalized;
  }

  return '';
};

const isMemberEntry = entry => resolveEntryType(entry) === 'member';

export const resolveEntryId = (entry) => {
  if (!entry) return '';
  if (typeof entry === 'string' || typeof entry === 'number') {
    const value = String(entry).trim();
    return value.length ? value : '';
  }

  // Prefer a string refId when present (common backend shape: { type, refId: '<realId>', _id: '<wrapperId>' })
  if (typeof entry.refId === 'string' || typeof entry.refId === 'number') {
    const value = String(entry.refId).trim();
    if (value.length) return value;
  }
  if (typeof entry.refID === 'string' || typeof entry.refID === 'number') {
    const value = String(entry.refID).trim();
    if (value.length) return value;
  }

  if (entry.refId && typeof entry.refId === 'object' && (entry.refId._id || entry.refId.id)) {
    return String(entry.refId._id || entry.refId.id);
  }
  if (entry.refID && typeof entry.refID === 'object' && (entry.refID._id || entry.refID.id)) {
    return String(entry.refID._id || entry.refID.id);
  }

  const details = resolveEntryDetails(entry);
  if (details?._id || details?.id) {
    return String(details._id || details.id);
  }

  if (entry.userId) return String(entry.userId);
  if (entry.user && (entry.user._id || entry.user.id)) return String(entry.user._id || entry.user.id);
  if (entry.profile && (entry.profile._id || entry.profile.id)) return String(entry.profile._id || entry.profile.id);

  // Fall back to entry id last (often wrapper id, so lowest priority)
  if (entry._id || entry.id) return String(entry._id || entry.id);
  return '';
};

const entryHasCompleteProfile = (entry) => {
  const details = resolveEntryDetails(entry);
  if (!details) return false;
  const name = coalesceString(
    details.firstName,
    details.first_name,
    details.givenName,
    details.given_name,
    details.lastName,
    details.last_name,
    details.name,
    details.displayName,
    details.username,
    details.email,
  );
  const avatar =
    details.profilePicture ||
    details.avatar ||
    details.avatarUrl ||
    details.photo ||
    details.image;
  const memberStatus = coalesceString(
    details.status,
    entry?.status,
    entry?.memberStatus,
  );

  if (isMemberEntry(entry)) {
    return Boolean((name || avatar) && memberStatus);
  }

  return Boolean(name || avatar);
};

export const collectAllMemberEntries = (activity = {}) => {
  const entries = [];
  const appendFromList = (list = []) => {
    if (!Array.isArray(list)) return;
    list.forEach(entry => {
      if (entry) {
        entries.push(entry);
      }
    });
  };

  appendFromList(activity.facilitators);
  appendFromList(activity.participants);
  appendFromList(activity.members);
  appendFromList(activity.attendees);
  appendFromList(activity.guests);

  if (Array.isArray(activity.sessions)) {
    activity.sessions.forEach((session = {}) => {
      appendFromList(session.facilitators);
      appendFromList(session.participants);
      appendFromList(session.attendees);
      appendFromList(session.members);
    });
  }

  return entries;
};

export const entryNeedsHydration = (entry) => {
  if (!entry) return false;
  if (entryHasCompleteProfile(entry)) return false;
  return Boolean(resolveEntryId(entry));
};

export const resolveFetchedUser = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [payload, payload.data, payload.user];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && (candidate._id || candidate.id)) {
      return candidate;
    }
  }
  return null;
};

export const applyHydratedMembers = (activity, profileMap = {}) => {
  if (!activity || !profileMap || !Object.keys(profileMap).length) return activity;

  const hydrateEntry = (entry) => {
    const id = resolveEntryId(entry);
    if (!id) return entry;
    const profile = profileMap[id];
    if (!profile) return entry;
    const normalizedProfile = resolveFetchedUser(profile) || profile;
    const details = resolveEntryDetails(entry);
    const detailsId = details?._id || details?.id;
    if (details && detailsId === normalizedProfile?._id) {
      const hasName =
        coalesceString(
          details.firstName,
          details.first_name,
          details.givenName,
          details.given_name,
          details.lastName,
          details.last_name,
          details.name,
          details.displayName,
          details.username,
          details.email,
        ).length > 0;
      const hasAvatar =
        details.profilePicture ||
        details.avatar ||
        details.avatarUrl ||
        details.photo ||
        details.image;
      const hasMemberStatus = coalesceString(
        details.status,
        entry?.status,
        normalizedProfile?.status,
      ).length > 0;
      if (
        hasName &&
        hasAvatar &&
        (!isMemberEntry(entry) || hasMemberStatus)
      ) {
        return entry;
      }
    }
    if (typeof entry === 'object') {
      return {
        ...entry,
        details: { ...(details || {}), ...(normalizedProfile || {}) },
      };
    }
    return {
      type: entry?.type || '',
      details: { ...(normalizedProfile || {}) },
    };
  };

  const hydrateList = (list) => {
    if (!Array.isArray(list) || list.length === 0) return list;
    let listChanged = false;
    const next = list.map(entry => {
      const hydrated = hydrateEntry(entry);
      if (hydrated !== entry) {
        listChanged = true;
      }
      return hydrated;
    });
    return listChanged ? next : list;
  };

  const hydrateSessions = (sessions) => {
    if (!Array.isArray(sessions) || sessions.length === 0) return sessions;
    let sessionsChanged = false;
    const next = sessions.map((session) => {
      if (!session || typeof session !== 'object') return session;
      const hydratedSession = {
        ...session,
        facilitators: hydrateList(session.facilitators),
        participants: hydrateList(session.participants),
        attendees: hydrateList(session.attendees),
        members: hydrateList(session.members),
      };
      const hasChanged =
        hydratedSession.facilitators !== session.facilitators ||
        hydratedSession.participants !== session.participants ||
        hydratedSession.attendees !== session.attendees ||
        hydratedSession.members !== session.members;
      if (hasChanged) sessionsChanged = true;
      return hasChanged ? hydratedSession : session;
    });
    return sessionsChanged ? next : sessions;
  };

  const nextActivity = {
    ...activity,
    facilitators: hydrateList(activity.facilitators),
    participants: hydrateList(activity.participants),
    members: hydrateList(activity.members),
    attendees: hydrateList(activity.attendees),
    guests: hydrateList(activity.guests),
    sessions: hydrateSessions(activity.sessions),
  };

  if (
    nextActivity.facilitators === activity.facilitators &&
    nextActivity.participants === activity.participants &&
    nextActivity.members === activity.members &&
    nextActivity.attendees === activity.attendees &&
    nextActivity.guests === activity.guests &&
    nextActivity.sessions === activity.sessions
  ) {
    return activity;
  }

  return nextActivity;
};
