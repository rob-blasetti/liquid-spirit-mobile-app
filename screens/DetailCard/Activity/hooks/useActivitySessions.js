import { useMemo } from 'react';

import { buildUpcomingSessions, orderSessionsWithHighlight } from '../utils/sessionUtils';

const useActivitySessions = (activity, initialSessionId) => {
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

  return { orderedUpcomingSessions, nextSession, curriculumLesson };
};

export default useActivitySessions;
