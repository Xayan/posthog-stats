import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { type PaginationState } from "@tanstack/react-table";
import { fetchSavedWarehouseQueries, fetchInsights, runPostHogQuery, SavedWarehouseQuery, Insight, HogQLQueryBody, InsightVizNodeBody, PostHogQueryBody } from "@/services/posthog";
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

export const usePostHogView = (config: ApiConfig | null, selectedView: string | null, pagination: PaginationState, refreshInterval: number, onAuthError: () => void) => {
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

    const { viewType, viewValue, baseQuery, title, isHogQL, insightQuery } = React.useMemo(() => {
        const [type, value] = selectedView ? selectedView.split('__') : [null, null];
        let baseQuery: string | null = null;
        let title: string | null = null;
        let isHogQL = false;
        let insightQuery: InsightVizNodeBody | null = null;

        if (type === 'custom' && value && savedQueries) {
            const query = savedQueries.find(q => q.id === value);
            if (query) {
                baseQuery = query.query.query;
                title = query.name;
                isHogQL = true;
            }
        } else if (type === 'table' && value) {
            baseQuery = `SELECT * FROM ${value}`;
            const tableDef = POSTHOG_TABLES.find(t => t.value === value);
            title = tableDef ? `PostHog Table: ${tableDef.name}` : `PostHog Table: ${value}`;
            isHogQL = true;
        } else if (type === 'insight' && value && insights) {
            const insight = insights.find(i => i.short_id === value);
            if (insight && insight.query) {
                insightQuery = insight.query;
                title = `Insight: ${insight.name}`;
            }
        }
        return { viewType: type, viewValue: value, baseQuery, title, isHogQL, insightQuery };
    }, [selectedView, savedQueries, insights]);

    const { data: viewCounts } = useQuery<Map<string, number>, Error>({
        queryKey: ['batchCounts', config, savedQueries],
        queryFn: async () => {
            if (!config || !savedQueries) return new Map();

            const customQueries = savedQueries.map(q => 
                `SELECT '${`custom__${q.id}`}' as view_id, count() as total FROM (${q.query.query})`
            );

            const tableQueries = POSTHOG_TABLES.map(t => 
                `SELECT '${`table__${t.value}`}' as view_id, count() as total FROM ${t.value}`
            );

            const allCountQueries = [...customQueries, ...tableQueries];
            if (allCountQueries.length === 0) return new Map();

            const batchQuery: HogQLQueryBody = {
                kind: "HogQLQuery",
                query: allCountQueries.join(' UNION ALL ')
            };

            const result = await runPostHogQuery({ ...config, query: batchQuery });
            
            const countsMap = new Map<string, number>();
            if (result?.results) {
                result.results.forEach((row: [string, number]) => {
                    countsMap.set(row[0], row[1]);
                });
            }
            return countsMap;
        },
        enabled: !!config && !!savedQueries,
        refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    });

    const queryToRun = React.useMemo<PostHogQueryBody | null>(() => {
        if (isHogQL && baseQuery) {
            const offset = pagination.pageIndex * pagination.pageSize;
            return { kind: "HogQLQuery", query: `${baseQuery} LIMIT ${pagination.pageSize} OFFSET ${offset}` };
        }
        if (insightQuery) {
            return insightQuery;
        }
        return null;
    }, [baseQuery, isHogQL, insightQuery, pagination]);

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: ['posthogQuery', config, queryToRun],
        queryFn: () => {
            if (!config || !queryToRun) throw new Error("Configuration or query is missing.");
            return runPostHogQuery({ ...config, query: queryToRun });
        },
        enabled: !!config && !!queryToRun,
        refetchInterval: refreshInterval > 0 ? refreshInterval : false,
    });

    const totalRowCount = React.useMemo(() => {
        if (!selectedView) return 0;
        if (isHogQL) return viewCounts?.get(selectedView);
        return data?.results?.length;
    }, [selectedView, isHogQL, viewCounts, data]);

    return {
        savedQueries,
        insights,
        viewCounts,
        data,
        title,
        queryToRun,
        totalRowCount,
        isServerPaginated: isHogQL,
        isLoading: (isLoading || isLoadingQueries || isLoadingInsights),
        isFetching,
        isError,
        error,
    };
};