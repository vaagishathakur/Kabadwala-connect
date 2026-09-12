// src/screens/LotCreateScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Alert, ActivityIndicator, Image, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { saveLot, addToSyncQueue } from '../db/queries';
import { MATERIAL_CATEGORIES, CONDITION_OPTIONS, SOURCE_OPTIONS } from '../utils/constants';
import { MaterialClassifier } from '../ml/MaterialClassifier';
import PictogramSelector from '../components/PictogramSelector';
import { formatCurrency } from '../utils/formatters';
import { api } from '../api/client';

const STEPS = ['photo', 'category', 'details', 'review'];

export default function LotCreateScreen({ navigation }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [category, setCategory] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [weight, setWeight] = useState('');
  const [condition, setCondition] = useState('Unknown');
  const [sourceType, setSourceType] = useState('Household');
  const [subCategory, setSubCategory] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const classifier = useRef(new MaterialClassifier()).current;

  // Step 0: Take / Pick Photo
  const pickPhoto = async (useCamera = true) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera/gallery permission required');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: 'Images', quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'Images', quality: 0.7 });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhoto(uri);

      // Try AI classification
      setLoading(true);
      try {
        const classification = await classifier.classify(uri);
        if (classification) {
          setAiSuggestion(classification);
          setCategory(classification.category);
        }
      } catch (e) { /* Classification failed — user selects manually */ }
      setLoading(false);
      setStep(1);
    }
  };

  // Fetch price estimate when category + weight ready
  const fetchEstimate = async (cat, wt) => {
    if (!cat || !wt || parseFloat(wt) <= 0) return;
    try {
      const res = await api.post('/lots', { category: cat, approximate_weight_kg: parseFloat(wt), condition, source_type: sourceType }, { timeout: 5000 });
      if (res.data?.lot) setEstimate(res.data.lot);
    } catch {
      // Offline fallback: compute from cached prices
      setEstimate({ estimated_value_inr: null, price_per_kg: null });
    }
  };

  const goToReview = () => {
    if (!weight || parseFloat(weight) <= 0) {
      Alert.alert('वज़न डालें', 'Please enter weight in kg');
      return;
    }
    fetchEstimate(category, weight);
    setStep(3);
  };

  const saveLotLocal = async () => {
    setSaving(true);
    try {
      const lotId = uuidv4();
      const lot = {
        id: lotId,
        category,
        sub_category: subCategory,
        description: `${category} - ${weight} kg`,
        image_refs: photo ? JSON.stringify([photo]) : '[]',
        approximate_weight_kg: parseFloat(weight),
        condition,
        source_type: sourceType,
        estimated_value_inr: estimate?.estimated_value_inr || null,
        created_at: new Date().toISOString(),
        synced: 0,
      };
      await saveLot(lot);
      await addToSyncQueue('lot', 'create', lot);

      Alert.alert(
        '✅ लॉट सेव हुआ!',
        `Reference: ${lotId.split('-')[0].toUpperCase()}\n${t('common.offline')}`,
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    }
    setSaving(false);
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>📷 {t('lot.create')}</Text>
          <Text style={styles.stepHint}>सामान की फ़ोटो लें</Text>
          <TouchableOpacity style={styles.bigBtn} onPress={() => pickPhoto(true)}>
            <MaterialIcons name="camera-alt" size={48} color="#fff" />
            <Text style={styles.bigBtnText}>कैमरा खोलें</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bigBtn, { backgroundColor: '#388E3C' }]} onPress={() => pickPhoto(false)}>
            <MaterialIcons name="photo-library" size={48} color="#fff" />
            <Text style={styles.bigBtnText}>गैलरी से चुनें</Text>
          </TouchableOpacity>
          {loading && <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 16 }} />}
        </View>
      );

      case 1: return (
        <ScrollView>
          <View style={styles.stepContainer}>
            {photo && <Image source={{ uri: photo }} style={styles.preview} resizeMode="cover" />}
            {aiSuggestion && (
              <View style={styles.aiChip}>
                <MaterialIcons name="auto-awesome" size={16} color="#1B5E20" />
                <Text style={styles.aiText}>AI सुझाव: {aiSuggestion.category} ({Math.round(aiSuggestion.confidence * 100)}%)</Text>
              </View>
            )}
            <Text style={styles.stepTitle}>{t('lot.category')}</Text>
            <PictogramSelector
              categories={MATERIAL_CATEGORIES}
              selected={category}
              onSelect={setCategory}
            />
            <TouchableOpacity
              style={[styles.nextBtn, !category && styles.nextBtnDisabled]}
              onPress={() => category && setStep(2)}
              disabled={!category}
            >
              <Text style={styles.nextBtnText}>अगला →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );

      case 2: return (
        <ScrollView>
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>⚖️ {t('lot.weight')}</Text>
            <TextInput
              style={styles.weightInput}
              placeholder="0.0"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              maxLength={8}
            />
            <Text style={styles.unitLabel}>किलोग्राम (kg)</Text>

            <Text style={styles.sectionLabel}>स्थिति (Condition)</Text>
            <View style={styles.row}>
              {CONDITION_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.chip, condition === c.key && styles.chipSelected]}
                  onPress={() => setCondition(c.key)}
                >
                  <Text style={[styles.chipText, condition === c.key && styles.chipTextSelected]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>स्रोत (Source)</Text>
            <View style={styles.row}>
              {SOURCE_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.chip, sourceType === s.key && styles.chipSelected]}
                  onPress={() => setSourceType(s.key)}
                >
                  <Text style={[styles.chipText, sourceType === s.key && styles.chipTextSelected]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={goToReview}>
              <Text style={styles.nextBtnText}>समीक्षा करें →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );

      case 3: return (
        <ScrollView>
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>✅ समीक्षा / Review</Text>
            {photo && <Image source={{ uri: photo }} style={styles.preview} resizeMode="cover" />}
            <View style={styles.reviewCard}>
              <ReviewRow label="श्रेणी" value={t(`categories.${category}`)} />
              <ReviewRow label="वज़न" value={`${weight} kg`} />
              <ReviewRow label="स्थिति" value={condition} />
              <ReviewRow label="स्रोत" value={sourceType} />
              {estimate?.estimated_value_inr && (
                <ReviewRow label="अनुमानित मूल्य" value={formatCurrency(estimate.estimated_value_inr)} highlight />
              )}
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, saving && { opacity: 0.6 }]}
              onPress={saveLotLocal}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.nextBtnText}>💾 {t('lot.save')}</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Step indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.stepDot, i <= step && styles.stepDotActive]} />
        ))}
      </View>
      {renderStep()}
    </SafeAreaView>
  );
}

