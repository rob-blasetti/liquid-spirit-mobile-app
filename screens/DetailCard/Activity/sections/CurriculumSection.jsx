import React from 'react';
import { View, Text } from 'react-native';
import SectionTitle from '../../common/SectionTitle';

const CurriculumSection = ({ curriculumDetails, styles }) => {
  if (!curriculumDetails) return null;
  return (
    <>
      <SectionTitle
        title="Class Curriculum"
        note="Curriculum details reflect the next upcoming session."
        titleStyle={styles.mapTitle}
      />
      <View style={styles.curriculumBox}>
        <View style={styles.curriculumRowContainer}>
          <Text style={styles.curriculumLabel}>Grade</Text>
          <Text style={styles.curriculumValue}>
            {curriculumDetails.grade != null ? curriculumDetails.grade : '—'}
          </Text>
        </View>
        {(curriculumDetails.setTitle || curriculumDetails.lessonSummary) && (
          <View style={styles.curriculumDivider} />
        )}
        {curriculumDetails.setTitle ? (
          <View style={styles.curriculumRowContainer}>
            <Text style={styles.curriculumLabel}>Set</Text>
            <Text style={styles.curriculumValue}>{curriculumDetails.setTitle}</Text>
          </View>
        ) : null}
        {curriculumDetails.lessonSummary ? (
          <View style={styles.curriculumRowContainer}>
            <Text style={styles.curriculumLabel}>Lesson</Text>
            <Text style={styles.curriculumValue}>{curriculumDetails.lessonSummary}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.divider} />
    </>
  );
};

export default CurriculumSection;
