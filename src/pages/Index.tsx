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

const getEnvConfig = (): ApiConfig | null => {
    // Vite exposes env variables with the configured prefixes.
    // We'll check for both VITE_POSTHOG_ and the direct POSTHOG_ prefixes.
    const projectId = import.meta.env.VITE_POSTHOG_PROJECT_ID || import.meta.env.POSTHOG_PROJECT_ID;
    const apiKey = import.meta.env.VITE_POSTHOG_PERSONAL_API_KEY || import.meta.env.POSTHOG_PERSONAL_API_KEY;
    const region = import.meta.env.VITE_POSTHOG_REGION || import.meta.env.POSTHOG_REGION;

    if (projectId && apiKey && region) {
        if (['US', 'EU'].includes(region.toUpperCase())) {
            return { projectId, apiKey, region: region.toUpperCase() };
        }
        console.warn(`Invalid POSTHOG_REGION found: "${region}". It should be "US" or "EU".`);
    }
    return null;
};

const Index = () => {
    const envConfig = React.useMemo(() => getEnvConfig(), []);
    const [storedConfig, setStoredConfig] = useLocalStorage<ApiConfig | null>('posthogConfig', null);

    const config = envConfig || storedConfig;
    const isEnvConfig = !!envConfig;

    const handleSubmit = (values: ApiConfig) => {
        setStoredConfig(values);
    };
    
    const handleSignOut = () => {
        setStoredConfig(null);
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
                <DashboardView config={config} onSignOut={handleSignOut} isEnvConfig={isEnvConfig} />
            )}

            <MadeWithDyad />
        </div>
    );
};

export default Index;