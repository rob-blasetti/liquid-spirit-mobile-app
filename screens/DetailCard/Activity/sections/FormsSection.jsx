import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FormsSection = ({ forms = [], styles }) => {
  if (!Array.isArray(forms) || forms.length === 0) return null;
  return (
    <>
      <View style={styles.divider} />
      <Text style={styles.mapTitle}>Forms</Text>
      {forms.map((form, idx) => (
        <TouchableOpacity
          key={form._id || form.id || idx}
          onPress={() => {
            if (form.url) Linking.openURL(form.url);
          }}
        >
          <View style={styles.formRow}>
            <Text style={styles.formLinkText}>{form.name || form.title || `Form ${idx + 1}`}</Text>
            <Ionicons name="chevron-forward" size={18} color={styles?.formLinkText?.color || '#000'} />
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
};

export default FormsSection;
