import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter } from "lucide-react";

interface FieldSelectorProps {
  allFields: string[];
  selectedFields: string[];
  onSelectionChange: (selected: string[]) => void;
  disabled: boolean;
}

export const FieldSelector = ({ allFields, selectedFields, onSelectionChange, disabled }: FieldSelectorProps) => {
  const handleCheckedChange = (field: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFields, field]);
    } else {
      onSelectionChange(selectedFields.filter(f => f !== field));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="w-full justify-start text-left font-normal">
          <ListFilter className="mr-2 h-4 w-4" />
          <span>Fields ({selectedFields.length}/{allFields.length})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Columns to display</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allFields.map(field => (
          <DropdownMenuCheckboxItem
            key={field}
            checked={selectedFields.includes(field)}
            onCheckedChange={(checked) => handleCheckedChange(field, !!checked)}
          >
            {field}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};