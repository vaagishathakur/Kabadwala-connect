import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency, getCategoryColor, getCategoryIcon } from '../utils/formatters';

export default function PriceCard({ category, price, trend, unit, onSpeak }) {
  const { t } = useTranslation();
  const icon = getCategoryIcon(category);
  const color = getCategoryColor(category);
  
  const getTrendIcon = () => {
    if (trend === 'up') return { name: 'arrow-upward', color: '#4CAF50' };
    if (trend === 'down') return { name: 'arrow-downward', color: '#F44336' };
    return { name: 'arrow-forward', color: '#9E9E9E' };
  };

  const trendData = getTrendIcon();

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialIcons name={icon} size={32} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{t(`categories.${category}`)}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(price)}</Text>
          <Text style={styles.unit}>/ {unit || 'kg'}</Text>
          <MaterialIcons name={trendData.name} size={16} color={trendData.color} style={styles.trend} />
        </View>
      </View>
      <TouchableOpacity style={styles.speakButton} onPress={onSpeak}>
        <MaterialIcons name="volume-up" size={24} color="#0D9488" />
      </TouchableOpacity>
    </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B5E20',
  },
  unit: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 4,
  },
  trend: {
    marginLeft: 8,
  },
  speakButton: {
    padding: 8,
  }
});
