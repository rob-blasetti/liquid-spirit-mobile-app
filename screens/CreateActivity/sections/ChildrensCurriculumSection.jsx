import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { HelperText, Title } from 'react-native-paper';

import DropdownInput from '../../../components/forms/inputs/DropdownInput';
import { fetchChildrensCurriculum } from '../../../services/CurriculumService';

const GRADE_OPTIONS = ['Preschool', '1', '2', '3', '4', '5', '6'].map((grade) => ({
  value: grade,
  label: grade === 'Preschool' ? 'Preschool' : `Grade ${grade}`,
}));

const ChildrensCurriculumSection = ({
  activityType,
  grade,
  value,
  onChangeGrade,
  onChangeLessonValue,
  onChangeSetMeta,
  onChangeLessonMeta,
  gradeError,
  lessonError,
  styles,
}) => {
  const [curriculum, setCurriculum] = useState(null);
  const [setCode, setSetCode] = useState('');
  const [lessonNumber, setLessonNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const isChildrensClass = activityType === "Children's Class";
  const gradeNorm = String(grade || '').trim().toLowerCase();
  const isPreschool = gradeNorm === 'preschool';
  const isGradeOneSchema = gradeNorm === '1';

  useEffect(() => {
    setSetCode('');
    setLessonNumber('');
    onChangeLessonValue('');
  }, [grade, onChangeLessonValue]);

  useEffect(() => {
    if (!isChildrensClass || isPreschool || !grade) {
      setCurriculum(null);
      setSetCode('');
      setLessonNumber('');
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const data = await fetchChildrensCurriculum(grade);
        if (!cancelled) setCurriculum(data);
      } catch (err) {
        if (!cancelled) {
          setCurriculum(null);
          setFetchError(err?.message || 'Unable to load curriculum.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activityType, grade, isChildrensClass, isPreschool]);

  const curriculumDoc = useMemo(() => (curriculum?.data ?? curriculum) || null, [curriculum]);

  const sets = useMemo(() => {
    if (isGradeOneSchema) return [];
    return curriculumDoc?.structure?.sets ?? [];
  }, [curriculumDoc, isGradeOneSchema]);

  const setOptions = useMemo(
    () =>
      sets.map((s) => ({
        value: s.setCode || s.id || s._id || s.title,
        label: s.title || `Set ${s.setCode || s.id || ''}`,
        meta: s,
      })),
    [sets],
  );

  const lessonOptions = useMemo(() => {
    if (isGradeOneSchema) return curriculumDoc?.structure?.lessons ?? [];
    if (!setCode) return [];
    return sets.find((s) => String(s.setCode) === String(setCode))?.lessons ?? [];
  }, [isGradeOneSchema, curriculumDoc, sets, setCode]);

  useEffect(() => {
    setSetCode('');
    setLessonNumber('');
  }, [isGradeOneSchema, curriculumDoc]);

  useEffect(() => {
    if (isPreschool) {
      setSetCode('');
      setLessonNumber('');
      if ((value || '') !== '') onChangeLessonValue('');
      return;
    }
    if (!value) return;
    if (isGradeOneSchema) {
      if (String(lessonNumber) !== String(value)) setLessonNumber(String(value));
      setSetCode('');
    } else {
      const [setStr, lessonStr] = String(value).split('.');
      if (setCode !== (setStr || '')) setSetCode(setStr || '');
      if (lessonNumber !== (lessonStr || '')) setLessonNumber(lessonStr || '');
    }
  }, [value, isGradeOneSchema, isPreschool, onChangeLessonValue, setCode, lessonNumber]);

  if (!isChildrensClass) return null;

  return (
    <View style={styles.section}>
      <Title style={styles.sectionTitle}>Curriculum</Title>
      <DropdownInput
        label="Grade"
        value={grade}
        options={GRADE_OPTIONS}
        placeholder="Select grade"
        onSelect={(val) => {
          onChangeGrade(val);
        }}
        textInputProps={{ style: styles.input }}
        error={gradeError}
      />
      <HelperText type="info" visible>
        Preschool hides curriculum; Grade 1 uses lessons without sets.
      </HelperText>

      {!isPreschool && (
        <>
          {!isGradeOneSchema && (
            <>
              <DropdownInput
                label="Set"
                value={setCode}
            options={setOptions}
            placeholder="Select set"
            onSelect={(val, meta) => {
              const selectedSet =
                meta ||
                sets.find((s) => String(s.setCode || s.id || s._id || s.title) === String(val));
              const composeCode =
                selectedSet?.setCode || selectedSet?.id || selectedSet?._id || val;
              setSetCode(composeCode || '');
              setLessonNumber('');
              onChangeLessonValue('');
              onChangeSetMeta?.({
                id: selectedSet?.id || selectedSet?._id || '',
                code: composeCode || '',
                title: selectedSet?.title || '',
              });
              onChangeLessonMeta?.(null);
            }}
            disabled={!grade || loading}
            textInputProps={{ style: styles.input }}
            error={lessonError}
          />
              <HelperText type="error" visible={!grade && !!setCode}>
                Select a grade first.
              </HelperText>
            </>
          )}

          <DropdownInput
            label="Lesson"
            value={lessonNumber}
            options={lessonOptions.map((lesson) => {
              const label = `${lesson.number}. ${lesson.title}`;
              return {
                label,
                value: lesson.number,
                meta: lesson,
              };
            })}
            placeholder="Select lesson"
            onSelect={(val, meta) => {
              const selectedLesson =
                meta ||
                lessonOptions.find(
                  (lesson) =>
                    String(lesson.number) ===
                    String(val),
                );
              const numberValue =
                selectedLesson?.number ??
                selectedLesson?.lessonNumber ??
                val;
              setLessonNumber(numberValue || '');
              if (selectedLesson) {
                onChangeLessonMeta?.({
                  id: selectedLesson.id || selectedLesson._id || selectedLesson.lessonId || '',
                  title: selectedLesson.title || '',
                  number: numberValue,
                });
              }
              if (isGradeOneSchema) {
                onChangeLessonValue(String(numberValue || ''));
              } else if (setCode && numberValue != null && numberValue !== '') {
                onChangeLessonValue(`${setCode}.${numberValue}`);
              } else {
                onChangeLessonValue('');
              }
            }}
            disabled={(!isGradeOneSchema && !setCode) || loading}
            textInputProps={{ style: styles.input }}
            multilineDisplay
            error={lessonError || fetchError}
          />
          <HelperText type="info" visible={!loading && !fetchError}>
            Pick a grade to load sets and lessons.
          </HelperText>
          <HelperText type="error" visible={!!fetchError}>
            {fetchError}
          </HelperText>
        </>
      )}
    </View>
  );
};

export default ChildrensCurriculumSection;
