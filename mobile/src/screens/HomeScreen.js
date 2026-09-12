// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getCollectorProfile } from '../db/queries';
import { formatCurrency } from '../utils/formatters';
import OfflineBanner from '../components/OfflineBanner';
import { useSync } from '../hooks/useSync';

const MENU_ITEMS = [
  { key: 'scan',      screen: 'LotCreate',  icon: 'photo-camera',   color: '#1B5E20', bgColor: '#E8F5E9', labelKey: 'home.scan'      },
  { key: 'price',     screen: 'PriceBoard', icon: 'attach-money',   color: '#E65100', bgColor: '#FFF3E0', labelKey: 'home.priceBoard' },
  { key: 'recyclers', screen: 'Recyclers',  icon: 'factory',        color: '#1565C0', bgColor: '#E3F2FD', labelKey: 'home.recyclers'  },
  { key: 'ledger',    screen: 'Ledger',     icon: 'account-balance-wallet', color: '#6A1B9A', bgColor: '#F3E5F5', labelKey: 'home.ledger' },
  { key: 'safety',    screen: 'Safety',     icon: 'security',       color: '#BF360C', bgColor: '#FBE9E7', labelKey: 'home.safety'    },
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
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#A5D6A7', marginTop: 2 },
  earningsChip: {
    backgroundColor: '#388E3C',
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
    elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
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
});
