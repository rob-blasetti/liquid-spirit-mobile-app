import React, { useMemo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import DropdownInput from './DropdownInput';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const TimeSelect = ({ value, onChange, style, inputProps }) => {
  const parts = useMemo(() => {
    if (!(value instanceof Date)) return { hour: '', minute: '', meridiem: 'AM' };
    let hours = value.getHours();
    const minute = String(value.getMinutes()).padStart(2, '0');
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return { hour: String(hours).padStart(2, '0'), minute, meridiem };
  }, [value]);

  const updateTime = (hourPart, minutePart, meridiemPart) => {
    const hour = hourPart || parts.hour || '12';
    const minute = minutePart || parts.minute || '00';
    const meridiem = meridiemPart || parts.meridiem;
    const date = value instanceof Date ? new Date(value) : new Date();
    let hourNum = parseInt(hour, 10);
    if (Number.isNaN(hourNum)) hourNum = 12;
    if (meridiem === 'PM' && hourNum !== 12) hourNum += 12;
    if (meridiem === 'AM' && hourNum === 12) hourNum = 0;
    date.setHours(hourNum, parseInt(minute, 10) || 0, 0, 0);
    onChange?.(date);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <View style={styles.flexItem}>
          <DropdownInput
            label="Hour"
            value={parts.hour}
            options={HOURS}
            placeholder="HH"
            onSelect={(val) => updateTime(val, null, null)}
            textInputProps={inputProps}
          />
        </View>
        <View style={[styles.flexItem, styles.minuteItem]}>
          <DropdownInput
            label="Minutes"
            value={parts.minute}
            options={MINUTES}
            placeholder="MM"
            onSelect={(val) => updateTime(null, val, null)}
            textInputProps={inputProps}
          />
        </View>
        <View style={styles.meridiemWrap}>
          <TouchableOpacity
            style={[
              styles.meridiemToggle,
              parts.meridiem === 'AM' && styles.meridiemToggleActive,
            ]}
            onPress={() => updateTime(null, null, 'AM')}
          >
            <Text style={[
              styles.meridiemText,
              parts.meridiem === 'AM' && styles.meridiemTextActive,
            ]}>AM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.meridiemToggle,
              parts.meridiem === 'PM' && styles.meridiemToggleActive,
            ]}
            onPress={() => updateTime(null, null, 'PM')}
          >
            <Text style={[
              styles.meridiemText,
              parts.meridiem === 'PM' && styles.meridiemTextActive,
            ]}>PM</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexItem: {
    flex: 1,
    marginRight: 8,
  },
  minuteItem: {
    marginRight: 8,
  },
  meridiemWrap: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    height: 56,
    width: 92,
    marginLeft: 4,
  },
  meridiemToggle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7f7f7',
  },
  meridiemToggleActive: {
    backgroundColor: '#312783',
  },
  meridiemText: {
    color: '#222',
    fontWeight: '600',
  },
  meridiemTextActive: {
    color: '#fff',
  },
});

export default TimeSelect;
