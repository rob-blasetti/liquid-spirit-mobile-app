import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Text, Title, HelperText } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

import themeVariables from '../../../styles/theme';

const CoverImageSection = ({ form, onPickImage, styles }) => (
  <>
    <Title style={[styles.sectionLabel, styles.coverLabel]}>Cover Image</Title>
    <TouchableOpacity
      style={form.imageUrl ? styles.imagePreview : styles.imagePicker}
      onPress={onPickImage}
      activeOpacity={0.8}
    >
      {form.imageUrl ? (
        <>
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: form.imageUrl }} style={styles.imageRect} />
            <View style={styles.imageEditBadge}>
              <Ionicons name="create-outline" size={14} color="#fff" />
            </View>
          </View>
          <Text style={styles.imagePickerText}>Change Image</Text>
        </>
      ) : (
        <>
          <Ionicons name="camera-outline" size={36} color={themeVariables.primaryColor} />
          <Text style={styles.imagePickerText}>Add Cover Image</Text>
        </>
      )}
    </TouchableOpacity>
    <HelperText type="info" visible>
      Add a landscape photo to help the activity stand out.
    </HelperText>
  </>
);

export default CoverImageSection;
