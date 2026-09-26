import { render, screen, waitFor } from '@testing-library/react';
import EPRReports from './EPRReports';
import { vi } from 'vitest';
import { api } from '../api/client';

// Mock language context
vi.mock('../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k, def) => def })
}));

// Mock the API client
vi.mock('../api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

describe('EPRReports Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state initially and then shows empty logs message', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/epr/summary') {
        return Promise.resolve({ data: { total_records: 0, by_cpcb_code: [] } });
      }
      if (url === '/epr/logs?limit=25') {
        return Promise.resolve({ data: { logs: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<EPRReports />);

    // Assert that a message for no records is displayed after loading
    await waitFor(() => {
      expect(screen.getByText(/No verified EPR handover records found yet/i)).toBeInTheDocument();
    });
  });

  test('displays summary KPIs when data is fetched', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/epr/summary') {
        return Promise.resolve({
          data: {
            total_records: 150,
            total_weight_kg: 5000,
            total_payout_inr: 250000,
            by_cpcb_code: []
          }
        });
      }
      if (url === '/epr/logs?limit=25') {
        return Promise.resolve({ data: { logs: [] } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<EPRReports />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
    });
  });
});
