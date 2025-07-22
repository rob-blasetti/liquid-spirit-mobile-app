import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function usePersistedState(key, defaultValue) {
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) {
          setState(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load', key, e);
      }
    })();
  }, [key]);

  useEffect(() => {
    (async () => {
      try {
        if (state === undefined || state === null ||
            (typeof state === 'object' && Object.keys(state).length === 0) ||
            (Array.isArray(state) && state.length === 0)) {
          await AsyncStorage.removeItem(key);
        } else {
          await AsyncStorage.setItem(key, JSON.stringify(state));
        }
      } catch (e) {
        console.error('Failed to save', key, e);
      }
    })();
  }, [key, state]);

  return [state, setState];
}
