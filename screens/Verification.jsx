import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StyleSheet 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import the custom hook
import { useAuthService } from '../services/AuthService';

const Verification = ({ route }) => {
  const navigation = useNavigation();
  const { bahaiId, email, password } = route.params; 

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Destructure `verify` from `useAuthService`
  const { verify } = useAuthService();

  const handleVerification = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter your verification code.');
      return;
    }

    setLoading(true);

    try {
      // Call `verify` from the hook instead of using fetch
      const { ok, data } = await verify(bahaiId, verificationCode, password);

      if (!ok) {
        // If the server responded with an error
        throw new Error(data?.message || 'Invalid verification code.');
      }

      // If everything is OK:
      Alert.alert('Success', 'Your email has been verified!');
      navigation.navigate('Main', { screen: 'Home' });
    } catch (error) {
      // Catch network or error response
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Verify Your Email</Text>
      <Text style={styles.description}>
        Enter the 6-digit code sent to your email: {email}
      </Text>

      <TextInput
        style={styles.input}
        placeholder='Enter Verification Code'
        value={verificationCode}
        onChangeText={setVerificationCode}
        keyboardType='numeric'
        maxLength={6}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleVerification} 
        disabled={loading}
      >
        {loading 
          ? <ActivityIndicator color='#fff' /> 
          : <Text style={styles.buttonText}>Verify</Text>
        }
      </TouchableOpacity>

      {message ? <Text style={styles.errorText}>{message}</Text> : null}
    </View>
  );
};

export default Verification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#312783',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  input: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#312783',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});
