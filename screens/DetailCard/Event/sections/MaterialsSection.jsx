import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialsItemTile from '../../../../components/MaterialsItemTile';
import themeVariables from '../../../../styles/theme';

const MaterialsSection = ({ materials = [], isAdmin = false, onAddMaterial, styles }) => (
  <>
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.mapTitle, { marginTop: 0, marginBottom: 0 }]}>Materials</Text>
      {isAdmin && onAddMaterial ? (
        <TouchableOpacity
          style={styles.addMaterialButton}
          onPress={onAddMaterial}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={18} color={themeVariables.whiteColor} />
          <Text style={styles.addMaterialButtonText}>Add Material</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    {materials.length > 0 ? (
      <View>
        {materials.map((mat) => (
          <MaterialsItemTile key={mat._id || mat.id} material={mat} />
        ))}
      </View>
    ) : (
      <Text style={[styles.noDataText, styles.noDataSpacing]}>No materials available yet.</Text>
    )}
    <View style={styles.divider} />
  </>
);

export default MaterialsSection;
