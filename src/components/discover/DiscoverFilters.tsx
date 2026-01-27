import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MapPin, Loader2, Navigation } from "lucide-react";
import StateSelector from "@/components/StateSelector";
import LocationPermissionDialog from "@/components/LocationPermissionDialog";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEffect, useState } from "react";

interface DiscoverFiltersProps {
  ageRange: number[];
  setAgeRange: (value: number[]) => void;
  distanceKm: number;
  setDistanceKm: (value: number) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  genderFilter: string;
  setGenderFilter: (value: string) => void;
  useDistanceFilter: boolean;
  setUseDistanceFilter: (value: boolean) => void;
  onApply: () => void;
  onLocationUpdate?: (lat: number, lng: number, fullLocation: string | null) => void;
}

const DiscoverFilters = ({
  ageRange,
  setAgeRange,
  distanceKm,
  setDistanceKm,
  cityFilter,
  setCityFilter,
  genderFilter,
  setGenderFilter,
  useDistanceFilter,
  setUseDistanceFilter,
  onApply,
  onLocationUpdate,
}: DiscoverFiltersProps) => {
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  
  const { 
    latitude, 
    longitude, 
    city,
    state, 
    fullLocation,
    loading: locationLoading, 
    error: locationError,
    permissionDenied,
    fetchLocation,
    hasLocation 
  } = useGeolocation();

  // Update parent with location when available
  useEffect(() => {
    if (latitude && longitude && onLocationUpdate) {
      onLocationUpdate(latitude, longitude, fullLocation);
    }
  }, [latitude, longitude, fullLocation, onLocationUpdate]);

  // Auto-set state filter from live location (use state for filtering)
  useEffect(() => {
    if (state && !cityFilter) {
      setCityFilter(state);
    }
  }, [state, cityFilter, setCityFilter]);

  // Show permission dialog if permission was denied
  useEffect(() => {
    if (permissionDenied) {
      setShowLocationDialog(true);
    }
  }, [permissionDenied]);

  const handleGetLiveLocation = () => {
    fetchLocation();
  };

  const handleEnableLocationFromDialog = () => {
    setShowLocationDialog(false);
    fetchLocation();
  };

  return (
    <div className="space-y-5 p-4 pb-8">
      {/* Location Permission Dialog */}
      <LocationPermissionDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onEnableLocation={handleEnableLocationFromDialog}
        onSkip={() => setShowLocationDialog(false)}
      />

      {/* Live Location Button */}
      <div className="space-y-3">
        <Button 
          type="button"
          variant="outline" 
          className="w-full h-11 gap-2"
          onClick={handleGetLiveLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Detecting your town & state...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              {hasLocation ? "Update Live Location" : "Detect My Location"}
            </>
          )}
        </Button>
        
        {locationError && !permissionDenied && (
          <p className="text-xs text-destructive text-center">{locationError}</p>
        )}
        
        {permissionDenied && (
          <button 
            onClick={() => setShowLocationDialog(true)}
            className="w-full text-xs text-primary underline text-center"
          >
            Tap here to enable location access
          </button>
        )}
        
        {hasLocation && fullLocation && (
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-xs text-center flex items-center justify-center gap-2">
              <MapPin className="w-3 h-3 text-primary" />
              <span className="text-primary font-medium">{fullLocation}</span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Age Range: {ageRange[0]} - {ageRange[1]}</label>
        <Slider
          value={ageRange}
          onValueChange={setAgeRange}
          min={18}
          max={70}
          step={1}
          className="py-2"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Filter by distance
          </label>
          <Switch
            checked={useDistanceFilter}
            onCheckedChange={setUseDistanceFilter}
          />
        </div>
        {useDistanceFilter && (
          <div className="space-y-2 pl-6">
            <p className="text-sm text-muted-foreground">Within {distanceKm} km</p>
            <Slider
              value={[distanceKm]}
              onValueChange={([val]) => setDistanceKm(val)}
              min={5}
              max={500}
              step={5}
              className="py-2"
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">State</label>
        <StateSelector
          value={cityFilter}
          onChange={setCityFilter}
          placeholder="Search and select state"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Show me</label>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="male">Men</SelectItem>
            <SelectItem value="female">Women</SelectItem>
            <SelectItem value="non_binary">Non-binary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full h-12 mt-4" onClick={onApply}>
        Apply Filters
      </Button>
    </div>
  );
};

export default DiscoverFilters;
