import * as React from "react";
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
import { FieldSelector } from "@/components/FieldSelector";
import { QueryDisplay } from "@/components/QueryDisplay";
import { ConnectionInfo } from "@/components/ConnectionInfo";

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

export const DashboardView = ({ config, onSignOut }: DashboardViewProps) => {
    const [selectedView, setSelectedView] = useLocalStorage<string | null>('selectedView', null);
    const [refreshInterval, setRefreshInterval] = useLocalStorage<number>('refreshInterval', REFRESH_INTERVALS[0].value);

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
    } = usePostHogView(config, selectedView, onSignOut);

    const allFields = React.useMemo(() => data?.columns || [], [data]);
    const storageKey = selectedView ? `selectedFields_${selectedView}` : 'selectedFields_null';
    const [selectedFields, setSelectedFields] = useLocalStorage<string[] | null>(storageKey, null);

    React.useEffect(() => {
        if (allFields.length > 0) {
            if (selectedFields === null) {
                setSelectedFields(allFields);
            } else {
                const validSelectedFields = selectedFields.filter(field => allFields.includes(field));
                if (validSelectedFields.length === 0) {
                    setSelectedFields(allFields);
                } else if (validSelectedFields.length !== selectedFields.length) {
                    setSelectedFields(validSelectedFields);
                }
            }
        }
    }, [allFields, selectedFields, setSelectedFields]);

    return (
        <>
            <ConnectionInfo projectId={config.projectId} onSignOut={onSignOut} />
            
            {isLoading && !data && <p className="text-center text-muted-foreground">Loading PostHog data...</p>}

            {(savedQueries || insights) && (
                <section>
                    <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                        <div className="space-y-2">
                            <Label htmlFor="query-select">View</Label>
                            <Select onValueChange={setSelectedView} value={selectedView ?? ""}>
                                <SelectTrigger id="query-select">
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
                                <SelectTrigger id="refresh-interval">
                                    <SelectValue placeholder="Set refresh interval" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REFRESH_INTERVALS.map(item => <SelectItem key={item.value} value={String(item.value)}>{item.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Fields</Label>
                            <FieldSelector
                                allFields={allFields}
                                selectedFields={selectedFields || []}
                                onSelectionChange={setSelectedFields}
                                disabled={!selectedView || allFields.length === 0}
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
                        data={data}
                        isLoading={isLoading && !data}
                        isError={isError}
                        error={error as Error | null}
                        isFetching={isFetching}
                        refetchInterval={refreshInterval}
                        selectedFields={selectedFields}
                    />
                )}
            </section>
        </>
    );
};