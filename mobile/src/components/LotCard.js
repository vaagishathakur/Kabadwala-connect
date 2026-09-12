import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate, formatWeight, getCategoryColor, getCategoryIcon } from '../utils/formatters';

export default function LotCard({ lot, onPress }) {
  const { t } = useTranslation();
  const icon = getCategoryIcon(lot.category);
  const color = getCategoryColor(lot.category);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={32} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{t(`categories.${lot.category}`)}</Text>
        <Text style={styles.subtitle}>
          {formatWeight(lot.approximate_weight_kg)} • {formatDate(lot.created_at)}
        </Text>
        <Text style={styles.price}>{t('lot.estimate')}: {formatCurrency(lot.estimated_value_inr)}</Text>
      </View>
      <View style={styles.status}>
        <MaterialIcons 
          name={lot.synced ? "cloud-done" : "schedule"} 
          size={20} 
          color={lot.synced ? "#4CAF50" : "#FF9800"} 
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  price: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '500',
    marginTop: 4,
  },
  status: {
    padding: 8,
  }
});
