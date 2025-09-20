import * as React from "react";
import { Table } from "@tanstack/react-table";
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

interface FieldSelectorProps<TData> {
  table: Table<TData>;
  disabled: boolean;
}

export function FieldSelector<TData>({ table, disabled }: FieldSelectorProps<TData>) {
  const selectedColumnCount = table.getVisibleLeafColumns().length - 1; // Exclude select column
  const totalColumnCount = table.getAllLeafColumns().length - 1; // Exclude select column

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="w-full justify-start text-left font-normal">
          <ListFilter className="mr-2 h-4 w-4" />
          <span>Fields ({selectedColumnCount}/{totalColumnCount})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Columns to display</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table.getAllLeafColumns().map(column => {
          if (column.id === 'select') return null; // Don't allow hiding the selection column
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};