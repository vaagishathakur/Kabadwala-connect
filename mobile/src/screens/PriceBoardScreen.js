// src/screens/PriceBoardScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useTranslation } from 'react-i18next';
import { getPriceBoard, cachePrices } from '../db/queries';
import { api } from '../api/client';
import OfflineBanner from '../components/OfflineBanner';
import PriceCard from '../components/PriceCard';
import { useSync } from '../hooks/useSync';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PriceBoardScreen() {
  const { t, i18n } = useTranslation();
  const { isOnline } = useSync();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const lang = i18n.language;

  const loadPrices = useCallback(async (force = false) => {
    try {
      // Try fetching from API if online
      if (isOnline || force) {
        const city = (await AsyncStorage.getItem('operating_city')) || 'Mumbai';
        const res = await api.get(`/prices/board?city=${city}`, { timeout: 8000 });
        if (res.data?.prices) {
          setPrices(res.data.prices);
          setLastUpdated(new Date());
          // Cache for offline use
          await cachePrices(res.data.prices);
          return;
        }
      }
    } catch { /* Fall through to local cache */ }

    // Load from local SQLite cache
    const cached = await getPriceBoard();
    if (cached) setPrices(cached);
    setLoading(false);
  }, [isOnline]);

  useEffect(() => {
    loadPrices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPrices(true);
    setRefreshing(false);
  };

  const speakAllPrices = () => {
    if (speaking) { Speech.stop(); setSpeaking(false); return; }
    setSpeaking(true);

    const sentences = prices
      .filter((p) => p.avg_price_inr)
      .map((p) => {
        const name = lang === 'mr' ? p.label_mr : p.label_hi;
        const price = p.avg_price_inr;
        return lang === 'mr'
          ? `${name} चा भाव आहे किलोमागे ${price} रुपये.`
          : `${name} का भाव है प्रति किलो ${price} रुपये.`;
      })
      .join(' ');

    Speech.speak(sentences, {
      language: lang === 'mr' ? 'mr-IN' : 'hi-IN',
      rate: 0.9,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  };

  const speakPrice = (price) => {
    const name = lang === 'mr' ? price.label_mr : price.label_hi;
    const rate = price.avg_price_inr || '—';
    const text = lang === 'mr'
      ? `${name} चा भाव ${rate} रुपये प्रति किलो आहे.`
      : `${name} का भाव ${rate} रुपये प्रति किलो है.`;
    Speech.speak(text, { language: lang === 'mr' ? 'mr-IN' : 'hi-IN', rate: 0.9 });
  };

  if (loading && !prices.length) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1B5E20" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💰 {t('prices.board')}</Text>
          {lastUpdated && (
            <Text style={styles.headerSub}>
              Updated: {lastUpdated.toLocaleTimeString('hi-IN')}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.speakAllBtn} onPress={speakAllPrices}>
          <MaterialIcons name={speaking ? 'stop' : 'volume-up'} size={20} color="#fff" />
          <Text style={styles.speakAllText}>{t('prices.speak')}</Text>
        </TouchableOpacity>
      </View>

      <OfflineBanner visible={!isOnline} />

      <FlatList
        data={prices}
        keyExtractor={(item) => item.category}
        renderItem={({ item }) => (
          <PriceCard
            category={item.category}
            price={item.avg_price_inr}
            trend={item.trend}
            trendPct={item.trend_pct}
            unit={item.unit || 'kg'}
            labelHi={item.label_hi}
            labelMr={item.label_mr}
            range={item.market_range}
            onSpeak={() => speakPrice(item)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="wifi-off" size={48} color="#ccc" />
            <Text style={styles.emptyText}>कोई डेटा नहीं — कनेक्ट होने पर अपडेट होगा</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#1B5E20', paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 11, color: '#A5D6A7', marginTop: 2 },
  speakAllBtn: {
    backgroundColor: '#388E3C', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  speakAllText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  list: { padding: 12, paddingBottom: 32 },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { color: '#999', marginTop: 12, textAlign: 'center', fontSize: 14 },
});
