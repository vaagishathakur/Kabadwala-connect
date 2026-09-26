import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SafetyScreen from '../src/screens/SafetyScreen';
import * as Speech from 'expo-speech';
import { Linking } from 'react-native';

// Mock translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'hi' },
  }),
}));

// Mock Linking
jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

describe('SafetyScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders safety header and cards', () => {
    const { getByText, getAllByText } = render(<SafetyScreen />);
    
    expect(getByText('safety.title')).toBeTruthy();
    expect(getByText('तार मत जलाएं!')).toBeTruthy();
    expect(getByText('पुराना टीवी मत तोड़ें!')).toBeTruthy();
  });

  test('triggers emergency call', () => {
    const { getByText } = render(<SafetyScreen />);
    const callButtonText = getByText('112 पर कॉल करें');
    
    fireEvent.press(callButtonText);
    expect(Linking.openURL).toHaveBeenCalledWith('tel:112');
  });
});
