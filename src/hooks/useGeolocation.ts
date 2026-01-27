import { useState, useCallback, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  city: string | null;  // Town/City/Village
  state: string | null; // State
  fullLocation: string | null; // Combined "City, State"
  loading: boolean;
  error: string | null;
  isNigeria: boolean;
  permissionDenied: boolean;
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
    fullLocation: null,
    loading: false,
    error: null,
    isNigeria: false,
    permissionDenied: false,
  });

  const fetchLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: "Geolocation is not supported by your browser" }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, permissionDenied: false }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get city/town/state with more detail
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en&addressdetails=1&zoom=18`
          );
          const data = await response.json();
          
          const isNigeria = data.address?.country_code === "ng";
          
          // Get the most specific location available
          const city = data.address?.city || 
                       data.address?.town || 
                       data.address?.village ||
                       data.address?.suburb ||
                       data.address?.neighbourhood ||
                       data.address?.locality ||
                       data.address?.county ||
                       null;
          
          const stateValue = data.address?.state || null;
          
          // Create full location string
          const fullLocation = city && stateValue 
            ? `${city}, ${stateValue}` 
            : city || stateValue || null;
          
          setState({
            latitude,
            longitude,
            city,
            state: stateValue,
            fullLocation,
            loading: false,
            error: isNigeria ? null : "SinglezConnect is only available in Nigeria",
            isNigeria,
            permissionDenied: false,
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
        let permissionDenied = false;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied";
            permissionDenied = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        setState(prev => ({ 
          ...prev, 
          loading: false, 
          error: errorMessage,
          permissionDenied 
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000, // Cache for 1 minute
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
