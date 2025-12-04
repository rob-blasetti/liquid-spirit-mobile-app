import React from 'react';
import { View } from 'react-native';
import { HelperText, Title } from 'react-native-paper';

import DropdownInput from '../../../components/forms/inputs/DropdownInput';

const CurriculumSection = ({
  gradeOptions,
  setOptions,
  lessonOptions,
  selectedGrade,
  selectedSet,
  selectedLesson,
  onSelectGrade,
  onSelectSet,
  onSelectLesson,
  loading,
  gradeError,
  setError,
  lessonError,
  fetchError,
  styles,
}) => (
  <View style={styles.section}>
    <Title style={styles.sectionTitle}>Curriculum</Title>
    <Title style={styles.sectionLabel}>Grade</Title>
    <DropdownInput
      value={selectedGrade}
      options={gradeOptions}
      placeholder="Select grade"
      onSelect={onSelectGrade}
      textInputProps={{ style: styles.input }}
      error={gradeError}
    />
    <HelperText type="info" visible>
      Choose grade 1 or higher.
    </HelperText>

    <Title style={styles.sectionLabel}>Set</Title>
    <DropdownInput
      value={selectedSet}
      options={setOptions}
      placeholder="Select set"
      onSelect={onSelectSet}
      disabled={!selectedGrade || loading}
      textInputProps={{ style: styles.input }}
      error={setError}
    />
    <HelperText type="error" visible={!selectedGrade && !!selectedSet}>
      Select a grade first.
    </HelperText>

    <Title style={styles.sectionLabel}>Lesson</Title>
    <DropdownInput
      value={selectedLesson}
      options={lessonOptions}
      placeholder="Select lesson"
      onSelect={onSelectLesson}
      disabled={!selectedSet || loading}
      textInputProps={{ style: styles.input }}
      error={lessonError || fetchError}
    />
    <HelperText type="info" visible={!loading && !fetchError}>
      Sets and lessons filter after picking a grade.
    </HelperText>
    <HelperText type="error" visible={!!fetchError}>
      {fetchError}
    </HelperText>
  </View>
);

export default CurriculumSection;
