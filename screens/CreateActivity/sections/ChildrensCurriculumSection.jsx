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
  const [gradeWarning, setGradeWarning] = useState('');
  const [setWarning, setSetWarning] = useState('');

  const isChildrensClass = activityType === "Children's Class";
  const gradeNorm = String(grade || '').trim().toLowerCase();
  const isPreschool = gradeNorm === 'preschool';
  const isGradeOneSchema = gradeNorm === '1';

  useEffect(() => {
    setSetCode('');
    setLessonNumber('');
    onChangeLessonValue('');
    setGradeWarning('');
    setSetWarning('');
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

  const lessonInfoMessage = useMemo(() => {
    if (fetchError) return '';
    if (!grade) return 'Pick a grade to load sets and lessons.';
    if (isGradeOneSchema) return 'Select a lesson.';
    if (!setCode) return 'Select a set to load lessons.';
    return '';
  }, [fetchError, grade, isGradeOneSchema, setCode]);

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
      <Title style={styles.sectionLabel}>Grade</Title>
      <DropdownInput
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
              <Title style={styles.sectionLabel}>Set</Title>
              <DropdownInput
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
              setGradeWarning('');
              setSetWarning('');
            }}
            disabled={!grade || loading}
            textInputProps={{ style: styles.input }}
            error={lessonError}
            onDisabledPress={() => {
              if (!grade) {
                setGradeWarning('Select grade first.');
              }
            }}
          />
              <HelperText type="error" visible={!grade && !!gradeWarning}>
                {gradeWarning}
              </HelperText>
            </>
          )}

          <Title style={styles.sectionLabel}>Lesson</Title>
          <DropdownInput
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
            error={lessonError || fetchError}
            onDisabledPress={() => {
              if (!setCode && !isGradeOneSchema && grade) {
                setSetWarning('Select a set first.');
              }
            }}
          />
          <HelperText type="info" visible={!loading && !fetchError}>
            {lessonInfoMessage || ' '}
          </HelperText>
          <HelperText type="error" visible={!!fetchError}>
            {fetchError}
          </HelperText>
          <HelperText type="error" visible={!setCode && !isGradeOneSchema && !!setWarning}>
            {setWarning}
          </HelperText>
        </>
      )}
    </View>
  );
};

export default ChildrensCurriculumSection;
