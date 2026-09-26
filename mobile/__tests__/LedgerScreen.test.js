import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import LedgerScreen from '../src/screens/LedgerScreen';
import { getTransactions } from '../src/db/queries';
import { api } from '../src/api/client';
import { useSync } from '../src/hooks/useSync';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

jest.mock('../src/db/queries', () => ({
  getTransactions: jest.fn(),
}));

jest.mock('../src/api/client', () => ({
  api: { get: jest.fn() },
}));

jest.mock('../src/hooks/useSync', () => ({
  useSync: jest.fn(),
}));

describe('LedgerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches API transactions when online', async () => {
    useSync.mockReturnValue({ isOnline: true });
    api.get.mockResolvedValue({
      data: {
        transactions: [],
        summary: { total_earned_inr: 450, pending_inr: 0 },
      },
    });

    const { getByText } = render(<LedgerScreen />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/transactions?limit=50', expect.any(Object));
      expect(getByText('₹ 450')).toBeTruthy();
    });
  });

  test('falls back to SQLite when offline', async () => {
    useSync.mockReturnValue({ isOnline: false });
    getTransactions.mockResolvedValue([]);

    const { getByText } = render(<LedgerScreen />);

    await waitFor(() => {
      expect(getTransactions).toHaveBeenCalled();
      // Empty text logic handles this
      expect(getByText('इस महीने कोई लेनदेन नहीं')).toBeTruthy();
    });
  });
});
