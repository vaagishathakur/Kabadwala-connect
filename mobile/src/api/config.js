import { Platform } from 'react-native';

const DEV_IP = '172.19.135.117'; // Machine Wi-Fi IP for physical mobile Expo Go

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || Platform.select({
  web: 'http://localhost:3000/api',
  default: `http://${DEV_IP}:3000/api`,
});

export const ML_SERVICE_URL = process.env.EXPO_PUBLIC_ML_URL || Platform.select({
  web: 'http://localhost:8001/predict',
  default: `http://${DEV_IP}:8001/predict`,
});
