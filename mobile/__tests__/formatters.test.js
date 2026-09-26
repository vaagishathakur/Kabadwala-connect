import { formatCurrency, formatWeight, formatDistance } from '../src/utils/formatters';

describe('Collector Mobile App Formatters', () => {
  test('formatCurrency formats Indian rupee amounts', () => {
    expect(formatCurrency(1377)).toBe('₹ 1,377');
    expect(formatCurrency(0)).toBe('₹ 0');
    expect(formatCurrency(null)).toBe('₹ 0');
  });

  test('formatWeight formats kilograms with 1 decimal place', () => {
    expect(formatWeight(14.5)).toBe('14.5 kg');
    expect(formatWeight(10)).toBe('10.0 kg');
    expect(formatWeight(null)).toBe('0 kg');
  });

  test('formatDistance formats kilometers', () => {
    expect(formatDistance(2.4)).toBe('2.4 km');
    expect(formatDistance(null)).toBe('0 km');
  });
});
