import React from 'react';
import { View, StyleSheet } from 'react-native';
import SectionTitle from './SectionTitle';
import sectionBaseStyles from './sectionBaseStyles';

const DetailSection = ({
  title,
  note,
  showTooltip = true,
  titleStyle,
  rightContent,
  headerStyle,
  wrapperStyle,
  bodyStyle,
  topDivider = false,
  bottomDivider = true,
  dividerStyle,
  bodyBottomSpacing = 12,
  children,
}) => (
  <View style={wrapperStyle}>
    {topDivider ? (
      <View style={[sectionBaseStyles.sectionDivider, dividerStyle]} />
    ) : null}

    {title ? (
      <View style={[sectionBaseStyles.sectionHeaderRow, headerStyle]}>
        <SectionTitle
          title={title}
          note={note}
          showTooltip={showTooltip}
          titleStyle={titleStyle}
        />
        {rightContent ? <View style={styles.rightContent}>{rightContent}</View> : null}
      </View>
    ) : null}

    <View style={[bodyStyle, bodyBottomSpacing ? { marginBottom: bodyBottomSpacing } : null]}>
      {children}
    </View>

    {bottomDivider ? (
      <View style={[sectionBaseStyles.sectionDivider, dividerStyle]} />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  rightContent: {
    marginLeft: 12,
  },
});

export default DetailSection;
