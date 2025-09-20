import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSavedWarehouseQueries, fetchInsights, runPostHogQuery, SavedWarehouseQuery, Insight } from "@/services/posthog";
import { showError } from "@/utils/toast";

interface ApiConfig {
    projectId: string;
    apiKey: string;
    baseUrl: string;
}

const POSTHOG_TABLES = [
    { name: 'Persons', value: 'persons' },
    { name: 'Events', value: 'events' },
    { name: 'Sessions', value: 'sessions' },
    { name: 'Groups', value: 'groups' },
];

export const usePostHogView = (config: ApiConfig | null, selectedView: string | null, limit: number, refreshInterval: number, onAuthError: () => void) => {
    const { data: savedQueries, isLoading: isLoadingQueries, isError: isQueriesError, error: queriesError } = useQuery<SavedWarehouseQuery[], Error>({
        queryKey: ['savedQueries', config],
        queryFn: () => {
            if (!config) throw new Error("Config not set");
            return fetchSavedWarehouseQueries(config);
        },
        enabled: !!config,
        retry: false,
    });

    const { data: insights, isLoading: isLoadingInsights, isError: isInsightsError, error: insightsError } = useQuery<Insight[], Error>({
        queryKey: ['insights', config],
        queryFn: () => {
            if (!config) throw new Error("Config not set");
            return fetchInsights(config);
        },
        enabled: !!config,
        retry: false,
    });

    React.useEffect(() => {
        if (isQueriesError && queriesError) {
            showError(queriesError.message);
            onAuthError();
        }
        if (isInsightsError && insightsError) {
            showError(insightsError.message);
            onAuthError();
        }
    }, [isQueriesError, queriesError, isInsightsError, insightsError, onAuthError]);

    const [viewType, viewValue] = selectedView ? selectedView.split('__') : [null, null];

    let queryToRun: Parameters<typeof runPostHogQuery>[0]['query'] | null = null;
    let title: string | null = null;

    if (viewType === 'custom' && viewValue && savedQueries) {
        const query = savedQueries.find(q => q.id === viewValue);
        if (query) {
            queryToRun = { kind: "HogQLQuery", query: `${query.query.query} LIMIT ${limit}` };
            title = query.name;
        }
    } else if (viewType === 'table' && viewValue) {
        queryToRun = { kind: "HogQLQuery", query: `SELECT * FROM ${viewValue} LIMIT ${limit}` };
        const tableDef = POSTHOG_TABLES.find(t => t.value === viewValue);
        title = tableDef ? `PostHog Table: ${tableDef.name}` : `PostHog Table: ${viewValue}`;
    } else if (viewType === 'insight' && viewValue && insights) {
        const insight = insights.find(i => i.short_id === viewValue);
        if (insight && insight.query) {
            queryToRun = insight.query;
            title = `Insight: ${insight.name}`;
        }
    }

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: ['posthogQuery', config, queryToRun],
        queryFn: () => {
            if (!config || !queryToRun) throw new Error("Configuration or query is missing.");
            return runPostHogQuery({ ...config, query: queryToRun });
        },
        enabled: !!config && !!queryToRun,
        retry: false,
        refetchInterval: refreshInterval,
    });

    return {
        savedQueries,
        insights,
        data,
        title,
        queryToRun,
        isLoading: isLoading || isLoadingQueries || isLoadingInsights,
        isFetching,
        isError,
        error,
    };
};