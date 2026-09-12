// src/screens/LedgerScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, SafeAreaView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getTransactions } from '../db/queries';
import { api } from '../api/client';
import TransactionCard from '../components/TransactionCard';
import { formatCurrency } from '../utils/formatters';
import { useSync } from '../hooks/useSync';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function LedgerScreen() {
  const { t } = useTranslation();
  const { isOnline } = useSync();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ total_earned_inr: 0, pending_inr: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());

  const load = useCallback(async () => {
    try {
      if (isOnline) {
        const res = await api.get('/transactions?limit=50', { timeout: 8000 });
        if (res.data?.transactions) {
          setTransactions(res.data.transactions);
          setSummary(res.data.summary || { total_earned_inr: 0, pending_inr: 0 });
          setLoading(false);
          return;
        }
      }
    } catch { /* fall through */ }

    // Offline: local SQLite
    const local = await getTransactions(null);
    setTransactions(local || []);
    setLoading(false);
  }, [isOnline]);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  // Filter by selected month
  const filtered = transactions.filter((tx) => {
    const d = new Date(tx.collection_datetime || tx.createdAt);
    return d.getMonth() === activeMonth;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with totals */}
      <View style={styles.header}>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>{t('ledger.total')}</Text>
          <Text style={styles.earningsAmount}>{formatCurrency(summary.total_earned_inr)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.earningsBox}>
          <Text style={[styles.earningsLabel, { color: '#FFCC80' }]}>{t('ledger.pending')}</Text>
          <Text style={[styles.earningsAmount, { color: '#FFCC80' }]}>{formatCurrency(summary.pending_inr)}</Text>
        </View>
      </View>

      {/* Month filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={MONTHS}
        keyExtractor={(m) => m}
        style={styles.monthBar}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.monthChip, activeMonth === index && styles.monthChipActive]}
            onPress={() => setActiveMonth(index)}
          >
            <Text style={[styles.monthText, activeMonth === index && styles.monthTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Transaction list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionCard transaction={item} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1B5E20']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={48} color="#ccc" />
            <Text style={styles.emptyText}>इस महीने कोई लेनदेन नहीं</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#1B5E20', paddingVertical: 20, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  earningsBox: { alignItems: 'center', flex: 1 },
  earningsLabel: { fontSize: 13, color: '#A5D6A7', marginBottom: 4 },
  earningsAmount: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  divider: { width: 1, height: 40, backgroundColor: '#388E3C' },
  monthBar: { backgroundColor: '#fff', paddingVertical: 10, maxHeight: 56, borderBottomWidth: 1, borderBottomColor: '#eee' },
  monthChip: { paddingHorizontal: 16, paddingVertical: 6, marginHorizontal: 4, borderRadius: 16, borderWidth: 1, borderColor: '#ddd' },
  monthChipActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  monthText: { color: '#555', fontSize: 13 },
  monthTextActive: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#999', marginTop: 12, textAlign: 'center' },
});
