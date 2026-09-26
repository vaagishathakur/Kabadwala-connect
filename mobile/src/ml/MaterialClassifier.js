import axios from 'axios';
import { Platform } from 'react-native';
import { ML_SERVICE_URL } from '../api/config';
import { MATERIAL_CATEGORIES } from '../utils/constants';

export class MaterialClassifier {
  constructor() {
    this.modelLoaded = false;
  }

  async classify(imageUri) {
    if (!imageUri) return null;
    try {
      const formData = new FormData();

      if (Platform.OS === 'web' && (imageUri.startsWith('blob:') || imageUri.startsWith('data:'))) {
        const resp = await fetch(imageUri);
        const blob = await resp.blob();
        formData.append('file', blob, 'scrap.jpg');
        formData.append('image', blob, 'scrap.jpg');
      } else {
        const fileObj = {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'scrap.jpg',
        };
        formData.append('file', fileObj);
        formData.append('image', fileObj);
      }

      const response = await axios.post(ML_SERVICE_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 6000,
      });

      if (response.data && response.data.category) {
        return {
          category: response.data.category,
          confidence: response.data.confidence || 0.75,
          is_fallback: !!response.data.is_fallback,
          model_type: response.data.model_type || 'cloud_vision',
          classification_method: response.data.classification_method || 'Vision Analysis'
        };
      }
    } catch (error) {
      console.warn('ML Classification API unavailable, defaulting to manual selection:', error.message);
    }
    return null;
  }

  getCategories() {
    return MATERIAL_CATEGORIES;
  }
}

export default new MaterialClassifier();

