// src/navigation/MainTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import HomeScreen from '../screens/HomeScreen';
import PriceBoardScreen from '../screens/PriceBoardScreen';
import RecyclerMatchScreen from '../screens/RecyclerMatchScreen';
import LedgerScreen from '../screens/LedgerScreen';
import SafetyScreen from '../screens/SafetyScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',       component: HomeScreen,         icon: 'home',                    labelKey: 'home.title'      },
  { name: 'PriceBoard', component: PriceBoardScreen,   icon: 'attach-money',            labelKey: 'home.priceBoard' },
  { name: 'Recyclers',  component: RecyclerMatchScreen, icon: 'factory',               labelKey: 'home.recyclers'  },
  { name: 'Ledger',     component: LedgerScreen,        icon: 'account-balance-wallet', labelKey: 'home.ledger'    },
  { name: 'Safety',     component: SafetyScreen,        icon: 'security',               labelKey: 'home.safety'    },
];

export default function MainTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tab = TABS.find((t) => t.name === route.name);
        return {
          headerShown: false,
          tabBarActiveTintColor: '#0D9488',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            paddingBottom: 4,
            paddingTop: 4,
            height: 60,
            elevation: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name={tab?.icon || 'home'} size={size} color={color} />
          ),
          tabBarLabel: tab ? t(tab.labelKey).split(' ')[0] : route.name,
        };
      }}
    >
      {TABS.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}
