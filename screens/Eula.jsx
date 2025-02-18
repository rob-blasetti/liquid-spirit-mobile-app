import React from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Eula = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>End User License Agreement (EULA)</Text>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.text}>
          1. Introduction &amp; Purpose:{"\n"}
          Welcome to Liquid Spirit! This application is intended solely for informational purposes—to help organize community events and activities and provide a social feed for community engagement. This End User License Agreement (“EULA”) governs your use of our app and forms a legal agreement between you (“User”) and Liquid Spirit (“Provider”).
        </Text>
        <Text style={styles.text}>
          2. License Grant:{"\n"}
          The Provider grants you a limited, non-exclusive, non-transferable, and revocable license to use the App solely for its intended informational and community-building purposes, in accordance with the terms of this EULA.
        </Text>
        <Text style={styles.text}>
          3. Restrictions:{"\n"}
          - You may not modify, distribute, reverse-engineer, or create derivative works based on the App.{"\n"}
          - The App must not be used for any purposes other than those explicitly stated herein.
        </Text>
        <Text style={styles.text}>
          4. Data Collection &amp; Privacy:{"\n"}
          - Personal Data: The App collects personal data such as your address, date of birth, and Bahai ID.{"\n"}
          - Data Management: All personal data is managed according to our Privacy Policy, which is incorporated herein by reference. By using the App, you consent to this data collection and its handling as described in the Privacy Policy.
        </Text>
        <Text style={styles.text}>
          5. Intellectual Property Rights:{"\n"}
          All intellectual property rights in the App—including but not limited to software, content, and designs—are owned by the Provider or its licensors. No rights are transferred to you except for the limited license granted above.
        </Text>
        <Text style={styles.text}>
          6. Disclaimer of Warranties:{"\n"}
          The App is provided “as is” without any warranties, express or implied. The Provider does not warrant that the App will be error-free, secure, or available at all times.
        </Text>
        <Text style={styles.text}>
          7. Limitation of Liability:{"\n"}
          Under no circumstances shall the Provider be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, even if advised of the possibility of such damages.
        </Text>
        <Text style={styles.text}>
          8. Indemnification:{"\n"}
          You agree to indemnify and hold harmless the Provider from any claims, losses, or damages, including legal fees, arising out of your use of the App or any violation of this EULA.
        </Text>
        <Text style={styles.text}>
          9. Termination:{"\n"}
          The Provider reserves the right to terminate or suspend your access to the App if you violate any terms of this EULA. Upon termination, you must immediately cease using the App.
        </Text>
        <Text style={styles.text}>
          10. Governing Law &amp; Jurisdiction:{"\n"}
          This EULA is governed by and construed in accordance with the laws of Australia. Any disputes arising out of or relating to this EULA shall be subject to the exclusive jurisdiction of the courts located in Australia.
        </Text>
        <Text style={styles.text}>
          11. Modifications to This EULA:{"\n"}
          The Provider reserves the right to modify this EULA at any time. Any changes will be posted within the App, and your continued use of the App constitutes acceptance of the modified terms.
        </Text>
        <Text style={styles.text}>
          12. Entire Agreement:{"\n"}
          This EULA, together with our Privacy Policy, constitutes the entire agreement between you and the Provider regarding your use of the App and supersedes all prior agreements.
        </Text>
      </ScrollView>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back to Registration</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Eula;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  scrollView: {
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  button: {
    backgroundColor: '#312783',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
