import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MapPin } from "lucide-react";

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
}: DiscoverFiltersProps) => {
  return (
    <div className="space-y-5 p-4 pb-8">
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
        <label className="text-sm font-medium">State / City</label>
        <Input
          placeholder="e.g. Lagos, Abuja, Anambra"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-11"
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
