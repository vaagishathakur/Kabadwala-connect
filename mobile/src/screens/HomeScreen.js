// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Alert, Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getCollectorProfile } from '../db/queries';
import { formatCurrency } from '../utils/formatters';
import OfflineBanner from '../components/OfflineBanner';
import { useSync } from '../hooks/useSync';

const MENU_ITEMS = [
  { key: 'scan',      screen: 'LotCreate',  icon: 'photo-camera',   color: '#0D9488', bgColor: '#F0FDFA', labelKey: 'home.scan'      },
  { key: 'price',     screen: 'PriceBoard', icon: 'attach-money',   color: '#0284C7', bgColor: '#F0F9FF', labelKey: 'home.priceBoard' },
  { key: 'recyclers', screen: 'Recyclers',  icon: 'factory',        color: '#0891B2', bgColor: '#ECFEFF', labelKey: 'home.recyclers'  },
  { key: 'ledger',    screen: 'Ledger',     icon: 'account-balance-wallet', color: '#6366F1', bgColor: '#EEF2FF', labelKey: 'home.ledger' },
  { key: 'safety',    screen: 'Safety',     icon: 'security',       color: '#E11D48', bgColor: '#FFF1F2', labelKey: 'home.safety'    },
];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { isOnline, triggerSync } = useSync();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
    if (isOnline) triggerSync();
  }, [isOnline]);

  const loadProfile = async () => {
    const p = await getCollectorProfile();
    setProfile(p);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0D9488" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>♻️ {t('home.title')}</Text>
          {profile?.display_name && (
            <Text style={styles.headerSubtitle}>नमस्ते, {profile.display_name} 👋</Text>
          )}
        </View>
        <View style={styles.earningsChip}>
          <MaterialIcons name="account-balance-wallet" size={14} color="#fff" />
          <Text style={styles.earningsText}>{formatCurrency(profile?.total_earnings_inr || 0)}</Text>
        </View>
      </View>

      <OfflineBanner visible={!isOnline} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.total_transactions || 0}</Text>
            <Text style={styles.statLabel}>कुल बिक्री</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(profile?.total_earnings_inr || 0)}</Text>
            <Text style={styles.statLabel}>कुल कमाई</Text>
          </View>
        </View>

        {/* Menu Grid */}
        <Text style={styles.sectionTitle}>क्या करना है?</Text>
        <View style={styles.grid}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuCard, { backgroundColor: item.bgColor }]}
              onPress={() => navigation.navigate(item.screen)}
              accessibilityLabel={t(item.labelKey)}
            >
              <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
                <MaterialIcons name={item.icon} size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.menuLabel, { color: item.color }]}>{t(item.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Offline IVR Saathi Toll-Free Dialer */}
        <TouchableOpacity
          style={styles.ivrBanner}
          onPress={() => Linking.openURL('tel:18005222326')}
          accessibilityLabel="Offline Toll-Free IVR Hotline"
        >
          <View style={styles.ivrIconWrap}>
            <MaterialIcons name="phone-in-talk" size={22} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.ivrTitle}>📞 IVR सारथी (बिना इंटरनेट कॉल)</Text>
              <View style={styles.ivrBadge}>
                <Text style={styles.ivrBadgeText}>टोल-फ्री</Text>
              </View>
            </View>
            <Text style={styles.ivrSubtitle}>भाव जानें, माल बेचें व UTR: 1800-522-2326</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#0D9488" />
        </TouchableOpacity>

        {/* Safety Quick Access */}
        <TouchableOpacity
          style={styles.safetyBanner}
          onPress={() => navigation.navigate('Safety')}
        >
          <MaterialIcons name="warning" size={22} color="#BF360C" />
          <Text style={styles.safetyText}>⚡ सुरक्षा जानकारी ज़रूर पढ़ें</Text>
          <MaterialIcons name="chevron-right" size={22} color="#BF360C" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#99F6E4', marginTop: 2 },
  earningsChip: {
    backgroundColor: '#0F766E',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#0D9488' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  menuCard: {
    width: '47%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuLabel: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  safetyBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#BF360C',
  },
  safetyText: { flex: 1, color: '#BF360C', fontWeight: '600', marginLeft: 8 },
  ivrBanner: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#2DD4BF',
    marginBottom: 12,
    elevation: 2,
  },
  ivrIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ivrTitle: { fontSize: 14, fontWeight: '700', color: '#0F766E' },
  ivrBadge: {
    backgroundColor: '#0D9488',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ivrBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  ivrSubtitle: { fontSize: 11, color: '#0F766E', marginTop: 2, fontWeight: '500' },
});
