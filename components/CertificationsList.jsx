import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Tooltip } from 'react-native-elements';
import themeVariables from '../styles/theme';

/**
 * Renders a list of certification badges.
 * Each item may be a string label or an object with { label, icon, color }.
 * If icon and color are provided, badge is wrapped in a Tooltip showing the label.
 */
const CertificationsList = ({ items = [] }) => {
  // Ensure items is an array
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <View style={styles.container}>
      {safeItems.map((item, idx) => {
        const isObject = typeof item === 'object' && item !== null;
        const label = isObject ? item.label : item;
        const icon = isObject ? item.icon : null;
        const color = isObject && item.color ? item.color : themeVariables.primaryColor;
        const badge = (
          <View key={idx} style={[styles.badge, { backgroundColor: color }]}> 
            {icon && (
              // Larger icon without label
              <Ionicons
                name={icon}
                size={18}
                color={themeVariables.whiteColor}
              />
            )}
          </View>
        );
        // If tooltip needed (object with icon), wrap badge
        if (isObject && icon) {
          return (
            <Tooltip
              key={idx}
              popover={<Text style={styles.tooltipText}>{label}</Text>}
              backgroundColor={color}
            >
              {badge}
            </Tooltip>
          );
        }
        return badge;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 8,
  },
  text: {
    fontSize: 12,
    color: themeVariables.whiteColor,
  },
  // No extra margin when only icon shown
  icon: {},
  tooltipText: {
    color: themeVariables.whiteColor,
    fontSize: 14,
  },
});

export default CertificationsList;