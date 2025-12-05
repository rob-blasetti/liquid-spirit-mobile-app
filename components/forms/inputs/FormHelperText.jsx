import React from 'react';
import { StyleSheet, Text } from 'react-native';
import themeVariables from '../../../styles/theme';

const FormHelperText = ({
  type = 'info',
  visible = true,
  children,
  style,
}) => {
  if (!visible || children == null) return null;

  const isError = type === 'error';
  return (
    <Text style={[styles.text, isError ? styles.error : styles.info, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  info: {
    color: themeVariables.blackColor || '#111',
  },
  error: {
    color: '#d32f2f',
  },
});

export default FormHelperText;
