import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  TextInput,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import themeVariables from '../styles/theme';

const STORAGE_KEY = 'gatherPins';

const Gather = () => {
  const [pins, setPins] = useState([]);
  const [region, setRegion] = useState(null);
  const [currentLoc, setCurrentLoc] = useState(null);
  const [timeModalVisible, setTimeModalVisible] = useState(false);
  const [timeInput, setTimeInput] = useState('60');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPins(parsed);
        } catch (e) {
          // ignore bad data
        }
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPins(prev => {
        const updated = prev.map(pin => ({ ...pin, expired: Date.now() > pin.expiresAt }));
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const onUserLocationChange = e => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setCurrentLoc({ latitude, longitude });
    if (!region) {
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const dropPin = () => {
    if (!currentLoc) return;
    const minutes = parseInt(timeInput, 10) || 0;
    const expiresAt = Date.now() + minutes * 60000;
    const newPin = {
      id: Date.now().toString(),
      coordinate: currentLoc,
      expiresAt,
      expired: false,
    };
    const updated = [...pins, newPin];
    setPins(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTimeModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation
        onUserLocationChange={onUserLocationChange}
        region={region}
        provider={Platform.OS === 'android' ? MapView.PROVIDER_GOOGLE : null}
      >
        {pins.map(pin => (
          <Marker
            key={pin.id}
            coordinate={pin.coordinate}
            pinColor={pin.expired ? 'gray' : themeVariables.primaryColor}
          />
        ))}
      </MapView>

      <TouchableOpacity style={styles.fab} onPress={() => setTimeModalVisible(true)}>
        <Ionicons name="pin" size={28} color={themeVariables.whiteColor} />
      </TouchableOpacity>

      <Modal transparent visible={timeModalVisible} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pin expires in (minutes)</Text>
            <TextInput
              style={styles.input}
              value={timeInput}
              onChangeText={setTimeInput}
              keyboardType="number-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setTimeModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={dropPin}>
                <Text style={styles.modalButtonText}>Drop</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: themeVariables.primaryColor,
    borderRadius: 24,
    padding: 16,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: themeVariables.blackColor,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    marginLeft: 12,
  },
  modalButtonText: {
    color: themeVariables.primaryColor,
    fontWeight: '600',
  },
});

export default Gather;

