import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

// Import the custom hook
import { useAuthService } from '../services/AuthService';
import { UserContext } from '../contexts/UserContext';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // We still use these from UserContext if we want to store extra details or do additional logic
  const { setUser, setToken, setCommunityId } = useContext(UserContext);
  
  // Get the signIn method (and others if needed) from useAuthService
  const { signIn } = useAuthService();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      // Use the signIn method from useAuthService
      const { ok, data } = await signIn(email, password);
      
      if (ok && data) {
        // Because your backend returns user and token,
        // you can store them in context like before
        setUser({
          id: data.user.id,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          phoneNumber: data.user.phoneNumber,
          address: data.user.address,
          occupation: data.user.occupation,
          preferredLanguage: data.user.preferredLanguage,
          roles: data.user.roles,
          skills: data.user.skills,
          profilePicture: data.user.profilePicture,
          bahaiId: data.user.bahaiId,
          birthday: data.user.birthday,
          community: {
            id: data.user.community?._id,
            name: data.user.community?.name,
            description: data.user.community?.description,
            bannerImage: data.user.community?.bannerImage,
          },
        });
        setToken(data.token);
        setCommunityId(data.user.community?._id);
        navigation.navigate('Main', { screen: 'Home' });
      } else {
        Alert.alert('Error', data?.message || 'Login failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder='Email'
        value={email}
        onChangeText={setEmail}
        keyboardType='email-address'
        autoCapitalize='none'
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder='Password'
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loading ? (
        <ActivityIndicator size='large' color='#0485e2' />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        style={styles.link}
      >
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  // (same styles as before)
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#312783',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#312783',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 16,
  },
  linkText: {
    color: '#0485e2',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
