import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setLocationError(null);
    } catch (err) {
      setLocationError(err.message);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return { location, locationError, refreshLocation: requestLocation };
};
