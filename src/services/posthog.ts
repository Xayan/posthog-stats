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
    query: any; // Assume the insight object contains its full query definition
}

export interface TableInfo {
    name: string;
    id: string;
}

interface ApiConfig {
    projectId: string;
    apiKey: string;
    baseUrl: string;
}

const getApiRoot = (baseUrl: string): string => {
    if (!baseUrl) return '';
    // Remove trailing slash if it exists, then add /api/
    const sanitizedUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${sanitizedUrl}/api/`;
};

export const fetchSavedWarehouseQueries = async ({ projectId, apiKey, baseUrl }: ApiConfig) => {
    const apiRoot = getApiRoot(baseUrl);
    const response = await fetch(`${apiRoot}projects/${projectId}/warehouse_saved_queries/`, {
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

export const fetchInsights = async ({ projectId, apiKey, baseUrl }: ApiConfig) => {
    const apiRoot = getApiRoot(baseUrl);
    const response = await fetch(`${apiRoot}projects/${projectId}/insights/?limit=100`, {
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

// Function to fetch tables from the PostHog data warehouse connections
const fetchWarehouseTables = async ({ projectId, apiKey, baseUrl }: ApiConfig): Promise<TableInfo[]> => {
    const apiRoot = getApiRoot(baseUrl);
    
    const response = await fetch(`${apiRoot}projects/${projectId}/warehouse_tables/`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch warehouse tables. Check your credentials and permissions.');
    }
    const data = await response.json();
    return data.results.map((table: { name: string; id: string }) => ({
        name: table.name,
        id: table.id
    }));
};

// Explicitly define common PostHog system tables
const getCoreSystemTables = (): TableInfo[] => [
    { name: 'Events', id: 'events' },
    { name: 'Persons', id: 'persons' },
    { name: 'Cohort People', id: 'cohort_people' },
    { name: 'Groups', id: 'groups' },
];

// Combined function to fetch all available tables (warehouse and system)
export const fetchAvailableTables = async (config: ApiConfig): Promise<TableInfo[]> => {
    const warehouseTables = await fetchWarehouseTables(config);
    const systemTables = getCoreSystemTables();

    const allTablesMap = new Map<string, TableInfo>();
    
    // Add system tables first
    systemTables.forEach(table => allTablesMap.set(table.id, table));
    
    // Add warehouse tables, overwriting if there's a name collision (warehouse takes precedence)
    warehouseTables.forEach(table => allTablesMap.set(table.id, table));

    return Array.from(allTablesMap.values());
};

export type HogQLQueryBody = {
    kind: "HogQLQuery";
    query: string;
};

export type InsightVizNodeBody = {
    kind: "InsightVizNode";
    source: any; // The source is the actual insight query definition
};

export type PostHogQueryBody = HogQLQueryBody | InsightVizNodeBody;

interface RunQueryConfig extends ApiConfig {
    query: PostHogQueryBody;
}

export const runPostHogQuery = async ({ projectId, apiKey, baseUrl, query }: RunQueryConfig) => {
    const apiRoot = getApiRoot(baseUrl);
    const response = await fetch(`${apiRoot}projects/${projectId}/query`, {
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