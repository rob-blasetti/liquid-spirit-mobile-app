import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tooltip from '../../../components/Tooltip';
import sectionBaseStyles from './sectionBaseStyles';

const SectionTitle = ({ title, note, showTooltip = true, titleStyle, tooltipTextStyle, tooltipStyle }) => {
  const mergedTitleStyle = [sectionBaseStyles.sectionTitle, titleStyle];

  if (!note || !showTooltip) {
    return <Text style={mergedTitleStyle}>{title}</Text>;
  }

  const tooltipWidth = 260;

  return (
    <View style={styles.titleWithTooltip}>
      <Text style={mergedTitleStyle}>{title}</Text>
      <Tooltip
        popover={<Text style={[styles.tooltipPopoverText, tooltipTextStyle]}>{note}</Text>}
        skipAndroidStatusBar
        withOverlay={false}
        backgroundColor="rgba(33, 33, 33, 0.95)"
        pointerColor="rgba(33, 33, 33, 0.95)"
        placement="bottom"
        width={tooltipWidth}
        tooltipStyle={[styles.tooltipBubble, tooltipStyle]}
        containerStyle={styles.tooltipContainer}
        offset={{ top: 8 }}
      >
        <Text style={styles.tooltipIcon}>i</Text>
      </Tooltip>
    </View>
  );
};

const styles = StyleSheet.create({
  titleWithTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tooltipIcon: {
    marginLeft: 6,
    width: 18,
    height: 18,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 18,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999',
    color: '#444',
    fontSize: 12,
    overflow: 'hidden',
  },
  tooltipContainer: {
    padding: 0,
  },
  tooltipBubble: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  tooltipPopoverText: {
    color: '#fff',
    fontSize: 13,
  },
});

export default SectionTitle;
