import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NIGERIAN_STATES } from "@/lib/nigerianStates";

interface StateSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const StateSelector = ({ value, onChange, placeholder = "Select state", className }: StateSelectorProps) => {
  const [open, setOpen] = useState(false);

  const selectedState = useMemo(() => {
    return NIGERIAN_STATES.find(
      (state) => state.toLowerCase() === value?.toLowerCase()
    );
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-11", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
            {selectedState || value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-card border-border z-50" align="start">
        <Command className="bg-card">
          <div className="flex items-center border-b border-border px-3">
            <Search className="w-4 h-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Search state..." className="h-10" />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {NIGERIAN_STATES.map((state) => (
                <CommandItem
                  key={state}
                  value={state}
                  onSelect={() => {
                    onChange(state);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase() === state.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {state}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default StateSelector;
