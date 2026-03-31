import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';

import themeVariables from '../styles/theme';
import { colors } from '../styles/colours';
import { UserContext } from '../contexts/UserContext';
import { useAuthService } from '../services/AuthService';
import resolveImageSource from '../utils/imageSource';

const EditProfile = ({ navigation }) => {
  const { user, userDetails, setUserDetails, setUser } = useContext(UserContext);
  const { updateMe } = useAuthService();

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
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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
        const phoneRegex = /^[0-9()+\-\s]{7,20}$/;
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

  const handleChange = (itemKey, setter) => next => {
    setter(next);
    setErrors(prev => ({ ...prev, [itemKey]: validateField(itemKey, next) }));
  };

  const handleDateChange = (event, selectedDate) => {
    const date = selectedDate || birthday;
    setShowDatePicker(false);
    if (event?.type === 'dismissed') return;
    setBirthday(date);
    setErrors(prev => ({ ...prev, birthday: validateField('birthday', date) }));
  };

  const validateForm = () => {
    const nextErrors = {
      firstName: validateField('firstName', firstName),
      lastName: validateField('lastName', lastName),
      birthday: validateField('birthday', birthday),
      email: validateField('email', email),
      phoneNumber: validateField('phoneNumber', phoneNumber),
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Check your details', 'Please correct the highlighted fields before saving.');
      return;
    }

    const updatedUser = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthday: birthday.toISOString().split('T')[0],
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      occupation: occupation.trim(),
      skills: skills
        .split(',')
        .map(skill => skill.trim())
        .filter(Boolean),
      preferredLanguage: preferredLanguage.trim(),
      socialMedia: {
        facebook: facebook.trim(),
        x: x.trim(),
        linkedin: linkedin.trim(),
        instagram: instagram.trim(),
        tiktok: tiktok.trim(),
      },
    };

    try {
      setSaving(true);
      const response = await updateMe(updatedUser);

      if (!response || !response.ok) {
        throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
      }

      setUser(response.data);
      if (setUserDetails) {
        setUserDetails({ ...userDetails, ...response.data });
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', `Failed to update profile. ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formattedBirthday = birthday.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const fullName = `${firstName} ${lastName}`.trim() || 'Your Profile';
  const profilePicture = userDetails?.profilePicture || user?.profilePicture || null;

  const sections = [
    {
      title: 'Basic details',
      subtitle: 'The essentials people use to recognize you.',
      fields: [
        {
          key: 'firstName',
          label: 'First name',
          value: firstName,
          onChange: setFirstName,
          placeholder: 'Enter your first name',
          icon: 'person-outline',
          autoCapitalize: 'words',
        },
        {
          key: 'lastName',
          label: 'Last name',
          value: lastName,
          onChange: setLastName,
          placeholder: 'Enter your last name',
          icon: 'person-circle-outline',
          autoCapitalize: 'words',
        },
        {
          key: 'birthday',
          label: 'Birthday',
          value: formattedBirthday,
          icon: 'calendar-outline',
          isDate: true,
        },
      ],
    },
    {
      title: 'Contact',
      subtitle: 'Ways people and the app can reach you.',
      fields: [
        {
          key: 'email',
          label: 'Email',
          value: email,
          onChange: setEmail,
          placeholder: 'name@example.com',
          icon: 'mail-outline',
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          autoCorrect: false,
        },
        {
          key: 'phoneNumber',
          label: 'Phone number',
          value: phoneNumber,
          onChange: setPhoneNumber,
          placeholder: 'Add a phone number',
          icon: 'call-outline',
          keyboardType: 'phone-pad',
        },
        {
          key: 'address',
          label: 'Address',
          value: address,
          onChange: setAddress,
          placeholder: 'Street, suburb, postcode',
          icon: 'location-outline',
          autoCapitalize: 'words',
        },
      ],
    },
    {
      title: 'About you',
      subtitle: 'A few details that round out your profile.',
      fields: [
        {
          key: 'occupation',
          label: 'Occupation',
          value: occupation,
          onChange: setOccupation,
          placeholder: 'What do you do?',
          icon: 'briefcase-outline',
          autoCapitalize: 'words',
        },
        {
          key: 'preferredLanguage',
          label: 'Preferred language',
          value: preferredLanguage,
          onChange: setPreferredLanguage,
          placeholder: 'Preferred language',
          icon: 'language-outline',
          autoCapitalize: 'words',
        },
        {
          key: 'skills',
          label: 'Skills',
          value: skills,
          onChange: setSkills,
          placeholder: 'Comma separated skills',
          icon: 'sparkles-outline',
          helperText: 'Separate each skill with a comma.',
        },
      ],
    },
    {
      title: 'Social links',
      subtitle: 'Optional links to help people find you elsewhere.',
      fields: [
        {
          key: 'facebook',
          label: 'Facebook',
          value: facebook,
          onChange: setFacebook,
          placeholder: 'facebook.com/username',
          icon: 'logo-facebook',
          autoCapitalize: 'none',
          autoCorrect: false,
        },
        {
          key: 'x',
          label: 'X',
          value: x,
          onChange: setX,
          placeholder: '@username',
          icon: 'at-outline',
          autoCapitalize: 'none',
          autoCorrect: false,
        },
        {
          key: 'linkedin',
          label: 'LinkedIn',
          value: linkedin,
          onChange: setLinkedin,
          placeholder: 'linkedin.com/in/username',
          icon: 'logo-linkedin',
          autoCapitalize: 'none',
          autoCorrect: false,
        },
        {
          key: 'instagram',
          label: 'Instagram',
          value: instagram,
          onChange: setInstagram,
          placeholder: '@username',
          icon: 'logo-instagram',
          autoCapitalize: 'none',
          autoCorrect: false,
        },
        {
          key: 'tiktok',
          label: 'TikTok',
          value: tiktok,
          onChange: setTiktok,
          placeholder: '@username',
          icon: 'musical-notes-outline',
          autoCapitalize: 'none',
          autoCorrect: false,
        },
      ],
    },
  ];

  const renderInputField = field => {
    const hasError = !!errors[field.key];

    return (
      <View key={field.key} style={styles.fieldBlock}>
        <View style={[styles.inputShell, hasError && styles.inputShellError]}>
          <View style={styles.inputIconWrap}>
            <Ionicons name={field.icon} size={18} color={colors.primary} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder || field.label}
              placeholderTextColor="#8B94A7"
              value={field.value}
              onChangeText={handleChange(field.key, field.onChange)}
              keyboardType={field.keyboardType}
              autoCapitalize={field.autoCapitalize || 'sentences'}
              autoCorrect={field.autoCorrect}
            />
          </View>
        </View>
        {field.helperText ? <Text style={styles.helperText}>{field.helperText}</Text> : null}
        {hasError ? <Text style={styles.errorText}>{errors[field.key]}</Text> : null}
      </View>
    );
  };

  const renderDateField = field => {
    const hasError = !!errors[field.key];

    return (
      <View key={field.key} style={styles.fieldBlock}>
        <TouchableOpacity
          style={[styles.inputShell, styles.dateShell, hasError && styles.inputShellError]}
          activeOpacity={0.85}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.inputIconWrap}>
            <Ionicons name={field.icon} size={18} color={colors.primary} />
          </View>
          <View style={styles.inputContent}>
            <Text style={styles.inputLabel}>{field.label}</Text>
            <Text style={styles.dateValue}>{field.value}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8B94A7" />
        </TouchableOpacity>
        {hasError ? <Text style={styles.errorText}>{errors[field.key]}</Text> : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            {profilePicture ? (
              <FastImage
                source={resolveImageSource(profilePicture, { priority: 'high' })}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={28} color={themeVariables.whiteColor} />
            )}
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>{fullName}</Text>
            <Text style={styles.heroSubtitle}>
              Keep your details accurate so your profile is easier to trust and use.
            </Text>
          </View>
        </View>

        {sections.map(section => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            <View style={styles.sectionFields}>
              {section.fields.map(field => (field.isDate ? renderDateField(field) : renderInputField(field)))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          activeOpacity={0.9}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={themeVariables.whiteColor} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color={themeVariables.whiteColor} />
              <Text style={styles.saveButtonText}>Save changes</Text>
            </>
          )}
        </TouchableOpacity>
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
    backgroundColor: '#F6F8FC',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 18,
    borderRadius: 24,
    backgroundColor: '#EAF0FF',
    borderWidth: 1,
    borderColor: '#D6E0FF',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: themeVariables.blackColor,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5E6980',
  },
  sectionCard: {
    backgroundColor: themeVariables.whiteColor,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6EBF5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeVariables.blackColor,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6F7890',
    marginTop: 4,
  },
  sectionFields: {
    marginTop: 16,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8DFEC',
    backgroundColor: '#FBFCFF',
    paddingHorizontal: 14,
    minHeight: 68,
  },
  dateShell: {
    justifyContent: 'space-between',
  },
  inputShellError: {
    borderColor: themeVariables.redColor,
    backgroundColor: '#FFF7F7',
  },
  inputIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    marginRight: 12,
  },
  inputContent: {
    flex: 1,
    paddingVertical: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6A738B',
    marginBottom: 2,
  },
  input: {
    fontSize: 16,
    color: '#162033',
    paddingVertical: 0,
  },
  dateValue: {
    fontSize: 16,
    color: '#162033',
  },
  helperText: {
    marginTop: 6,
    marginLeft: 6,
    fontSize: 12,
    color: '#7A849B',
  },
  errorText: {
    marginTop: 6,
    marginLeft: 6,
    fontSize: 12,
    color: themeVariables.redColor,
  },
  saveButton: {
    minHeight: 56,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  saveButtonDisabled: {
    opacity: 0.75,
  },
  saveButtonText: {
    color: themeVariables.whiteColor,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  pickerSheet: {
    backgroundColor: themeVariables.whiteColor,
    paddingBottom: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D8DFEC',
  },
  pickerAction: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default EditProfile;
