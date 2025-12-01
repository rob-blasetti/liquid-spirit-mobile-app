import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchUserById } from '../../../../services/UserService';
import {
  applyHydratedMembers,
  collectAllMemberEntries,
  entryNeedsHydration,
  resolveEntryId,
  resolveFetchedUser,
} from '../utils/memberUtils';

const useHydrateMembers = ({ activity, prefillActivity, token }) => {
  const [hydratedProfiles, setHydratedProfiles] = useState({});
  const hydratedIdsRef = useRef(new Set());

  useEffect(() => {
    if (!token) return;
    const sourceActivity = activity || prefillActivity;
    if (!sourceActivity) return;
    const hydratedKeys = Object.keys(hydratedProfiles || {});
    hydratedKeys.forEach((id) => hydratedIdsRef.current.add(String(id)));
    const members = collectAllMemberEntries(sourceActivity);
    const missingIds = [];
    members.forEach((entry) => {
      if (!entryNeedsHydration(entry)) return;
      const id = resolveEntryId(entry);
      if (!id) return;
      const normalized = String(id);
      if (hydratedIdsRef.current.has(normalized)) return;
      missingIds.push(normalized);
    });
    if (!missingIds.length) return;
    const uniqueIds = Array.from(new Set(missingIds));
    const batchSize = 6;
    const batch = uniqueIds.slice(0, batchSize);
    let cancelled = false;
    const hydrate = async () => {
      try {
        const results = await Promise.all(
          batch.map((userId) =>
            fetchUserById(userId, token).catch((err) => {
              console.warn('Failed to hydrate user profile', userId, err?.message || err);
              hydratedIdsRef.current.add(userId);
              return null;
            }),
          ),
        );
        if (cancelled) return;
        const userMap = {};
        results.forEach((payload) => {
          const user = resolveFetchedUser(payload);
          if (user?._id) {
            const key = String(user._id);
            userMap[key] = user;
            hydratedIdsRef.current.add(key);
          }
        });
        if (Object.keys(userMap).length) {
          setHydratedProfiles((prev) => ({ ...prev, ...userMap }));
        }
      } catch (err) {
        console.warn('Failed to batch hydrate activity members', err);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [token, activity, prefillActivity, hydratedProfiles]);

  const hydratedPrefillActivity = useMemo(
    () => applyHydratedMembers(prefillActivity, hydratedProfiles),
    [prefillActivity, hydratedProfiles],
  );
  const hydratedActivity = useMemo(
    () => applyHydratedMembers(activity, hydratedProfiles),
    [activity, hydratedProfiles],
  );

  return {
    hydratedActivity,
    hydratedPrefillActivity,
  };
};

export default useHydrateMembers;
