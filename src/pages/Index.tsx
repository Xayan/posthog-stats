import * as React from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    const [projectId, setProjectId] = React.useState("");
    const [apiKey, setApiKey] = React.useState("");
    const [region, setRegion] = React.useState("US");
    const [config, setConfig] = React.useState<ApiConfig | null>(null);

    const [selectedQuery, setSelectedQuery] = React.useState<SavedWarehouseQuery | null>(null);
    const [refreshInterval, setRefreshInterval] = React.useState(REFRESH_INTERVALS[0].value);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (projectId && apiKey) {
            setConfig({ projectId, apiKey, region });
        } else {
            showError("Please fill in Project ID and API Key.");
        }
    };
    
    const handleSignOut = () => {
        setConfig(null);
        setSelectedQuery(null);
        setApiKey(""); 
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
    }, [isQueriesError, queriesError]);

    const handleSelectQuery = (queryId: string) => {
        const query = savedQueries?.find(q => q.id === queryId) || null;
        setSelectedQuery(query);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">PostHog Custom Views</h1>
                <p className="text-muted-foreground">Display data from your saved Data Warehouse queries.</p>
            </header>

            {!config ? (
                <Card className="max-w-2xl mx-auto">
                    <form onSubmit={handleSubmit}>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>Provide your PostHog Project ID and Personal API Key.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="projectId">Project ID</Label>
                                <Input id="projectId" placeholder="Your PostHog Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="apiKey">Personal API Key</Label>
                                <Input id="apiKey" type="password" placeholder="Your PostHog API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="region">Region</Label>
                                <Select value={region} onValueChange={setRegion}>
                                    <SelectTrigger id="region">
                                        <SelectValue placeholder="Select region" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="US">US</SelectItem>
                                        <SelectItem value="EU">EU</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" disabled={isLoadingQueries}>
                                {isLoadingQueries ? "Connecting..." : "Load Saved Queries"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            ) : (
                <>
                    <ConnectionInfo projectId={config.projectId} onSignOut={handleSignOut} />
                    
                    {isLoadingQueries && <p className="text-center text-muted-foreground">Loading your saved queries...</p>}

                    {savedQueries && savedQueries.length > 0 && (
                        <section>
                            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                                <div className="space-y-2">
                                    <Label htmlFor="query-select">Custom View</Label>
                                    <Select onValueChange={handleSelectQuery}>
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
                            <div>
                                <h3 className="text-xl font-semibold mb-4">{selectedQuery.name}</h3>
                                <QueryDisplay query={selectedQuery.query.query} {...config} refetchInterval={refreshInterval} />
                            </div>
                        )}
                    </section>
                </>
            )}

            <MadeWithDyad />
        </div>
    );
};

export default Index;