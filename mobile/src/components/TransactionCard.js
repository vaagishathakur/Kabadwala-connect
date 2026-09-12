import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, formatWeight, getCategoryIcon } from '../utils/formatters';

export default function TransactionCard({ transaction }) {
  const { t } = useTranslation();
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'disputed': return '#F44336';
      default: return '#757575';
    }
  };

  const statusColor = getStatusColor(transaction.payment_status);

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name={getCategoryIcon(transaction.material_category)} size={24} color="#555" />
        </View>
        <View>
          <Text style={styles.catName}>{t(`categories.${transaction.material_category}`)}</Text>
          <Text style={styles.date}>{formatDate(transaction.collection_datetime)}</Text>
          <Text style={styles.weight}>{formatWeight(transaction.total_weight_kg)}</Text>
        </View>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.amount}>{formatCurrency(transaction.final_price_inr)}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {transaction.payment_status || t('ledger.pending')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 1,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 24,
    marginRight: 12,
  },
  catName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  weight: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginBottom: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  }
});
