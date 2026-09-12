import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatDistance, getCategoryIcon } from '../utils/formatters';

export default function RecyclerCard({ recycler, onCall, onRequest, distance }) {
  const { t } = useTranslation();
  let materials = [];
  try {
    materials = typeof recycler.materials_accepted === 'string' 
      ? JSON.parse(recycler.materials_accepted || '[]')
      : recycler.materials_accepted;
  } catch (e) {}

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{recycler.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{formatDistance(distance)}</Text>
        </View>
      </View>
      
      <View style={styles.badgesRow}>
        <View style={[styles.chip, { backgroundColor: '#E3F2FD' }]}>
          <MaterialIcons name="verified" size={14} color="#1976D2" />
          <Text style={[styles.chipText, { color: '#1976D2' }]}>{recycler.authorization_status}</Text>
        </View>
        {recycler.pickup_available === 1 && (
          <View style={[styles.chip, { backgroundColor: '#E8F5E9' }]}>
            <MaterialIcons name="local-shipping" size={14} color="#388E3C" />
            <Text style={[styles.chipText, { color: '#388E3C' }]}>Pickup</Text>
          </View>
        )}
      </View>

      <View style={styles.materials}>
        {materials.slice(0, 5).map((mat, i) => (
          <MaterialIcons key={i} name={getCategoryIcon(mat)} size={20} color="#757575" style={styles.matIcon} />
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtnOutline} onPress={onCall}>
          <MaterialIcons name="call" size={20} color="#1B5E20" />
          <Text style={styles.actionBtnOutlineText}>{t('recycler.call')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnFilled} onPress={onRequest}>
          <Text style={styles.actionBtnFilledText}>{t('recycler.request')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badge: {
    backgroundColor: '#EEEEEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#424242',
    fontWeight: 'bold',
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  materials: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  matIcon: {
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1B5E20',
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
  },
  actionBtnOutlineText: {
    color: '#1B5E20',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionBtnFilled: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B5E20',
    borderRadius: 8,
    paddingVertical: 10,
    marginLeft: 8,
  },
  actionBtnFilledText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
