import { useMemo } from 'react';

import { normalizeString } from '../utils/activityHelpers';

const useCurriculumDetails = (curriculumLesson) =>
  useMemo(() => {
    if (!curriculumLesson || typeof curriculumLesson !== 'object') return null;
    const grade = curriculumLesson.grade;
    const setTitle = normalizeString(curriculumLesson.setTitle || curriculumLesson.set);
    const lessonNumber = curriculumLesson.lessonNumber;
    const lessonTitle = normalizeString(curriculumLesson.lessonTitle || curriculumLesson.title);
    if (grade == null && !setTitle && lessonNumber == null && !lessonTitle) {
      return null;
    }
    const lessonSummary = (() => {
      if (lessonNumber == null && !lessonTitle) return null;
      const parts = [];
      if (lessonNumber != null) parts.push(`Lesson ${lessonNumber}`);
      if (lessonTitle) parts.push(lessonTitle);
      return parts.join(': ');
    })();
    return {
      grade,
      setTitle,
      lessonSummary,
    };
  }, [curriculumLesson]);

export default useCurriculumDetails;