function ReviewRow({ label, value, highlight }) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={[styles.reviewValue, highlight && { color: '#1B5E20', fontWeight: 'bold', fontSize: 18 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  stepBar: { flexDirection: 'row', justifyContent: 'center', padding: 12, gap: 8, backgroundColor: '#fff' },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C8E6C9' },
  stepDotActive: { backgroundColor: '#1B5E20' },
  stepContainer: { padding: 20, alignItems: 'center' },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20', marginBottom: 8, textAlign: 'center' },
  stepHint: { fontSize: 14, color: '#666', marginBottom: 24 },
  bigBtn: {
    backgroundColor: '#1B5E20', width: '100%', borderRadius: 16, padding: 28,
    alignItems: 'center', marginBottom: 16, elevation: 3,
  },
  bigBtnText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 8 },
  preview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 12,
  },
  aiText: { color: '#1B5E20', fontSize: 13, fontWeight: '600' },
  weightInput: {
    fontSize: 48, fontWeight: 'bold', color: '#1B5E20', textAlign: 'center',
    borderBottomWidth: 3, borderBottomColor: '#4CAF50', paddingBottom: 8, width: '60%', marginBottom: 4,
  },
  unitLabel: { color: '#666', fontSize: 16, marginBottom: 24 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#333', alignSelf: 'flex-start', marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', gap: 10, alignSelf: 'flex-start', flexWrap: 'wrap', marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#4CAF50' },
  chipSelected: { backgroundColor: '#1B5E20' },
  chipText: { color: '#1B5E20', fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  nextBtn: {
    backgroundColor: '#1B5E20', width: '100%', borderRadius: 12,
    padding: 18, alignItems: 'center', marginTop: 24,
  },
  nextBtnDisabled: { backgroundColor: '#A5D6A7' },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  reviewCard: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  reviewLabel: { fontSize: 14, color: '#666' },
  reviewValue: { fontSize: 16, fontWeight: '500', color: '#333' },
});
