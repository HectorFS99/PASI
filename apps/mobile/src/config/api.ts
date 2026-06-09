import { Platform } from 'react-native';

const DEV_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000/api'
    : 'http://localhost:3000/api';

export const API_BASE_URL = __DEV__
  ? DEV_URL
  : 'https://pasi-o3i4.onrender.com/api';
