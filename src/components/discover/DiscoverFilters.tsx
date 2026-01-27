import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MapPin, Loader2 } from "lucide-react";
import StateSelector from "@/components/StateSelector";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useEffect } from "react";

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
  onLocationUpdate?: (lat: number, lng: number) => void;
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
  const { 
    latitude, 
    longitude, 
    state, 
    loading: locationLoading, 
    error: locationError,
    fetchLocation,
    hasLocation 
  } = useGeolocation();

  // Update parent with location when available
  useEffect(() => {
    if (latitude && longitude && onLocationUpdate) {
      onLocationUpdate(latitude, longitude);
    }
  }, [latitude, longitude, onLocationUpdate]);

  // Auto-set state filter from live location
  useEffect(() => {
    if (state && !cityFilter) {
      setCityFilter(state);
    }
  }, [state, cityFilter, setCityFilter]);

  const handleGetLiveLocation = () => {
    fetchLocation();
  };

  return (
    <div className="space-y-5 p-4 pb-8">
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
              Detecting location...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              {hasLocation ? "Update Live Location" : "Use Live Location"}
            </>
          )}
        </Button>
        {locationError && (
          <p className="text-xs text-destructive text-center">{locationError}</p>
        )}
        {hasLocation && state && (
          <p className="text-xs text-emerald-500 text-center">
            📍 Location detected: {state}
          </p>
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
