// src/screens/SafetyScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Linking,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';

const SAFETY_CARDS = [
  {
    key: 'burn',
    emoji: '🔥',
    icon: 'fire',
    iconLib: 'community',
    bgColor: '#FFEBEE',
    iconColor: '#C62828',
    borderColor: '#E53935',
    titleKey: 'safety.burnCable',
    title_hi: 'तार मत जलाएं!',
    title_mr: 'तार जाळू नका!',
    desc_hi: 'तार जलाने से ज़हरीला धुआं निकलता है जो फेफड़ों को नुकसान पहुँचाता है। तार को अधिकृत रिसाइकलर को दें।',
    desc_mr: 'तार जाळल्याने विषारी धूर निघतो जो फुफ्फुसांना हानी पोहोचवतो. अधिकृत रिसायकलरला द्या.',
    audioKey: 'burn_cable',
  },
  {
    key: 'crt',
    emoji: '📺',
    icon: 'television',
    iconLib: 'community',
    bgColor: '#FFF3E0',
    iconColor: '#E65100',
    borderColor: '#F57C00',
    titleKey: 'safety.breakCRT',
    title_hi: 'पुराना टीवी मत तोड़ें!',
    title_mr: 'जुना टीव्ही तोडू नका!',
    desc_hi: 'CRT टीवी में लेड और फॉस्फर होता है जो बहुत ज़हरीला होता है। बिना सुरक्षा के न तोड़ें।',
    desc_mr: 'CRT टीव्हीमध्ये शिसे आणि फॉस्फर असते जे अत्यंत विषारी आहे. सुरक्षेशिवाय तोडू नका.',
    audioKey: 'break_crt',
  },
  {
    key: 'battery',
    emoji: '🔋',
    icon: 'battery-alert',
    iconLib: 'community',
    bgColor: '#E8F5E9',
    iconColor: '#1B5E20',
    borderColor: '#388E3C',
    titleKey: 'safety.battery',
    title_hi: 'बैटरी सावधानी से उठाएं',
    title_mr: 'बॅटरी काळजीपूर्वक उचला',
    desc_hi: 'लिथियम बैटरी को दबाने या छेदने से आग लग सकती है। फूली हुई बैटरी को न छुएं।',
    desc_mr: 'लिथियम बॅटरी दाबल्यास किंवा छिद्र केल्यास आग लागू शकते. फुगलेली बॅटरी स्पर्श करू नका.',
    audioKey: 'battery_safety',
  },
  {
    key: 'pcb',
    emoji: '🖥️',
    icon: 'chip',
    iconLib: 'community',
    bgColor: '#F3E5F5',
    iconColor: '#6A1B9A',
    borderColor: '#8E24AA',
    titleKey: 'safety.pcb',
    title_hi: 'PCB बोर्ड सुरक्षा',
    title_mr: 'PCB बोर्ड सुरक्षा',
    desc_hi: 'सर्किट बोर्ड में सीसा और पारा होता है। एसिड से न धोएं। हाथ धोए बिना खाना न खाएं।',
    desc_mr: 'सर्किट बोर्डमध्ये शिसे आणि पारा असतो. आम्लाने धुवू नका. हात न धुता जेवू नका.',
    audioKey: 'pcb_safety',
  },
  {
    key: 'gloves',
    emoji: '🧤',
    icon: 'hand-right',
    iconLib: 'community',
    bgColor: '#E3F2FD',
    iconColor: '#1565C0',
    borderColor: '#1976D2',
    titleKey: 'safety.gloves',
    title_hi: 'दस्ताने पहनें',
    title_mr: 'हातमोजे घाला',
    desc_hi: 'काम शुरू करने से पहले हमेशा मोटे रबड़ के दस्ताने पहनें। खुले हाथों से ई-वेस्ट न उठाएं।',
    desc_mr: 'काम सुरू करण्यापूर्वी नेहमी जाड रबर हातमोजे घाला. उघड्या हाताने ई-कचरा उचलू नका.',
    audioKey: 'wear_gloves',
  },
  {
    key: 'emergency',
    emoji: '🚨',
    icon: 'phone-alert',
    iconLib: 'community',
    bgColor: '#FCE4EC',
    iconColor: '#880E4F',
    borderColor: '#C2185B',
    titleKey: 'safety.call112',
    title_hi: 'आपातकाल: 112 पर कॉल करें',
    title_mr: 'आणीबाणी: 112 वर कॉल करा',
    desc_hi: 'आग लगने, जहरीले धुएं, या चोट लगने पर तुरंत 112 पर कॉल करें। अकेले न रहें।',
    desc_mr: 'आग, विषारी धूर किंवा दुखापत झाल्यास लगेच 112 वर कॉल करा. एकट्याने राहू नका.',
    audioKey: 'emergency',
    callAction: '112',
  },
];

export default function SafetyScreen() {
  const { t, i18n } = useTranslation();
  const [playingKey, setPlayingKey] = useState(null);
  const lang = i18n.language;

  const speakCard = (card) => {
    if (playingKey === card.key) { Speech.stop(); setPlayingKey(null); return; }
    const title = lang === 'mr' ? card.title_mr : card.title_hi;
    const desc = lang === 'mr' ? card.desc_mr : card.desc_hi;
    setPlayingKey(card.key);
    Speech.speak(`${title}. ${desc}`, {
      language: lang === 'mr' ? 'mr-IN' : 'hi-IN',
      rate: 0.85,
      onDone: () => setPlayingKey(null),
      onStopped: () => setPlayingKey(null),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#BF360C" barStyle="light-content" />
      <View style={styles.header}>
        <MaterialIcons name="security" size={24} color="#fff" />
        <Text style={styles.headerTitle}>{t('safety.title')}</Text>
      </View>
      <Text style={styles.headerSub}>⚠️ ये जानकारी बहुत ज़रूरी है — ज़रूर सुनें</Text>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {SAFETY_CARDS.map((card) => (
          <View key={card.key} style={[styles.card, { backgroundColor: card.bgColor, borderLeftColor: card.borderColor }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{card.emoji}</Text>
              <View style={styles.cardTitleBlock}>
                <Text style={[styles.cardTitle, { color: card.iconColor }]}>
                  {lang === 'mr' ? card.title_mr : card.title_hi}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.audioBtn, { backgroundColor: card.iconColor }]}
                onPress={() => speakCard(card)}
              >
                <MaterialIcons
                  name={playingKey === card.key ? 'stop' : 'volume-up'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardDesc}>{lang === 'mr' ? card.desc_mr : card.desc_hi}</Text>

            {card.callAction && (
              <TouchableOpacity
                style={[styles.callBtn, { backgroundColor: card.iconColor }]}
                onPress={() => Linking.openURL(`tel:${card.callAction}`)}
              >
                <MaterialIcons name="phone" size={18} color="#fff" />
                <Text style={styles.callBtnText}>{card.callAction} पर कॉल करें</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F6' },
  header: {
    backgroundColor: '#BF360C', padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { backgroundColor: '#FFCCBC', padding: 12, fontSize: 13, color: '#BF360C', fontWeight: '600' },
  grid: { padding: 12, gap: 12, paddingBottom: 32 },
  card: {
    borderRadius: 14, padding: 16, borderLeftWidth: 5,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardEmoji: { fontSize: 32, marginRight: 10 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  audioBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', elevation: 2,
  },
  cardDesc: { fontSize: 14, color: '#444', lineHeight: 20 },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start',
  },
  callBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
