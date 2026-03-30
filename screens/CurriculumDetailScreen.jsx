import React, { useLayoutEffect } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import themeVariables from '../styles/theme';

export default function CurriculumDetailScreen({ route, navigation }) {
  // Get passed curriculumLesson or fallback to empty
  const clsn = route.params?.curriculumLesson || {};
  const grade = clsn.grade;
  const setTitle = clsn.setTitle || clsn.set;
  const lessonNumber = clsn.lessonNumber;
  const lessonTitle = clsn.lessonTitle;

  // Set header title to grade
  useLayoutEffect(() => {
    navigation.setOptions({ title: grade != null ? `Grade ${grade}` : 'Curriculum' });
  }, [navigation, grade]);

  return (
    <ScrollView style={styles.container}>
      {setTitle && <Text style={styles.set}>{setTitle}</Text>}
      {lessonNumber != null && <Text style={styles.lessonNumber}>Lesson {lessonNumber}</Text>}
      {lessonTitle && <Text style={styles.lessonTitle}>{lessonTitle}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeVariables.whiteColor,
    padding: 16,
  },
  set: {
    fontSize: 16,
    fontWeight: '500',
    color: themeVariables.primaryColor,
    marginBottom: 8,
  },
  lessonNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: themeVariables.textColor || '#333',
    marginBottom: 8,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: themeVariables.blackColor,
  },
});
