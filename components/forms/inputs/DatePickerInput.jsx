import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import themeVariables from '../../../styles/theme';
import FormHelperText from './FormHelperText';

const formatDate = (date) => {
  if (!(date instanceof Date)) return '';
  return date.toDateString();
};

const getMonthMatrix = (current) => {
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(new Date(year, month, d));
  return cells;
};

const DatePickerInput = ({
  label = 'Date',
  helperText,
  error,
  value,
  onChange,
  inputProps,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const displayDate = useMemo(() => formatDate(value || new Date()), [value]);
  const cells = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);
  const mergedStyle = [
    styles.input,
    inputProps?.style,
    error && styles.inputError,
  ].filter(Boolean);

  const goMonth = (delta) => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + delta);
      return next;
    });
  };

  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setOpen(prev => !prev)}
        style={mergedStyle}
      >
        <Text style={[styles.inputText, !displayDate && styles.placeholder]}>
          {displayDate || 'Select date'}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={themeVariables.blackColor || '#000'} />
      </TouchableOpacity>
      <FormHelperText type="info" visible={!!helperText}>
        {helperText}
      </FormHelperText>
      <FormHelperText type="error" visible={!!error}>
        {error}
      </FormHelperText>

      {open && (
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <TouchableOpacity onPress={() => goMonth(-1)} style={styles.monthNav}>
              <Ionicons name="chevron-back" size={20} color={themeVariables.blackColor} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => goMonth(1)} style={styles.monthNav}>
              <Ionicons name="chevron-forward" size={20} color={themeVariables.blackColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
              <View key={`${d}-${idx}`} style={styles.weekCell}>
                <Text style={styles.weekText}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysWrap}>
            {cells.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  day && value && day.toDateString() === value.toDateString() && styles.dayActive,
                ]}
                disabled={!day}
                onPress={() => {
                  if (day) {
                    onChange?.(day);
                    setCurrentMonth(day);
                    setOpen(false);
                  }
                }}
              >
                <Text style={[styles.dayText, !day && styles.dayTextDisabled]}>
                  {day ? day.getDate() : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
    color: themeVariables.blackColor,
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 4,
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: themeVariables.lightGreyColor || '#f3f3f3',
    borderWidth: 1,
    borderColor: themeVariables.borderLightColor || '#e0e0e0',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  inputText: {
    color: themeVariables.blackColor,
    flex: 1,
    marginRight: 8,
  },
  placeholder: {
    color: themeVariables.darkGreyColor || '#222',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    backgroundColor: 'transparent',
    color: themeVariables.blackColor,
  },
  monthNav: {
    padding: 4,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekText: {
    color: themeVariables.darkGreyColor || '#666',
    fontWeight: '600',
  },
  daysWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  dayActive: {
    backgroundColor: (themeVariables.primaryColor || '#312783') + '15',
    borderWidth: 1,
    borderColor: themeVariables.primaryColor,
  },
  dayText: {
    color: themeVariables.blackColor,
  },
  dayTextDisabled: {
    color: themeVariables.darkGreyColor || '#999',
  },
});

export default DatePickerInput;
