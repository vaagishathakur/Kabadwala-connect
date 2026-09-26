// src/navigation/AppNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import LotCreateScreen from '../screens/LotCreateScreen';
import HandoverScreen from '../screens/HandoverScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="LanguageSelect"
      screenOptions={{
        headerStyle: { backgroundColor: '#0D9488', elevation: 0, shadowOpacity: 0 },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        cardStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen
        name="LanguageSelect"
        component={LanguageSelectScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LotCreate"
        component={LotCreateScreen}
        options={{ title: 'नया लॉट बनाएं', headerBackTitle: 'वापस' }}
      />
      <Stack.Screen
        name="Handover"
        component={HandoverScreen}
        options={{ title: 'माल सौंपना', headerBackTitle: 'वापस' }}
      />
    </Stack.Navigator>
  );
}
