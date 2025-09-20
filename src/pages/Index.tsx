import * as React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { ConfigurationForm } from "@/components/ConfigurationForm";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DashboardView } from "@/components/DashboardView";

interface ApiConfig {
    projectId: string;
    apiKey: string;
    region:string;
}

const Index = () => {
    const [config, setConfig] = useLocalStorage<ApiConfig | null>('posthogConfig', null);

    const handleSubmit = (values: ApiConfig) => {
        setConfig(values);
    };
    
    const handleSignOut = () => {
        setConfig(null);
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">PostHog Custom Views</h1>
                <p className="text-muted-foreground">Display data from your saved Data Warehouse queries, tables, and insights.</p>
            </header>

            {!config ? (
                <ConfigurationForm onSubmit={handleSubmit} isLoading={false} />
            ) : (
                <DashboardView config={config} onSignOut={handleSignOut} />
            )}

            <MadeWithDyad />
        </div>
    );
};

export default Index;