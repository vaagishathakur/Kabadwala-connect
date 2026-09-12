// src/screens/HandoverScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Share, Alert, ScrollView, ActivityIndicator, Dimensions
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';

const { width } = Dimensions.get('window');

export default function HandoverScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { handover_reference, lot, transaction_id, qr_data: initialQrData } = route.params || {};
  const [status, setStatus] = useState('pending'); // 'pending' | 'confirmed'
  const [confirmedData, setConfirmedData] = useState(null);
  const [polling, setPolling] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [dynamicQrToken, setDynamicQrToken] = useState(initialQrData || null);
  const pollRef = useRef(null);

  useEffect(() => {
    // Attempt to generate cryptographic time-expiring QR token if lot.id is present
    if (lot?.id && !dynamicQrToken) {
      api.post(`/lots/${lot.id}/generate-qr`)
        .then((res) => {
          if (res.data?.qr_data) {
            setDynamicQrToken(res.data.qr_data);
          }
        })
        .catch(() => {
          // Fallback to reference QR
        });
    }

    if (handover_reference) startPolling();
    return () => clearInterval(pollRef.current);
  }, [handover_reference, lot]);

  const startPolling = () => {
    pollRef.current = setInterval(checkStatus, 15000); // Poll every 15s
  };

  const checkStatus = async () => {
    if (!handover_reference) return;
    setPolling(true);
    try {
      const res = await api.get(`/handover/${handover_reference}`, { timeout: 5000 });
      if (res.data?.handover?.recycler_confirmed) {
        setStatus('confirmed');
        setConfirmedData(res.data.handover);
        clearInterval(pollRef.current);
      }
    } catch { /* Silently ignore offline */ }
    setPolling(false);
  };

  const shareReference = async () => {
    await Share.share({
      message: `KabadConnect Handover Reference: ${handover_reference}\nCPCB E-Waste Traceability: https://kabadconnect.in/verify/${handover_reference}`,
      title: 'Handover Reference',
    });
  };

  const activeQrPayload = dynamicQrToken || (
    handover_reference
      ? `${handover_reference}|${transaction_id || lot?.id || ''}|${new Date().toISOString()}`
      : 'NO_REFERENCE'
  );

  if (!handover_reference && !lot) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={48} color="#BF360C" />
          <Text style={styles.errorText}>No handover reference or lot found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← वापस जाएं</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'confirmed') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={80} color="#2E7D32" />
          </View>
          <Text style={styles.successTitle}>✅ हस्तांतरण पूर्ण!</Text>
          <Text style={styles.successSub}>Handover Verified & EPR Certified</Text>

          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>📋 CPCB E-Waste रसीद / Receipt</Text>
            <ReceiptRow label="Reference" value={handover_reference || '—'} />
            <ReceiptRow label="प्रमाणित वज़न / Net Weight" value={`${confirmedData?.weight_at_handover_kg || '—'} kg`} />
            <ReceiptRow label="स्थिति / Status" value="CPCB Verified" />
            <ReceiptRow label="समय / Timestamp" value={new Date(confirmedData?.recycler_confirm_time || Date.now()).toLocaleString('hi-IN')} />
          </View>

          <TouchableOpacity style={styles.shareBtn} onPress={shareReference}>
            <MaterialIcons name="share" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>रसीद शेयर करें</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeBtnText}>🏠 होम पर जाएं</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, highContrast && styles.highContrastBg]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, highContrast && styles.highContrastText]}>📋 {t('handover.title')}</Text>
        <Text style={[styles.subtitle, highContrast && styles.highContrastSub]}>{t('handover.qrScan')}</Text>

        {/* High-Contrast Full-Width QR Code Container */}
        <View style={[styles.qrContainer, highContrast && styles.highContrastQr]}>
          <QRCode
            value={activeQrPayload}
            size={Math.min(width - 80, 240)}
            color={highContrast ? "#000000" : "#1B5E20"}
            backgroundColor="#ffffff"
          />
        </View>

        {/* Outdoor High-Contrast Toggle Button */}
        <TouchableOpacity
          style={[styles.contrastToggle, highContrast && styles.contrastToggleActive]}
          onPress={() => setHighContrast(!highContrast)}
        >
          <MaterialIcons name="wb-sunny" size={18} color={highContrast ? "#000" : "#1B5E20"} />
          <Text style={[styles.contrastToggleText, highContrast && { color: '#000' }]}>
            {highContrast ? "सामान्य मोड (Normal Mode)" : "धूप/आउटडोर मोड (High-Contrast Mode)"}
          </Text>
        </TouchableOpacity>

        {/* Reference Code */}
        <View style={styles.refBox}>
          <Text style={[styles.refLabel, highContrast && styles.highContrastSub]}>{t('handover.reference')}</Text>
          <Text style={[styles.refCode, highContrast && styles.highContrastCode]}>{handover_reference || 'SCAN QR'}</Text>
          <Text style={[styles.refHint, highContrast && styles.highContrastSub]}>यह कोड रिसाइकलर को दिखाएं / Show to Recycler</Text>
        </View>

        {/* Lot summary */}
        {lot && (
          <View style={[styles.lotSummary, highContrast && styles.highContrastCard]}>
            <Text style={[styles.lotSummaryTitle, highContrast && styles.highContrastText]}>सामान की जानकारी / Lot Summary</Text>
            <Text style={[styles.lotDetail, highContrast && styles.highContrastText]}>श्रेणी: {lot.category} ({lot.cpcb_code || 'ITEW1'})</Text>
            <Text style={[styles.lotDetail, highContrast && styles.highContrastText]}>अनुमानित वज़न: {lot.approximate_weight_kg} kg</Text>
            {lot.estimated_value_inr && (
              <Text style={[styles.lotDetail, highContrast && styles.highContrastText]}>अनुमानित मूल्य: ₹{lot.estimated_value_inr}</Text>
            )}
          </View>
        )}

        {/* Waiting status */}
        <View style={styles.waitingBox}>
          {polling ? <ActivityIndicator size="small" color="#1B5E20" /> : <MaterialIcons name="hourglass-empty" size={24} color="#FF9800" />}
          <Text style={styles.waitingText}>रिसाइकलर की पुष्टि का इंतज़ार... (Waiting for Scan)</Text>
        </View>

        <TouchableOpacity style={styles.checkBtn} onPress={checkStatus}>
          <Text style={styles.checkBtnText}>🔄 स्थिति जाँचें / Refresh Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareBtn} onPress={shareReference}>
          <MaterialIcons name="share" size={20} color="#fff" />
          <Text style={styles.shareBtnText}>Reference शेयर करें</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReceiptRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
      <Text style={{ color: '#666', fontSize: 14 }}>{label}</Text>
      <Text style={{ color: '#333', fontWeight: 'bold', fontSize: 14 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  highContrastBg: { backgroundColor: '#FFFFFF' },
  content: { padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  highContrastText: { color: '#000000', fontWeight: 'bold' },
  highContrastSub: { color: '#222222' },
  qrContainer: {
    backgroundColor: '#fff', padding: 20, borderRadius: 16, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
    marginBottom: 16,
  },
  highContrastQr: {
    borderWidth: 4, borderColor: '#000', borderRadius: 8, elevation: 0,
  },
  contrastToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#E8F5E9', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    marginBottom: 16,
  },
  contrastToggleActive: {
    backgroundColor: '#FFEB3B', borderWidth: 1, borderColor: '#FBC02D',
  },
  contrastToggleText: { fontSize: 13, color: '#1B5E20', fontWeight: '600' },
  refBox: { alignItems: 'center', marginBottom: 16 },
  refLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  refCode: { fontSize: 36, fontWeight: 'bold', color: '#1B5E20', letterSpacing: 6 },
  highContrastCode: { color: '#000000' },
  refHint: { fontSize: 12, color: '#999', marginTop: 4 },
  lotSummary: {
    width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 16, elevation: 1,
  },
  highContrastCard: {
    borderWidth: 2, borderColor: '#000', backgroundColor: '#FFF',
  },
  lotSummaryTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  lotDetail: { fontSize: 14, color: '#555', marginBottom: 4 },
  waitingBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8E1', padding: 12, borderRadius: 10, marginBottom: 14, width: '100%',
  },
  waitingText: { color: '#F57F17', fontWeight: '600', fontSize: 13 },
  checkBtn: {
    backgroundColor: '#E8F5E9', borderRadius: 10, paddingVertical: 12,
    paddingHorizontal: 24, marginBottom: 10, width: '100%', alignItems: 'center',
  },
  checkBtnText: { color: '#1B5E20', fontWeight: '600', fontSize: 15 },
  shareBtn: {
    backgroundColor: '#1B5E20', borderRadius: 10, paddingVertical: 14,
    paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', justifyContent: 'center',
  },
  shareBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorText: { color: '#BF360C', fontSize: 16, marginTop: 12 },
  backLink: { color: '#1B5E20', marginTop: 16, fontSize: 15 },
  successContainer: { padding: 24, alignItems: 'center' },
  successIcon: { marginBottom: 16, marginTop: 24 },
  successTitle: { fontSize: 26, fontWeight: 'bold', color: '#2E7D32', marginBottom: 4 },
  successSub: { fontSize: 15, color: '#666', marginBottom: 20 },
  receiptCard: { width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, elevation: 2, width: '100%' },
  receiptTitle: { fontSize: 15, fontWeight: 'bold', color: '#1B5E20', marginBottom: 12 },
  homeBtn: {
    marginTop: 10, backgroundColor: '#E8F5E9', borderRadius: 10, paddingVertical: 14,
    width: '100%', alignItems: 'center',
  },
  homeBtnText: { color: '#1B5E20', fontWeight: '600', fontSize: 15 },
});
