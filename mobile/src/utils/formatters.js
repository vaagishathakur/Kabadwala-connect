import { MATERIAL_CATEGORIES } from './constants';

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹ 0';
  return `₹ ${Number(amount).toLocaleString('en-IN')}`;
};

export const formatDate = (ts) => {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatWeight = (kg) => {
  if (kg === undefined || kg === null) return '0 kg';
  return `${Number(kg).toFixed(1)} kg`;
};

export const formatDistance = (km) => {
  if (km === undefined || km === null) return '0 km';
  return `${Number(km).toFixed(1)} km`;
};

export const getCategoryIcon = (categoryKey) => {
  const cat = MATERIAL_CATEGORIES.find(c => c.key === categoryKey);
  return cat ? cat.icon : 'category';
};

export const getCategoryColor = (categoryKey) => {
  const cat = MATERIAL_CATEGORIES.find(c => c.key === categoryKey);
  return cat ? cat.color : '#757575';
};
