import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tooltip } from 'react-native-elements';

const SectionTitle = ({ title, note, showTooltip = true, titleStyle, tooltipTextStyle, tooltipStyle }) => {
  if (!note || !showTooltip) {
    return <Text style={titleStyle}>{title}</Text>;
  }

  const tooltipWidth = 260;
  const tooltipHeight = note.length > 55 ? 72 : 52;

  return (
    <View style={styles.titleWithTooltip}>
      <Text style={titleStyle}>{title}</Text>
      <Tooltip
        popover={<Text style={[styles.tooltipPopoverText, tooltipTextStyle]}>{note}</Text>}
        skipAndroidStatusBar
        withOverlay={false}
        backgroundColor="rgba(33, 33, 33, 0.95)"
        pointerColor="rgba(33, 33, 33, 0.95)"
        placement="bottom"
        width={tooltipWidth}
        height={tooltipHeight}
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
