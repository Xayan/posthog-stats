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
              className="px-2 py-1 -ml-2"
            >
              {columnName}
              {column.getIsSorted() === 'asc' && <ArrowUp className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === 'desc' && <ArrowDown className="ml-2 h-4 w-4" />}
              {column.getIsSorted() === false && <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />}
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
                <TableHead key={header.id}>
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
            table.getRowModel().rows.map(row => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {rowCount > 0 && (
        <div className="p-2 text-sm text-muted-foreground text-right border-t">
          Showing {rowCount} rows
        </div>
      )}
    </div>
  );
};