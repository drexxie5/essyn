import { useState, useCallback, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  loading: boolean;
  error: string | null;
  isNigeria: boolean;
}

interface UseGeolocationOptions {
  autoFetch?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const { autoFetch = false } = options;
  
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    city: null,
    state: null,
    loading: false,
    error: null,
    isNigeria: false,
  });

  const fetchLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocation is not supported by your browser" }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get city/state
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`
          );
          const data = await response.json();
          
          const isNigeria = data.address?.country_code === "ng";
          const city = data.address?.city || data.address?.town || data.address?.village || null;
          const stateValue = data.address?.state || null;
          
          setState({
            latitude,
            longitude,
            city,
            state: stateValue,
            loading: false,
            error: isNigeria ? null : "SinglezConnect is only available in Nigeria",
            isNigeria,
          });
        } catch (error) {
          console.error("Geocoding error:", error);
          setState(prev => ({
            ...prev,
            latitude,
            longitude,
            loading: false,
            error: "Failed to get location details",
          }));
        }
      },
      (error) => {
        let errorMessage = "Failed to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Please enable location access to find singles near you";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchLocation();
    }
  }, [autoFetch, fetchLocation]);

  return {
    ...state,
    fetchLocation,
    hasLocation: state.latitude !== null && state.longitude !== null,
  };
};
