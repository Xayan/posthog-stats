import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { showError } from "@/utils/toast";
import { fetchSavedWarehouseQueries, SavedWarehouseQuery } from "@/services/posthog";
import { QueryDisplay } from "@/components/QueryDisplay";
import { ConnectionInfo } from "@/components/ConnectionInfo";
import { ConfigurationForm } from "@/components/ConfigurationForm";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface ApiConfig {
    projectId: string;
    apiKey: string;
    region: string;
}

const REFRESH_INTERVALS = [
    { label: "Off", value: 0 },
    { label: "30 seconds", value: 30000 },
    { label: "1 minute", value: 60000 },
    { label: "5 minutes", value: 300000 },
];

const Index = () => {
    const [config, setConfig] = useLocalStorage<ApiConfig | null>('posthogConfig', null);
    const [selectedQueryId, setSelectedQueryId] = useLocalStorage<string | null>('selectedQueryId', null);
    const [refreshInterval, setRefreshInterval] = useLocalStorage<number>('refreshInterval', REFRESH_INTERVALS[0].value);
    
    const [selectedQuery, setSelectedQuery] = React.useState<SavedWarehouseQuery | null>(null);

    const handleSubmit = (values: ApiConfig) => {
        setConfig(values);
    };
    
    const handleSignOut = () => {
        setConfig(null);
        setSelectedQueryId(null);
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

    React.useEffect(() => {
        if (savedQueries && selectedQueryId) {
            const query = savedQueries.find(q => q.id === selectedQueryId) || null;
            setSelectedQuery(query);
        } else {
            setSelectedQuery(null);
        }
    }, [savedQueries, selectedQueryId]);

    const handleSelectQuery = (queryId: string) => {
        setSelectedQueryId(queryId);
    };

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

                    {savedQueries && savedQueries.length > 0 && (
                        <section>
                            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                                <div className="space-y-2">
                                    <Label htmlFor="query-select">Custom View</Label>
                                    <Select onValueChange={handleSelectQuery} value={selectedQueryId ?? ""}>
                                        <SelectTrigger id="query-select">
                                            <SelectValue placeholder="Select a view to display" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {savedQueries.map(q => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
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
                            </div>
                        </section>
                    )}

                    {savedQueries && savedQueries.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No saved Data Warehouse queries found for this project.</p>
                        </div>
                    )}

                    <section className="mt-8">
                        {selectedQuery && config && (
                            <QueryDisplay 
                                title={selectedQuery.name}
                                query={selectedQuery.query.query} 
                                {...config} 
                                refetchInterval={refreshInterval} 
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