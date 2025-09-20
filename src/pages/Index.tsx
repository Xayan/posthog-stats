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
import { Skeleton } from "@/components/ui/skeleton";

interface ApiConfig {
    projectId: string;
    apiKey: string;
    region: string;
}

const Index = () => {
    const [projectId, setProjectId] = React.useState("");
    const [apiKey, setApiKey] = React.useState("");
    const [region, setRegion] = React.useState("US");
    const [config, setConfig] = React.useState<ApiConfig | null>(null);

    const [selectedQuery1, setSelectedQuery1] = React.useState<SavedWarehouseQuery | null>(null);
    const [selectedQuery2, setSelectedQuery2] = React.useState<SavedWarehouseQuery | null>(null);
    const [selectedQuery3, setSelectedQuery3] = React.useState<SavedWarehouseQuery | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (projectId && apiKey) {
            setConfig({ projectId, apiKey, region });
        } else {
            showError("Please fill in Project ID and API Key.");
        }
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
        }
    }, [isQueriesError, queriesError]);

    const handleSelectQuery = (queryId: string, selectorIndex: number) => {
        const query = savedQueries?.find(q => q.id === queryId) || null;
        if (selectorIndex === 1) setSelectedQuery1(query);
        if (selectorIndex === 2) setSelectedQuery2(query);
        if (selectorIndex === 3) setSelectedQuery3(query);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">PostHog Custom Views</h1>
                <p className="text-muted-foreground">Display data from your saved Data Warehouse queries.</p>
            </header>

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
                            {isLoadingQueries ? "Loading..." : "Load Saved Queries"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {config && isLoadingQueries && (
                <div className="text-center mt-8">
                    <p>Loading your saved queries...</p>
                </div>
            )}

            {savedQueries && savedQueries.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-2xl font-semibold text-center mb-6">Display Custom Views</h2>
                    <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        {[1, 2, 3].map(index => (
                            <div className="space-y-2" key={index}>
                                <Label htmlFor={`query-select-${index}`}>View {index}</Label>
                                <Select onValueChange={(value) => handleSelectQuery(value, index)}>
                                    <SelectTrigger id={`query-select-${index}`}>
                                        <SelectValue placeholder="Select a view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {savedQueries.map(q => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            
            {savedQueries && savedQueries.length === 0 && (
                 <div className="text-center py-12">
                    <p className="text-muted-foreground">No saved Data Warehouse queries found for this project.</p>
                </div>
            )}

            <section className="mt-8 space-y-12">
                {selectedQuery1 && config && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">{selectedQuery1.name}</h3>
                        <QueryDisplay query={selectedQuery1.query.query} {...config} />
                    </div>
                )}
                {selectedQuery2 && config && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">{selectedQuery2.name}</h3>
                        <QueryDisplay query={selectedQuery2.query.query} {...config} />
                    </div>
                )}
                {selectedQuery3 && config && (
                    <div>
                        <h3 className="text-xl font-semibold mb-4">{selectedQuery3.name}</h3>
                        <QueryDisplay query={selectedQuery3.query.query} {...config} />
                    </div>
                )}
            </section>

            <MadeWithDyad />
        </div>
    );
};

export default Index;