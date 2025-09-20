import { format } from 'date-fns';

export interface SavedWarehouseQuery {
    id: string;
    name: string;
    query: {
        query: string;
    };
}

export interface Insight {
    id: number;
    name: string;
    short_id: string;
}

interface ApiConfig {
    projectId: string;
    apiKey: string;
    region: string;
}

export const fetchSavedWarehouseQueries = async ({ projectId, apiKey, region }: ApiConfig) => {
    const baseUrl = region === 'EU' ? "https://eu.posthog.com/api/" : "https://app.posthog.com/api/";
    const response = await fetch(`${baseUrl}projects/${projectId}/warehouse_saved_queries/`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch saved queries. Check your credentials and permissions.');
    }
    const data = await response.json();
    return data.results as SavedWarehouseQuery[];
};

export const fetchInsights = async ({ projectId, apiKey, region }: ApiConfig) => {
    const baseUrl = region === 'EU' ? "https://eu.posthog.com/api/" : "https://app.posthog.com/api/";
    const response = await fetch(`${baseUrl}projects/${projectId}/insights/?limit=100`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch insights. Check your credentials and permissions.');
    }
    const data = await response.json();
    return data.results as Insight[];
};

type HogQLQueryBody = {
    kind: "HogQLQuery";
    query: string;
};

type SavedInsightNodeBody = {
    kind: "SavedInsightNode";
    id: string; // Use 'id' for the short_id of the insight
};

type PostHogQueryBody = HogQLQueryBody | SavedInsightNodeBody;

interface RunQueryConfig extends ApiConfig {
    query: PostHogQueryBody;
}

export const runPostHogQuery = async ({ projectId, apiKey, region, query }: RunQueryConfig) => {
    const baseUrl = region === 'EU' ? "https://eu.posthog.com/api/" : "https://app.posthog.com/api/";
    const response = await fetch(`${baseUrl}projects/${projectId}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to run query.');
    }
    return response.json();
};