import React, { useContext, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import themeVariables from '../styles/theme';
import { colors } from '../styles/colours';
import { UserContext } from '../contexts/UserContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthService } from '../services/AuthService';
import DateTimePicker from '@react-native-community/datetimepicker';

const EditProfile = ({ navigation }) => {
  const { user, userDetails, setUserDetails, token, setUser } = useContext(UserContext);
  const { updateMe } = useAuthService();
  const inputRefs = useRef({});

  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [birthday, setBirthday] = useState(user.birthday ? new Date(user.birthday) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState(user.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [address, setAddress] = useState(user.address || '');
  const [occupation, setOccupation] = useState(user.occupation || '');
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [preferredLanguage, setPreferredLanguage] = useState(user.preferredLanguage || '');
  const [facebook, setFacebook] = useState(user.socialMedia?.facebook || '');
  const [x, setX] = useState(user.socialMedia?.x || '');
  const [linkedin, setLinkedin] = useState(user.socialMedia?.linkedin || '');
  const [instagram, setInstagram] = useState(user.socialMedia?.instagram || '');
  const [tiktok, setTiktok] = useState(user.socialMedia?.tiktok || '');
  const [editableFields, setEditableFields] = useState({});
  const [errors, setErrors] = useState({});

  const handleDateChange = (event, selectedDate) => {
    const date = selectedDate || birthday;
    setShowDatePicker(false);
    if (event?.type === 'dismissed') return;
    setBirthday(date);
    setErrors((prev) => ({ ...prev, birthday: validateField('birthday', date) }));
  };

  const validateField = (key, value) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    switch (key) {
      case 'firstName':
      case 'lastName':
        return trimmed ? null : 'Required';
      case 'email': {
        if (!trimmed) return 'Required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(trimmed) ? null : 'Enter a valid email';
      }
      case 'phoneNumber': {
        if (!trimmed) return null;
        const phoneRegex = /^[0-9()+\\-\\s]{7,20}$/;
        return phoneRegex.test(trimmed) ? null : 'Enter a valid phone number';
      }
      case 'birthday': {
        if (!value) return 'Required';
        const now = new Date();
        return value > now ? 'Birthday cannot be in the future' : null;
      }
      default:
        return null;
    }
  };

  const handleChange = (itemKey, setter) => (next) => {
    setter(next);
    setErrors((prev) => ({ ...prev, [itemKey]: validateField(itemKey, next) }));
  };
  const handleSave = async () => {
    const updatedUser = {
      firstName,
      lastName,
      birthday: birthday.toISOString().split('T')[0],
      email,
      phoneNumber,
      address,
      occupation,
      skills: skills.split(',').map(skill => skill.trim()),
      preferredLanguage,
      socialMedia: { facebook, x, linkedin, instagram, tiktok },
    };

    try {
      const response = await updateMe(updatedUser);
      console.log('Response from server:', response);

      if (!response || !response.ok) {
        throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
      }

      // update main user context
      setUser(response.data);
      // update detailed user context as well
      if (setUserDetails) {
        setUserDetails({ ...userDetails, ...response.data });
      }
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', `Failed to update profile. ${error.message}`);
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>


      {[
        { key: 'firstName', label: 'First Name', value: firstName, onChange: setFirstName },
        { key: 'lastName', label: 'Last Name', value: lastName, onChange: setLastName },
        {
          key: 'birthday',
          label: 'Birthday',
          value: birthday.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
          onPress: () => setShowDatePicker(true),
          isDate: true,
        },
        { key: 'email', label: 'Email', value: email, onChange: setEmail },
        { key: 'phoneNumber', label: 'Phone Number', value: phoneNumber, onChange: setPhoneNumber },
        { key: 'address', label: 'Address', value: address, onChange: setAddress },
        { key: 'occupation', label: 'Occupation', value: occupation, onChange: setOccupation },
        { key: 'skills', label: 'Skills (comma separated)', value: skills, onChange: setSkills },
        { key: 'preferredLanguage', label: 'Preferred Language', value: preferredLanguage, onChange: setPreferredLanguage },
        { key: 'facebook', label: 'Facebook', value: facebook, onChange: setFacebook },
        { key: 'x', label: 'X', value: x, onChange: setX },
        { key: 'linkedin', label: 'LinkedIn', value: linkedin, onChange: setLinkedin },
        { key: 'instagram', label: 'Instagram', value: instagram, onChange: setInstagram },
        { key: 'tiktok', label: 'TikTok', value: tiktok, onChange: setTiktok },
      ].map((item, index) => (
        <View key={item.key || index}>
          <View style={styles.cell}>
            <View style={styles.cellContent}>
              <Text style={styles.cellLabel}>{item.label}</Text>
              <TextInput
                style={styles.cellInput}
                placeholder={item.label}
                value={item.value}
                onChangeText={handleChange(item.key, item.onChange)}
                editable={item.isDate ? false : !!editableFields[item.key]}
                placeholderTextColor={themeVariables.darkGreyColor || '#666'}
                ref={(ref) => {
                  if (ref && item.key) inputRefs.current[item.key] = ref;
                }}
              />
              {errors[item.key] ? <Text style={styles.errorText}>{errors[item.key]}</Text> : null}
            </View>
            <Ionicons
              name="create-outline"
              size={18}
              color={colors.text}
              style={styles.cellIcon}
              onPress={() => {
                if (!item.key) return;
                if (item.isDate) {
                  setShowDatePicker(true);
                  return;
                }
                setEditableFields((prev) => ({ ...prev, [item.key]: true }));
                requestAnimationFrame(() => {
                  inputRefs.current[item.key]?.focus?.();
                });
              }}
            />
          </View>
          <View style={styles.cellDivider} />
        </View>
      ))}

      </ScrollView>
      {showDatePicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.pickerOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowDatePicker(false)} />
            <View style={styles.pickerSheet}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerAction}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerAction}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={birthday || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeVariables.screenBackgroundColor,
      paddingBottom: 40,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 60,
    },
    cell: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: '#fff',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    cellContent: {
      flex: 1,
    },
    cellLabel: {
      fontSize: 12,
      color: colors.text,
      marginBottom: 6,
    },
    cellInput: {
      paddingVertical: 4,
      paddingHorizontal: 0,
      fontSize: 16,
      color: colors.text,
    },
    cellIcon: {
      marginLeft: 12,
      marginTop: 2,
    },
    cellDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: themeVariables.borderLightColor,
      marginLeft: 4,
      marginVertical: 2,
    },
    errorText: {
      marginTop: 4,
      color: themeVariables.redColor,
      fontSize: 12,
    },
    pickerOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    pickerSheet: {
      backgroundColor: '#fff',
      paddingBottom: 12,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      overflow: 'hidden',
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: themeVariables.borderLightColor,
    },
    pickerAction: {
      color: themeVariables.primaryColor,
      fontWeight: '600',
      fontSize: 16,
    },
  });

export default EditProfile;
