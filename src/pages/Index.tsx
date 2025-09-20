import * as React from "react";
import { useQuery } from "@tanstack/react-query";

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
import { MadeWithDyad } from "@/components/made-with-dyad";
import { showError } from "@/utils/toast";
import { fetchSavedWarehouseQueries, runHogQLQuery } from "@/services/posthog";
import { QueryDisplay } from "@/components/QueryDisplay";
import { ConnectionInfo } from "@/components/ConnectionInfo";
import { ConfigurationForm } from "@/components/ConfigurationForm";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { FieldSelector } from "@/components/FieldSelector";

interface ApiConfig {
    projectId: string;
    apiKey: string;
    region:string;
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

const Index = () => {
    const [config, setConfig] = useLocalStorage<ApiConfig | null>('posthogConfig', null);
    const [selectedView, setSelectedView] = useLocalStorage<string | null>('selectedView', null);
    const [refreshInterval, setRefreshInterval] = useLocalStorage<number>('refreshInterval', REFRESH_INTERVALS[0].value);

    const handleSubmit = (values: ApiConfig) => {
        setConfig(values);
    };
    
    const handleSignOut = () => {
        setConfig(null);
        setSelectedView(null);
    };

    const { data: savedQueries, isLoading: isLoadingQueries, isError: isQueriesError, error: queriesError } = useQuery({
        queryKey: ['savedQueries', config],
        queryFn: () => {
            if (!config) throw new Error("Config not set");
            return fetchSavedWarehouseQueries(config);
        },
        enabled: !!config,
        retry: false,
    });

    React.useEffect(() => {
        if (isQueriesError && queriesError) {
            showError(queriesError.message);
            handleSignOut();
        }
    }, [isQueriesError, queriesError, handleSignOut]);

    const [viewType, viewValue] = selectedView ? selectedView.split('__') : [null, null];

    let queryToRun: string | null = null;
    let title: string | null = null;

    if (viewType === 'custom' && viewValue && savedQueries) {
        const query = savedQueries.find(q => q.id === viewValue);
        if (query) {
            queryToRun = query.query.query;
            title = query.name;
        }
    } else if (viewType === 'table' && viewValue) {
        queryToRun = `SELECT * FROM ${viewValue} LIMIT 100`;
        const tableDef = POSTHOG_TABLES.find(t => t.value === viewValue);
        title = tableDef ? `PostHog Table: ${tableDef.name}` : `PostHog Table: ${viewValue}`;
    }

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: ['hogqlQuery', config, queryToRun],
        queryFn: () => {
            if (!config || !queryToRun) throw new Error("Configuration or query is missing.");
            return runHogQLQuery({ ...config, query: queryToRun });
        },
        enabled: !!config && !!queryToRun,
        retry: false,
        refetchInterval: refreshInterval,
    });

    const allFields = React.useMemo(() => data?.columns || [], [data]);
    const storageKey = selectedView ? `selectedFields_${selectedView}` : 'selectedFields_null';
    const [selectedFields, setSelectedFields] = useLocalStorage<string[] | null>(storageKey, null);

    React.useEffect(() => {
        if (allFields.length > 0 && selectedFields === null) {
            setSelectedFields(allFields);
        }
    }, [allFields, selectedFields, setSelectedFields]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">PostHog Custom Views</h1>
                <p className="text-muted-foreground">Display data from your saved Data Warehouse queries.</p>
            </header>

            {!config ? (
                <ConfigurationForm onSubmit={handleSubmit} isLoading={isLoadingQueries} />
            ) : (
                <>
                    <ConnectionInfo projectId={config.projectId} onSignOut={handleSignOut} />
                    
                    {isLoadingQueries && <p className="text-center text-muted-foreground">Loading your saved queries...</p>}

                    {savedQueries && (
                        <section>
                            <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                                <div className="space-y-2">
                                    <Label htmlFor="query-select">View</Label>
                                    <Select onValueChange={setSelectedView} value={selectedView ?? ""}>
                                        <SelectTrigger id="query-select">
                                            <SelectValue placeholder="Select a view to display" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {savedQueries.length > 0 && (
                                                <SelectGroup>
                                                    <SelectLabel>Custom Views</SelectLabel>
                                                    {savedQueries.map(q => <SelectItem key={q.id} value={`custom__${q.id}`}>{q.name}</SelectItem>)}
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

                    {savedQueries && savedQueries.length === 0 && (
                         <div className="text-center py-12">
                            <p className="text-muted-foreground">No saved Data Warehouse queries found for this project.</p>
                        </div>
                    )}

                    <section className="mt-8">
                        {queryToRun && title && config && (
                            <QueryDisplay 
                                title={title}
                                data={data}
                                isLoading={isLoading}
                                isError={isError}
                                error={error as Error | null}
                                isFetching={isFetching}
                                refetchInterval={refreshInterval}
                                selectedFields={selectedFields}
                            />
                        )}
                    </section>
                </>
            )}

            <MadeWithDyad />
        </div>
    );
};

export default Index;