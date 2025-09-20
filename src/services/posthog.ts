import { format } from 'date-fns';

const POSTHOG_API_URL = "https://app.posthog.com/api/";

interface FetchInsightsParams {
    projectId: string;
    apiKey: string;
    dateFrom: Date;
    dateTo: Date;
}

export const fetchInsights = async ({ projectId, apiKey, dateFrom, dateTo }: FetchInsightsParams) => {
    const formattedDateFrom = format(dateFrom, 'yyyy-MM-dd');
    const formattedDateTo = format(dateTo, 'yyyy-MM-dd');

    const response = await fetch(`${POSTHOG_API_URL}projects/${projectId}/insights/?date_from=${formattedDateFrom}&date_to=${formattedDateTo}`, {
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