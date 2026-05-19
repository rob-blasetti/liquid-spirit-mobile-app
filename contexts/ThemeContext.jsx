import React, { createContext, useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import themeVariables, {
  THEME_STORAGE_KEY,
  getThemeMode,
  isDarkTheme,
  setThemeMode,
} from '../styles/theme';
import useMountEffect from '../hooks/useMountEffect';

export const ThemeContext = createContext({
  theme: themeVariables,
  mode: 'light',
  isDarkMode: false,
  setDarkMode: () => {},
  toggleDarkMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(getThemeMode());

  useMountEffect(() => {
    let active = true;

    // Synchronize the app theme with persisted user preference.
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then(storedMode => {
        if (!active) return;
        const nextMode = storedMode === 'dark' ? 'dark' : 'light';
        setThemeMode(nextMode);
        setMode(nextMode);
      })
      .catch(() => {
        if (!active) return;
        setThemeMode('light');
        setMode('light');
      });

    return () => {
      active = false;
    };
  });

  const setDarkMode = useCallback(enabled => {
    const nextMode = enabled ? 'dark' : 'light';
    setThemeMode(nextMode);
    setMode(nextMode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode).catch(() => {});
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!isDarkTheme());
  }, [setDarkMode]);

  const value = useMemo(
    () => ({
      theme: themeVariables,
      mode,
      isDarkMode: mode === 'dark',
      setDarkMode,
      toggleDarkMode,
    }),
    [mode, setDarkMode, toggleDarkMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);

export default ThemeProvider;
