import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DiscoverFiltersProps {
  ageRange: number[];
  setAgeRange: (value: number[]) => void;
  distanceKm: number;
  setDistanceKm: (value: number) => void;
  cityFilter: string;
  setCityFilter: (value: string) => void;
  genderFilter: string;
  setGenderFilter: (value: string) => void;
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
  onApply,
}: DiscoverFiltersProps) => {
  return (
    <div className="space-y-6 p-4">
      <div className="space-y-3">
        <label className="text-sm font-medium">Age Range: {ageRange[0]} - {ageRange[1]}</label>
        <Slider
          value={ageRange}
          onValueChange={setAgeRange}
          min={18}
          max={70}
          step={1}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Distance: {distanceKm} km</label>
        <Slider
          value={[distanceKm]}
          onValueChange={([val]) => setDistanceKm(val)}
          min={5}
          max={500}
          step={5}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Location / City</label>
        <Input
          placeholder="e.g. Lagos, Abuja, Onitsha"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Show me</label>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="male">Men</SelectItem>
            <SelectItem value="female">Women</SelectItem>
            <SelectItem value="non_binary">Non-binary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full" onClick={onApply}>
        Apply Filters
      </Button>
    </div>
  );
};

export default DiscoverFilters;
