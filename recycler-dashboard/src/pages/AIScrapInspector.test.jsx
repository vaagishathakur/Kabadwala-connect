import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AIScrapInspector from './AIScrapInspector';
import { vi } from 'vitest';
import axios from 'axios';

// Mock language and API
vi.mock('../i18n/LanguageContext', () => ({
  useLanguage: () => ({ t: (k, def) => def })
}));
vi.mock('axios', () => ({
  default: {
    post: vi.fn()
  }
}));

// Mock the internal API client so it doesn't try to invoke axios.create
vi.mock('../api/client', () => ({
  api: {
    post: vi.fn()
  }
}));

describe('AIScrapInspector Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls ML proxy endpoint when component mounts', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        category: 'PCB',
        cpcb_code: 'ITEW1',
        name: 'High-Grade Printed Circuit Board (Telecom/Motherboard)',
        confidence: 0.94,
        confidence_percentage: '94.0%',
        precious_metals: { Copper: '19.2%' },
        hazardous_elements: ['Lead'],
        safety_advisory: 'Hazardous lead dust',
        estimated_rate_inr_kg: 450.0,
      }
    });

    render(
      <MemoryRouter>
        <AIScrapInspector />
      </MemoryRouter>
    );

    await waitFor(() => {
      // The component immediately analyzes the 'PCB' preset on mount
      expect(axios.post).toHaveBeenCalledWith('/ml/predict/vision', { preset: 'PCB' });
    });

    // Check that the returned data is shown
    await waitFor(() => {
      expect(screen.getByText('High-Grade Printed Circuit Board (Telecom/Motherboard)')).toBeInTheDocument();
      expect(screen.getByText('ITEW1')).toBeInTheDocument();
    });
  });
});
