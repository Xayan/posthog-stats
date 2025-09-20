import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Import cn for conditional class merging

interface QueryResultTableProps {
  data: {
    columns: string[];
    results: (string | number | boolean | null)[][];
  };
  selectedFields: string[] | null;
}

export const QueryResultTable = ({ data, selectedFields }: QueryResultTableProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const transformedData = React.useMemo(() => {
    if (!data.results || !data.columns) return [];
    return data.results.map(row => {
      const rowObject: Record<string, any> = {};
      data.columns.forEach((col, index) => {
        rowObject[col] = row[index];
      });
      return rowObject;
    });
  }, [data.columns, data.results]);

  const columns = React.useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (!data.columns) return [];

    const columnsToDisplay = selectedFields === null ? data.columns : selectedFields;

    return data.columns
      .filter(columnName => columnsToDisplay.includes(columnName))
      .map(columnName => ({
        accessorKey: columnName,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto px-2 py-1 -ml-2 text-xs" // Smaller padding and font for header button
            >
              {columnName}
              {column.getIsSorted() === 'asc' && <ArrowUp className="ml-1 h-3 w-3" />} {/* Smaller icons */}
              {column.getIsSorted() === 'desc' && <ArrowDown className="ml-1 h-3 w-3" />} {/* Smaller icons */}
              {column.getIsSorted() === false && <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />} {/* Smaller icons */}
            </Button>
          )
        },
        cell: ({ row }) => {
          const value = row.getValue(columnName);
          return value === null ? <em className="text-muted-foreground">null</em> : String(value);
        },
    }));
  }, [data.columns, selectedFields]);

  const table = useReactTable({
    data: transformedData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!data || !data.results || data.results.length === 0) {
    return <p className="text-center text-muted-foreground">No results to display.</p>;
  }

  if (columns.length === 0) {
    return <p className="text-center text-muted-foreground">No fields selected. Use the 'Fields' dropdown to select columns to display.</p>;
  }

  const rowCount = data.results.length;

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id} className="h-8 px-2 text-xs font-semibold"> {/* Smaller header height, padding, and font */}
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "h-8 text-xs", // Smaller row height and font
                  index % 2 === 0 ? "bg-muted/20" : "bg-background", // Alternating row colors
                  "hover:bg-accent/50" // Hover color
                )}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className="p-2"> {/* Smaller cell padding */}
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-sm"> {/* Adjusted font size */}
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {rowCount > 0 && (
        <div className="p-2 text-xs text-muted-foreground text-right border-t"> {/* Smaller font for row count */}
          Showing {rowCount} rows
        </div>
      )}
    </div>
  );
};