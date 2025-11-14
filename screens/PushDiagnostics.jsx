import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserContext } from '../contexts/UserContext';
import themeVariables from '../styles/theme';
import { getApnsHealth, getCurrentApnsToken, registerDevice, sendTestPush } from '../services/PushService';
import { API_URL } from '../config';

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Mono = ({ children }) => (
  <Text style={styles.mono} numberOfLines={2} ellipsizeMode="middle">{children}</Text>
);

const PushDiagnostics = () => {
  const { token } = useContext(UserContext);
  const apnsToken = getCurrentApnsToken();
  const [result, setResult] = useState(null);
  const [title, setTitle] = useState('Test');
  const [body, setBody] = useState('Hello from backend');
  const [payloadText, setPayloadText] = useState('{ "debug": true }');

  const shortAuth = useMemo(() => (token ? `${token.slice(0, 10)}…` : '—'), [token]);
  const shortApns = useMemo(() => (apnsToken ? `${apnsToken.slice(0, 12)}…(${apnsToken.length})` : '—'), [apnsToken]);

  const runHealthConfig = async () => {
    const res = await getApnsHealth(token, { connectivity: false });
    setResult({ action: 'health (config)', ...res });
  };

  const runHealthConnectivity = async () => {
    const res = await getApnsHealth(token, { connectivity: true });
    setResult({ action: 'health (connectivity)', ...res });
  };

  const runRegisterDevice = async () => {
    const res = await registerDevice(token, apnsToken);
    setResult({ action: 'register-device', ...res });
  };

  const runSendTest = async () => {
    let payload = { debug: true };
    try {
      if (payloadText && payloadText.trim()) payload = JSON.parse(payloadText);
    } catch (e) {
      setResult({ action: 'send-test', ok: false, error: 'Invalid JSON in payload' });
      return;
    }
    const res = await sendTestPush(token, apnsToken, { title, body, payload });
    setResult({ action: 'send-test', ...res });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Push Diagnostics</Text>

        <Section title="Environment">
          <Text style={styles.label}>API_URL</Text>
          <Mono>{String(API_URL || '—')}</Mono>
          <Text style={styles.label}>Auth token</Text>
          <Mono>{shortAuth}</Mono>
          <Text style={styles.label}>APNs token</Text>
          <Mono>{shortApns}</Mono>
        </Section>

        <Section title="Checks">
          <TouchableOpacity style={styles.button} onPress={runHealthConfig}>
            <Text style={styles.buttonText}>Health: config</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={runHealthConnectivity}>
            <Text style={styles.buttonText}>Health: connectivity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={runRegisterDevice}>
            <Text style={styles.buttonText}>Register device</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Send Test Push">
          <TextInput
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <TextInput
            placeholder="Body"
            value={body}
            onChangeText={setBody}
            style={styles.input}
          />
          <TextInput
            placeholder='Payload JSON, e.g. { "debug": true }'
            value={payloadText}
            onChangeText={setPayloadText}
            style={[styles.input, styles.inputMulti]}
            multiline
          />
          <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={runSendTest}>
            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Send push</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Result">
          <Text selectable style={styles.result}>
            {result ? JSON.stringify(result, null, 2) : '—'}
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: themeVariables.screenBackgroundColor },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: themeVariables.blackColor, marginBottom: 8 },
  section: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: themeVariables.blackColor },
  label: { fontSize: 12, color: '#666', marginTop: 6 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), fontSize: 12, color: '#333' },
  button: {
    backgroundColor: '#EEE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#222', fontWeight: '600' },
  buttonPrimary: { backgroundColor: themeVariables.primaryColor },
  buttonTextPrimary: { color: '#fff' },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    color: '#333',
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  result: { fontSize: 12, color: '#222' },
});

export default PushDiagnostics;
