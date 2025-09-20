import * as React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { ConfigurationForm } from "@/components/ConfigurationForm";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DashboardView } from "@/components/DashboardView";

interface ApiConfig {
    projectId: string;
    apiKey: string;
    baseUrl: string;
}

const getEnvConfig = (): ApiConfig | null => {
    const projectId = import.meta.env.VITE_POSTHOG_PROJECT_ID || import.meta.env.POSTHOG_PROJECT_ID;
    const apiKey = import.meta.env.VITE_POSTHOG_PERSONAL_API_KEY || import.meta.env.POSTHOG_PERSONAL_API_KEY;
    
    if (!projectId || !apiKey) {
        return null;
    }

    // Prioritize POSTHOG_BASE_URL
    const baseUrl = import.meta.env.VITE_POSTHOG_BASE_URL || import.meta.env.POSTHOG_BASE_URL;
    if (baseUrl) {
        try {
            new URL(baseUrl);
            return { projectId, apiKey, baseUrl };
        } catch (e) {
            console.warn(`Invalid POSTHOG_BASE_URL found: "${baseUrl}". It should be a valid URL.`);
            return null;
        }
    }

    // Fallback to legacy POSTHOG_REGION for backward compatibility
    const region = import.meta.env.VITE_POSTHOG_REGION || import.meta.env.POSTHOG_REGION;
    if (region) {
        if (['US', 'EU'].includes(region.toUpperCase())) {
            const derivedBaseUrl = region.toUpperCase() === 'EU' ? 'https://eu.posthog.com' : 'https://app.posthog.com';
            return { projectId, apiKey, baseUrl: derivedBaseUrl };
        }
        console.warn(`Invalid POSTHOG_REGION found: "${region}". It should be "US" or "EU".`);
    }

    return null;
};

const Index = () => {
    const envConfig = React.useMemo(() => getEnvConfig(), []);
    const [storedConfig, setStoredConfig] = useLocalStorage<ApiConfig | null>('posthogConfig', null);

    // Determine initial form values: envConfig if present, otherwise default empty values
    const initialFormValues = React.useMemo(() => {
        if (envConfig) {
            return envConfig;
        }
        return { projectId: '', apiKey: '', baseUrl: 'https://app.posthog.com' };
    }, [envConfig]);

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

            {storedConfig ? (
                <DashboardView config={storedConfig} onSignOut={handleSignOut} />
            ) : (
                <ConfigurationForm onSubmit={handleSubmit} isLoading={false} initialValues={initialFormValues} />
            )}

            <MadeWithDyad />
        </div>
    );
};

export default Index;