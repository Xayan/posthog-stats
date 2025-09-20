import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface QueryResultTableProps {
  data: {
    columns: string[];
    results: (string | number | boolean | null)[][];
  };
}

export const QueryResultTable = ({ data }: QueryResultTableProps) => {
  if (!data || !data.results || data.results.length === 0) {
    return <p className="text-center text-muted-foreground">No results to display.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {data.columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.results.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>
                  {cell === null ? <em className="text-muted-foreground">null</em> : String(cell)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};