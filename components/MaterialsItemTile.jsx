import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../styles/theme';

/**
 * Displays a material item as a tile showing an icon, file name, and file type.
 * On tap, opens the material URL.
 * Props:
 *  - material: { fileType, fileName, url, _id }
 */
const MaterialsItemTile = ({ material }) => {
  // Support both fileName and filename properties
  const { fileType, url, fileName: fn, filename } = material;
  const displayName = fn || filename || url?.split('/').pop() || '';
  // Map file types to Ionicons
  const getIconName = () => {
    const ft = fileType?.toLowerCase();
    if (!ft) return 'document-outline';
    if (ft.includes('pdf')) return 'document-text-outline';
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].some(ext => ft.includes(ext))) return 'document-text-outline';
    if (['jpg', 'jpeg', 'png', 'gif', 'image'].some(ext => ft.includes(ext))) return 'image-outline';
    if (['mp4', 'mov', 'video'].some(ext => ft.includes(ext))) return 'videocam-outline';
    if (['mp3', 'wav', 'audio'].some(ext => ft.includes(ext))) return 'musical-note-outline';
    return 'document-outline';
  };
  const iconName = getIconName();
  const handlePress = () => {
    if (url) Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <Ionicons name={iconName} size={24} color={themeVariables.primaryColor} style={styles.icon} />
      <View style={styles.textContainer}>
        <Text style={styles.fileName} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.fileType}>{fileType?.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: themeVariables.whiteColor,
    marginVertical: 4,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: themeVariables.blackColor,
  },
  fileType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default MaterialsItemTile;
