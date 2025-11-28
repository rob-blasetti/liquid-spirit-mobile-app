import React from 'react';
import { View, Text } from 'react-native';
import { HelperText } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Tooltip } from 'react-native-elements';

import DropdownInput from '../../../components/forms/inputs/DropdownInput';
import themeVariables from '../../../styles/theme';

const ActivityTypeSection = ({
  value,
  options,
  onSelect,
  error,
  styledInputProps,
  styles,
}) => (
  <>
    <View style={styles.labelWithTooltip}>
      <Text style={styles.inputLabelText}>Activity Type *</Text>
      <Tooltip
        popover={<Text style={styles.tooltipText}>Choose the category that best fits this gathering.</Text>}
        skipAndroidStatusBar
        withOverlay={false}
        backgroundColor="rgba(33,33,33,0.95)"
        pointerColor="rgba(33,33,33,0.95)"
        placement="bottom"
        width={240}
        containerStyle={styles.tooltipContainer}
        tooltipStyle={styles.tooltipBubble}
        offset={{ top: 8 }}
      >
        <View style={styles.tooltipIconTarget}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={themeVariables.primaryColor}
          />
        </View>
      </Tooltip>
    </View>
    <DropdownInput
      label="Activity Type *"
      value={value}
      options={options}
      placeholder="Select activity type"
      onSelect={onSelect}
      error={error}
      textInputProps={styledInputProps}
      style={styles.activityTypeWrapper}
    />
    <HelperText type="info" visible>
      This helps participants know what to expect.
    </HelperText>
  </>
);

export default ActivityTypeSection;
