/**
 * CurriculumService
 * Fetches and normalizes curriculum metadata+structure by activityType and title,
 * and picks out the current lesson.
 */
// Strategy map: activityType => fetcher
const fetchers = {
  // e.g. "Grade" activities load a local JSON under ../data/grades/${title}.json
  grade: async ({ title }) => {
    // expects a default-exported JSON with { metadata, sets: [ { id, title, lessons: [...] } ] }
    const mod = await import(`../data/grades/${title}.json`);
    return mod.default || mod;
  },
  // TODO: add other activityType handlers here
};

/**
 * Retrieve the curriculum for a given activityType and title.
 * Returns null if no fetcher found or on error.
 */
export async function getCurriculum(activityType, title) {
  if (!activityType || !title) return null;
  const key = activityType.toLowerCase();
  const fetcher = fetchers[key];
  if (!fetcher) return null;
  try {
    return await fetcher({ title });
  } catch (err) {
    console.warn('CurriculumService.getCurriculum error:', err);
    return null;
  }
}

/**
 * Given a curriculum object and an optional currentLessonId,
 * return the matching lesson or the first lesson.
 */
export function getCurrentLesson(curriculum, currentLessonId) {
  if (!curriculum || !Array.isArray(curriculum.sets)) return null;
  // try to find by id
  if (currentLessonId) {
    for (const set of curriculum.sets) {
      const found = set.lessons.find(l => l.id === currentLessonId);
      if (found) return found;
    }
  }
  // fallback: first set > first lesson
  const first = curriculum.sets[0];
  return first && Array.isArray(first.lessons) && first.lessons[0]
    ? first.lessons[0]
    : null;
}
