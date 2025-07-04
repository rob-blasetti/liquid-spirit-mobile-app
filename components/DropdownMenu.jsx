import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet, Text, View, Dimensions } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFlag, faBan, faVolumeMute, faTrash } from '@fortawesome/free-solid-svg-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const DropdownMenu = ({ onFlag, onBlock, onMute, onDelete, onClose, isOwnPost }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -190, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.menu, { opacity, transform: [{ translateY }] }]}>
        <TouchableOpacity style={styles.item} onPress={onFlag}>
          <Text style={styles.menuText}>
            <FontAwesomeIcon icon={faFlag} size={16} color="#312783" /> Report Post
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={onBlock}>
          <Text style={styles.menuText}>
            <FontAwesomeIcon icon={faBan} size={16} color="#312783" /> Block User
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={onMute}>
          <Text style={styles.menuText}>
            <FontAwesomeIcon icon={faVolumeMute} size={16} color="#312783" /> Mute User
          </Text>
        </TouchableOpacity>
        {isOwnPost && (
        <>
            <View style={styles.seperator} />
            <TouchableOpacity style={styles.item} onPress={onDelete}>
            <Text style={styles.menuText}>
                <FontAwesomeIcon icon={faTrash} size={16} color="#312783" /> Delete Post
            </Text>
            </TouchableOpacity>
        </>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 20,
    width: screenWidth - 30,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 350,
    backgroundColor: 'rgba(47, 40, 40, 0.4)',
    borderRadius: 20,
  },
  menu: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  seperator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#aaa',
    marginVertical: 10,
  }
});

export default DropdownMenu;
