import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function OfflineBanner({ visible }) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="wifi-off" size={16} color="#B71C1C" />
      <Text style={styles.text}>{t('common.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF9C4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: '#B71C1C',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  }
});
