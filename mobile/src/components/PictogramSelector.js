import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function PictogramSelector({ categories, onSelect, selected }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={[
            styles.card,
            selected === cat.key && styles.selectedCard,
            { borderColor: selected === cat.key ? '#4CAF50' : '#E0E0E0' }
          ]}
          onPress={() => onSelect(cat.key)}
        >
          <MaterialIcons 
            name={cat.icon} 
            size={40} 
            color={selected === cat.key ? '#4CAF50' : cat.color} 
          />
          <Text style={[
            styles.label,
            selected === cat.key && styles.selectedLabel
          ]}>
            {t(cat.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 10,
  },
  card: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#E8F5E9',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#424242',
    textAlign: 'center',
  },
  selectedLabel: {
    color: '#2E7D32',
    fontWeight: 'bold',
  }
});
