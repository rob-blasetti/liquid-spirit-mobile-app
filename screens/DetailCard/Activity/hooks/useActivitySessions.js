import { useMemo } from 'react';

import { buildUpcomingSessions, orderSessionsWithHighlight } from '../utils/sessionUtils';

const useActivitySessions = (activity, initialSessionId) => {
  const allSessions = useMemo(
    () => (Array.isArray(activity?.sessions) ? activity.sessions : []),
    [activity?.sessions],
  );

  const upcomingSessions = useMemo(
    () => buildUpcomingSessions(activity || {}),
    [activity],
  );

  const { orderedUpcomingSessions } = useMemo(
    () => orderSessionsWithHighlight(upcomingSessions, initialSessionId),
    [upcomingSessions, initialSessionId],
  );

  const nextSession = orderedUpcomingSessions[0] || null;
  const curriculumLesson = nextSession?.curriculumLesson || activity?.curriculumLesson || null;

  return {
    allSessions,
    orderedUpcomingSessions,
    nextSession,
    curriculumLesson,
  };
};

export default useActivitySessions;
