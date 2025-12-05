import React from 'react';
import { View, Text } from 'react-native';

import DropdownInput from '../../../components/forms/inputs/DropdownInput';
import FormHelperText from '../../../components/forms/inputs/FormHelperText';

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
    <Text style={styles.sectionTitle}>Curriculum</Text>
    <Text style={styles.sectionLabel}>Grade</Text>
    <DropdownInput
      value={selectedGrade}
      options={gradeOptions}
      placeholder="Select grade"
      onSelect={onSelectGrade}
      textInputProps={{ style: styles.input }}
      error={gradeError}
    />
    <FormHelperText type="info" visible>
      Choose grade 1 or higher.
    </FormHelperText>

    <Text style={styles.sectionLabel}>Set</Text>
    <DropdownInput
      value={selectedSet}
      options={setOptions}
      placeholder="Select set"
      onSelect={onSelectSet}
      disabled={!selectedGrade || loading}
      textInputProps={{ style: styles.input }}
      error={setError}
    />
    <FormHelperText type="error" visible={!selectedGrade && !!selectedSet}>
      Select a grade first.
    </FormHelperText>

    <Text style={styles.sectionLabel}>Lesson</Text>
    <DropdownInput
      value={selectedLesson}
      options={lessonOptions}
      placeholder="Select lesson"
      onSelect={onSelectLesson}
      disabled={!selectedSet || loading}
      textInputProps={{ style: styles.input }}
      error={lessonError || fetchError}
    />
    <FormHelperText type="info" visible={!loading && !fetchError}>
      Sets and lessons filter after picking a grade.
    </FormHelperText>
    <FormHelperText type="error" visible={!!fetchError}>
      {fetchError}
    </FormHelperText>
  </View>
);

export default CurriculumSection;
