import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Insight {
    id: number;
    short_id: string;
    name: string;
    result: any;
    filters: Record<string, any>;
    description: string | null;
}

interface InsightCardProps {
    insight: Insight;
}

export const InsightCard = ({ insight }: InsightCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{insight.name || `Insight ${insight.short_id}`}</CardTitle>
                {insight.description && <CardDescription>{insight.description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <p className="text-sm font-medium mb-2">Result:</p>
                <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto">
                    {JSON.stringify(insight.result, null, 2)}
                </pre>
            </CardContent>
        </Card>
    );
};