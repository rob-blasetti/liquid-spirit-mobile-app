import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialsItemTile from '../../../../components/MaterialsItemTile';
import themeVariables from '../../../../styles/theme';
import DetailSection from '../../common/DetailSection';

const MaterialsSection = ({
  materials = [],
  isAdmin = false,
  onAddMaterial,
  styles,
}) => (
  <DetailSection
    title="Materials"
    titleStyle={styles.mapTitle}
    rightContent={
      isAdmin && onAddMaterial ? (
        <TouchableOpacity
          style={styles.addMaterialButton}
          onPress={onAddMaterial}
          activeOpacity={0.8}>
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={themeVariables.whiteColor}
          />
          <Text style={styles.addMaterialButtonText}>Add Material</Text>
        </TouchableOpacity>
      ) : null
    }>
    {materials.length > 0 ? (
      <View>
        {materials.map(mat => (
          <MaterialsItemTile key={mat._id || mat.id} material={mat} />
        ))}
      </View>
    ) : (
      <View style={styles.emptyStateCard}>
        <View style={styles.emptyStateIconWrap}>
          <Ionicons
            name="document-text-outline"
            size={22}
            color={themeVariables.primaryColor}
          />
        </View>
        <Text style={styles.emptyStateTitle}>No materials available yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Any shared files or documents will show up here.
        </Text>
      </View>
    )}
  </DetailSection>
);

export default MaterialsSection;
