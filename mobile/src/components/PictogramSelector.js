import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function PictogramSelector({ categories, onSelect, selected }) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {categories.map((cat) => {
        const isSelected = selected === cat.key;
        return (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.card,
              isSelected && styles.selectedCard,
              { borderColor: isSelected ? '#1B5E20' : '#E0E0E0' }
            ]}
            onPress={() => onSelect(cat.key)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <View style={styles.checkBadge}>
                <MaterialIcons name="check" size={14} color="#fff" />
              </View>
            )}
            <MaterialIcons 
              name={cat.icon} 
              size={42} 
              color={isSelected ? '#1B5E20' : cat.color} 
            />
            <Text style={[
              styles.label,
              isSelected && styles.selectedLabel
            ]}>
              {t(cat.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
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
    width: '31%',
    aspectRatio: 0.95,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative',
    padding: 6,
  },
  selectedCard: {
    backgroundColor: '#E8F5E9',
    borderColor: '#1B5E20',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1B5E20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  selectedLabel: {
    color: '#1B5E20',
    fontWeight: 'bold',
  }
});
