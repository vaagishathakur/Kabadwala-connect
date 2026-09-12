// src/screens/LanguageSelectScreen.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

const { width } = Dimensions.get('window');

export default function LanguageSelectScreen({ navigation }) {
  const { t } = useTranslation();

  const selectLanguage = async (lang) => {
    await AsyncStorage.setItem('language', lang);
    await i18n.changeLanguage(lang);
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>♻️</Text>
        <Text style={styles.appName}>KabadConnect</Text>
        <Text style={styles.tagline}>E-Waste • सही दाम • सुरक्षित</Text>
      </View>

      <View style={styles.promptBox}>
        <Text style={styles.promptText}>भाषा निवडा / भाषा चुनें</Text>
        <Text style={styles.promptSub}>Choose your language</Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* Hindi */}
        <TouchableOpacity
          style={[styles.langButton, styles.hindiBtn]}
          onPress={() => selectLanguage('hi')}
          accessibilityLabel="Select Hindi language"
        >
          <Text style={styles.flagText}>🇮🇳</Text>
          <Text style={styles.langName}>हिंदी</Text>
          <Text style={styles.langSub}>Hindi</Text>
        </TouchableOpacity>

        {/* Marathi */}
        <TouchableOpacity
          style={[styles.langButton, styles.marathiBtn]}
          onPress={() => selectLanguage('mr')}
          accessibilityLabel="Select Marathi language"
        >
          <Text style={styles.flagText}>🇮🇳</Text>
          <Text style={styles.langName}>मराठी</Text>
          <Text style={styles.langSub}>Marathi</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>आप बाद में भाषा बदल सकते हैं</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: { alignItems: 'center', marginBottom: 48 },
  logo: { fontSize: 72, marginBottom: 8 },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1 },
  tagline: { fontSize: 14, color: '#A5D6A7', marginTop: 6 },
  promptBox: { alignItems: 'center', marginBottom: 40 },
  promptText: { fontSize: 22, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' },
  promptSub: { fontSize: 14, color: '#C8E6C9', marginTop: 4 },
  buttonContainer: { width: '100%', gap: 16 },
  langButton: {
    width: '100%',
    paddingVertical: 28,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  hindiBtn: { backgroundColor: '#FFFFFF' },
  marathiBtn: { backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#4CAF50' },
  flagText: { fontSize: 36, marginBottom: 4 },
  langName: { fontSize: 28, fontWeight: 'bold', color: '#1B5E20' },
  langSub: { fontSize: 14, color: '#4CAF50', marginTop: 2 },
  footer: { color: '#A5D6A7', marginTop: 40, fontSize: 13 },
});
