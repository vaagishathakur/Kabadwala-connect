import axios from 'axios';
import { ML_SERVICE_URL } from '../api/config';
import { MATERIAL_CATEGORIES } from '../utils/constants';

class MaterialClassifier {
  constructor() {
    this.modelLoaded = false;
    // TFLite setup can go here if fully local. Using API for fallback as requested.
  }

  async classify(imageUri) {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });

      const response = await axios.post(ML_SERVICE_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000,
      });

      if (response.data && response.data.category) {
        return {
          category: response.data.category,
          confidence: response.data.confidence || 0.85
        };
      }
    } catch (error) {
      console.warn('ML Classification failed:', error.message);
    }
    return null;
  }

  getCategories() {
    return MATERIAL_CATEGORIES;
  }
}

export default new MaterialClassifier();
