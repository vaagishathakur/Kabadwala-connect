export const MATERIAL_CATEGORIES = [
  { key: 'CRT', labelKey: 'categories.CRT', icon: 'tv', color: '#E53935' },
  { key: 'LCD', labelKey: 'categories.LCD', icon: 'desktop-mac', color: '#1E88E5' },
  { key: 'PCB', labelKey: 'categories.PCB', icon: 'memory', color: '#43A047' },
  { key: 'Cable', labelKey: 'categories.Cable', icon: 'cable', color: '#FDD835' },
  { key: 'Battery', labelKey: 'categories.Battery', icon: 'battery-alert', color: '#8E24AA' },
  { key: 'Motor', labelKey: 'categories.Motor', icon: 'settings', color: '#546E7A' },
  { key: 'Plastic', labelKey: 'categories.Plastic', icon: 'recycling', color: '#00ACC1' },
  { key: 'Mixed', labelKey: 'categories.Mixed', icon: 'category', color: '#F4511E' },
  { key: 'Other', labelKey: 'categories.Other', icon: 'more-horiz', color: '#757575' }
];

export const CATEGORY_COLORS = MATERIAL_CATEGORIES.reduce((acc, curr) => {
  acc[curr.key] = curr.color;
  return acc;
}, {});

export const CONDITION_OPTIONS = ['Good', 'Damaged', 'Unknown'];
export const SOURCE_OPTIONS = ['Household', 'Commercial', 'Industrial'];
export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer'];

export const SYNC_INTERVAL_MS = 30000;
