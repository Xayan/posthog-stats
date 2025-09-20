import { format } from 'date-fns';

interface FetchInsightsParams {
    projectId: string;
    apiKey: string;
    dateFrom: Date;
    dateTo: Date;
    region: string;
}

export const fetchInsights = async ({ projectId, apiKey, dateFrom, dateTo, region }: FetchInsightsParams) => {
    const baseUrl = region === 'EU' ? "https://eu.posthog.com/api/" : "https://app.posthog.com/api/";
    const formattedDateFrom = format(dateFrom, 'yyyy-MM-dd');
    const formattedDateTo = format(dateTo, 'yyyy-MM-dd');

    const response = await fetch(`${baseUrl}projects/${projectId}/insights/?date_from=${formattedDateFrom}&date_to=${formattedDateTo}`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch insights from PostHog. Check your Project ID and API Key.');
    }

    return response.json();
};