// src/screens/RecyclerMatchScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client';
import { getNearbyRecyclers, addToSyncQueue } from '../db/queries';
import RecyclerCard from '../components/RecyclerCard';
import OfflineBanner from '../components/OfflineBanner';
import { useLocation } from '../hooks/useLocation';
import { useSync } from '../hooks/useSync';
import { v4 as uuidv4 } from 'uuid';

export default function RecyclerMatchScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { isOnline } = useSync();
  const { location } = useLocation();
  const lotId = route.params?.lot_id;

  const [recyclers, setRecyclers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('match'); // 'match' | 'distance' | 'rate'

  useEffect(() => { fetchRecyclers(); }, [location]);

  const fetchRecyclers = async () => {
    setLoading(true);
    try {
      if (isOnline && location) {
        // API-based matching
        const params = lotId
          ? `/recyclers/match?lot_id=${lotId}&collector_lat=${location.coords.latitude}&collector_lng=${location.coords.longitude}`
          : `/recyclers?lat=${location.coords.latitude}&lng=${location.coords.longitude}&radius_km=80`;

        const res = await api.get(params, { timeout: 10000 });
        const data = res.data?.matched_recyclers || res.data?.recyclers || [];
        setRecyclers(data);
        return;
      }
    } catch { /* fall through */ }

    // Offline: load cached recyclers
    const cached = await getNearbyRecyclers(null);
    setRecyclers(cached || []);
    setLoading(false);
  };

  const sorted = [...recyclers].sort((a, b) => {
    if (sortBy === 'distance') return (a.distance_km || 999) - (b.distance_km || 999);
    if (sortBy === 'rate') return (b.offered_rate_for_category || 0) - (a.offered_rate_for_category || 0);
    return (b.match_score || 0) - (a.match_score || 0);
  });

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Could not open dialer'));
  };

  const handleRequestPickup = async (recycler) => {
    Alert.alert(
      'पिकअप मांगें?',
      `${recycler.name} से पिकअप मांगें?`,
      [
        { text: 'रद्द करें', style: 'cancel' },
        {
          text: 'हाँ, मांगें',
          onPress: async () => {
            const txId = uuidv4();
            const tx = {
              id: txId, lot_id: lotId, recycler_id: recycler.id,
              material_category: 'Mixed',
              total_weight_kg: 1,
              quoted_price_inr: recycler.offered_rate_for_category || 0,
              payment_mode: 'Cash',
              payment_status: 'Pending',
              transaction_status: 'Matched',
              collection_datetime: new Date().toISOString(),
              collection_lat: location?.coords?.latitude,
              collection_lng: location?.coords?.longitude,
              synced: 0,
            };
            await addToSyncQueue('transaction', 'create', tx);
            Alert.alert('✅ भेजा गया!', 'रिसाइकलर को आपका अनुरोध भेज दिया गया है।\n\nजब वो स्वीकार करें तब आपको सूचना मिलेगी।');
            navigation.navigate('Ledger');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏭 {t('recycler.nearby')}</Text>
        {!isOnline && <MaterialIcons name="wifi-off" size={20} color="#ffcdd2" />}
      </View>

      <OfflineBanner visible={!isOnline} />

      {/* Sort bar */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>क्रम:</Text>
        {[['match', 'बेस्ट मैच'], ['distance', 'दूरी'], ['rate', 'भाव']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.sortBtn, sortBy === key && styles.sortBtnActive]}
            onPress={() => setSortBy(key)}
          >
            <Text style={[styles.sortBtnText, sortBy === key && styles.sortBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 40 }} />
        : (
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RecyclerCard
                recycler={item}
                onCall={() => handleCall(item.contact_phone)}
                onRequest={() => handleRequestPickup(item)}
              />
            )}
            contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialIcons name="location-off" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  {isOnline ? 'पास में कोई रिसाइकलर नहीं मिला' : 'ऑफलाइन — कनेक्ट होने पर खोजें'}
                </Text>
              </View>
            }
          />
        )
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#1B5E20', padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  sortBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  sortLabel: { fontSize: 13, color: '#666', marginRight: 4 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
  sortBtnActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  sortBtnText: { fontSize: 13, color: '#555' },
  sortBtnTextActive: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#999', marginTop: 12, textAlign: 'center' },
});
