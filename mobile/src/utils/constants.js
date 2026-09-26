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

export const CONDITION_OPTIONS = [
  { key: 'Good', label: 'अच्छी स्थिति / Good', icon: 'check-circle' },
  { key: 'Damaged', label: 'खराब / Damaged', icon: 'build' },
  { key: 'Unknown', label: 'सामान्य / Standard', icon: 'help-outline' },
];

export const SOURCE_OPTIONS = [
  { key: 'Household', label: 'घर से / Home', icon: 'home' },
  { key: 'Commercial', label: 'दुकान / Shop', icon: 'store' },
  { key: 'Industrial', label: 'कारखाना / Factory', icon: 'business' },
];
export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer'];

export const SYNC_INTERVAL_MS = 30000;
