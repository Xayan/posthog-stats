import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
import { type SavedWarehouseQuery, type Insight, type TableInfo } from "@/services/posthog";

interface ViewSelectorProps {
  savedQueries: SavedWarehouseQuery[] | undefined;
  insights: Insight[] | undefined;
  availableTables: TableInfo[] | undefined;
  viewCounts: Map<string, number> | undefined;
  selectedView: string | null;
  onSelectView: (value: string | null) => void;
}

export const ViewSelector = ({
  savedQueries,
  insights,
  availableTables,
  viewCounts,
  selectedView,
  onSelectView,
}: ViewSelectorProps) => {
  const [open, setOpen] = React.useState(false);

  const allViews = React.useMemo(() => {
    const tables = availableTables ? availableTables.map(t => {
        const count = viewCounts?.get(`table__${t.id}`);
        const label = count !== undefined ? `${t.name} (${count.toLocaleString()})` : t.name;
        return {
            value: `table__${t.id}`,
            label: label,
            group: "Available Tables",
        };
    }) : [];

    const custom = savedQueries ? savedQueries.map(q => {
        const count = viewCounts?.get(`custom__${q.id}`);
        const label = count !== undefined ? `${q.name} (${count.toLocaleString()})` : q.name;
        return {
            value: `custom__${q.id}`,
            label: label,
            group: "Custom Views",
        };
    }) : [];

    const insightViews = insights ? insights.map(i => ({
        value: `insight__${i.short_id}`,
        label: i.name,
        group: "Insights",
    })) : [];

    return { tables, custom, insightViews };
  }, [savedQueries, insights, availableTables, viewCounts]);

  const currentViewLabel = React.useMemo(() => {
    if (!selectedView) return "Select a view to display...";
    const all = [...allViews.tables, ...allViews.custom, ...allViews.insightViews];
    return all.find(v => v.value === selectedView)?.label ?? "Select a view to display...";
  }, [selectedView, allViews]);

  const handleSelect = (currentValue: string) => {
    onSelectView(currentValue === selectedView ? null : currentValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between hover:bg-accent hover:text-accent-foreground"
        >
          <span className="truncate">{currentViewLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search views..." />
          <CommandList>
            <CommandEmpty>No view found.</CommandEmpty>
            {allViews.tables.length > 0 && (
              <CommandGroup heading="Available Tables">
                {allViews.tables.map((view) => (
                  <CommandItem
                    key={view.value}
                    value={view.label}
                    onSelect={() => handleSelect(view.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedView === view.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {view.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {allViews.custom.length > 0 && (
                <CommandGroup heading="Custom Views">
                {allViews.custom.map((view) => (
                    <CommandItem
                    key={view.value}
                    value={view.label}
                    onSelect={() => handleSelect(view.value)}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        selectedView === view.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {view.label}
                    </CommandItem>
                ))}
                </CommandGroup>
            )}
            {allViews.insightViews.length > 0 && (
                <CommandGroup heading="Insights">
                {allViews.insightViews.map((view) => (
                    <CommandItem
                    key={view.value}
                    value={view.label}
                    onSelect={() => handleSelect(view.value)}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        selectedView === view.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {view.label}
                    </CommandItem>
                ))}
                </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};