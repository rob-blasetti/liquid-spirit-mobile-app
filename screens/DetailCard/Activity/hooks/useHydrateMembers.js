import { useEffect, useMemo, useRef, useState } from 'react';
import FastImage from 'react-native-fast-image';
import { fetchUserById } from '../../../../services/UserService';
import {
  applyHydratedMembers,
  collectAllMemberEntries,
  entryNeedsHydration,
  resolveEntryId,
  resolveFetchedUser,
} from '../utils/memberUtils';

// Cross-screen in-memory cache to avoid re-fetching the same profiles on every detail open.
const hydratedProfileCache = new Map();

const useHydrateMembers = ({ activity, prefillActivity, token }) => {
  const [hydratedProfiles, setHydratedProfiles] = useState(() => {
    const initial = {};
    hydratedProfileCache.forEach((value, key) => {
      initial[String(key)] = value;
    });
    return initial;
  });
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

    // Pull anything we already have from the shared cache to reduce "avatars popping in" delay.
    const cachedMap = {};
    uniqueIds.forEach((id) => {
      if (hydratedProfileCache.has(id)) {
        cachedMap[id] = hydratedProfileCache.get(id);
        hydratedIdsRef.current.add(id);
      }
    });
    if (Object.keys(cachedMap).length) {
      setHydratedProfiles((prev) => ({ ...prev, ...cachedMap }));
    }

    const idsToFetch = uniqueIds.filter((id) => !hydratedIdsRef.current.has(id));
    if (!idsToFetch.length) return;

    // Larger batches -> less time with empty/placeholder avatars.
    const batchSize = 12;
    const batch = idsToFetch.slice(0, batchSize);

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
        const avatarUris = [];

        results.forEach((payload) => {
          const user = resolveFetchedUser(payload);
          if (user?._id) {
            const key = String(user._id);
            userMap[key] = user;
            hydratedProfileCache.set(key, user);
            hydratedIdsRef.current.add(key);
            if (user.profilePicture) {
              avatarUris.push({ uri: user.profilePicture });
            }
          }
        });

        if (avatarUris.length) {
          try {
            FastImage.preload(avatarUris);
          } catch (_) {
            // non-fatal
          }
        }

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
