import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnVisibilityState,
  type RowSelectionState,
  type PaginationState,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePostHogView } from "@/hooks/usePostHogView";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldSelector } from "@/components/FieldSelector";
import { QueryDisplay } from "@/components/QueryDisplay";
import { ConnectionInfo } from "@/components/ConnectionInfo";
import { DataTable } from "@/components/DataTable";

interface ApiConfig {
    projectId: string;
    apiKey: string;
    baseUrl: string;
}

interface DashboardViewProps {
    config: ApiConfig;
    onSignOut: () => void;
}

const REFRESH_INTERVALS = [
    { label: "Off", value: 0 },
    { label: "30 seconds", value: 30000 },
    { label: "1 minute", value: 60000 },
    { label: "5 minutes", value: 300000 },
];

const POSTHOG_TABLES = [
    { name: 'Persons', value: 'persons' },
    { name: 'Events', value: 'events' },
    { name: 'Sessions', value: 'sessions' },
    { name: 'Groups', value: 'groups' },
];

const PAGE_SIZES = [100, 250, 500, 1000];
const MAX_FETCH_LIMIT = 1000;

export const DashboardView = ({ config, onSignOut }: DashboardViewProps) => {
    const [selectedView, setSelectedView] = useLocalStorage<string | null>('selectedView', null);
    const [refreshInterval, setRefreshInterval] = useLocalStorage<number>('refreshInterval', REFRESH_INTERVALS[0].value);
    
    // Table state
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const columnVisibilityKey = selectedView ? `columnVisibility_${selectedView}` : 'columnVisibility_default';
    const [columnVisibility, setColumnVisibility] = useLocalStorage<ColumnVisibilityState>(columnVisibilityKey, {});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
    const [pagination, setPagination] = useLocalStorage<PaginationState>('tablePagination', {
        pageIndex: 0,
        pageSize: 100,
    });

    const {
        savedQueries,
        insights,
        data,
        title,
        queryToRun,
        isLoading,
        isFetching,
        isError,
        error,
    } = usePostHogView(config, selectedView, MAX_FETCH_LIMIT, refreshInterval, onSignOut);

    // Reset state when view changes, but preserve column visibility from local storage
    React.useEffect(() => {
        setPagination(p => ({ ...p, pageIndex: 0 }));
        setSorting([]);
        setRowSelection({});
    }, [selectedView, setPagination]);

    const transformedData = React.useMemo(() => {
        if (!data?.results || !data?.columns) return [];
        return data.results.map(row => {
            const rowObject: Record<string, any> = {};
            data.columns.forEach((col, index) => {
                rowObject[col] = row[index];
            });
            return rowObject;
        });
    }, [data?.columns, data?.results]);

    const columns = React.useMemo<ColumnDef<Record<string, any>>[]>(() => {
        if (!data?.columns) return [];

        const selectionColumn: ColumnDef<Record<string, any>> = {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-[2px]"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        };

        const dataColumns = data.columns.map(columnName => ({
            accessorKey: columnName,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting()}
                    className="h-auto px-2 py-1 -ml-2 text-xs"
                >
                    {columnName}
                    {column.getIsSorted() === 'asc' && <ArrowUp className="ml-1 h-3 w-3" />}
                    {column.getIsSorted() === 'desc' && <ArrowDown className="ml-1 h-3 w-3" />}
                    {column.getIsSorted() === false && <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50" />}
                </Button>
            ),
            cell: ({ row }) => {
                const value = row.getValue(columnName);
                return value === null ? <em className="text-muted-foreground">null</em> : String(value);
            },
        }));

        return [selectionColumn, ...dataColumns];
    }, [data?.columns]);

    const table = useReactTable({
        data: transformedData,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            pagination,
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    return (
        <>
            <ConnectionInfo projectId={config.projectId} onSignOut={onSignOut} />

            {(savedQueries || insights) && (
                <section>
                    <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                        <div className="space-y-2">
                            <Label htmlFor="query-select">View</Label>
                            <Select onValueChange={setSelectedView} value={selectedView ?? ""}>
                                <SelectTrigger id="query-select" className="hover:bg-accent hover:text-accent-foreground">
                                    <SelectValue placeholder="Select a view to display" />
                                </SelectTrigger>
                                <SelectContent>
                                    {savedQueries && savedQueries.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Custom Views</SelectLabel>
                                            {savedQueries.map(q => <SelectItem key={q.id} value={`custom__${q.id}`}>{q.name}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                    {insights && insights.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Insights</SelectLabel>
                                            {insights.map(i => <SelectItem key={i.short_id} value={`insight__${i.short_id}`}>{i.name}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                    <SelectGroup>
                                        <SelectLabel>PostHog Tables</SelectLabel>
                                        {POSTHOG_TABLES.map(t => <SelectItem key={t.value} value={`table__${t.value}`}>{t.name}</SelectItem>)}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="refresh-interval">Auto-Refresh</Label>
                            <Select value={String(refreshInterval)} onValueChange={(val) => setRefreshInterval(Number(val))}>
                                <SelectTrigger id="refresh-interval" className="hover:bg-accent hover:text-accent-foreground">
                                    <SelectValue placeholder="Set refresh interval" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REFRESH_INTERVALS.map(item => <SelectItem key={item.value} value={String(item.value)}>{item.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rows-per-page">Rows per page</Label>
                            <Select
                                value={String(pagination.pageSize)}
                                onValuechange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger id="rows-per-page" className="hover:bg-accent hover:text-accent-foreground">
                                    <SelectValue placeholder={pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZES.map(size => (
                                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="max-w-4xl mx-auto mb-8">
                        <div className="space-y-2">
                            <Label>Fields</Label>
                            <FieldSelector
                                table={table}
                                disabled={!selectedView || !data?.columns || data.columns.length === 0}
                            />
                        </div>
                    </div>
                </section>
            )}

            {(!savedQueries || savedQueries.length === 0) && (!insights || insights.length === 0) && !isLoading && (
                 <div className="text-center py-12">
                    <p className="text-muted-foreground">No saved Data Warehouse queries or insights found for this project.</p>
                </div>
            )}

            <section className="mt-8">
                {queryToRun && title && config && (
                    <QueryDisplay
                        title={title}
                        isLoading={isLoading && !data}
                        isError={isError}
                        error={error as Error | null}
                        isFetching={isFetching}
                        refetchInterval={refreshInterval}
                        hasData={!!data}
                    >
                        <DataTable table={table} />
                    </QueryDisplay>
                )}
            </section>
        </>
    );
};