import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/DateRangePicker";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { fetchInsights } from "@/services/posthog";
import { InsightCard } from "@/components/InsightCard";

interface FormData {
    projectId: string;
    apiKey: string;
    dateRange: DateRange;
    region: string;
}

const Index = () => {
    const [formData, setFormData] = React.useState<FormData | null>(null);
    const [projectId, setProjectId] = React.useState("");
    const [apiKey, setApiKey] = React.useState("");
    const [region, setRegion] = React.useState("US");
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -7),
        to: new Date(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (projectId && apiKey && date?.from && date?.to) {
            setFormData({
                projectId,
                apiKey,
                dateRange: { from: date.from, to: date.to },
                region,
            });
        } else {
            showError("Please fill in all fields.");
        }
    };

    const { data, isLoading, isError, error, isSuccess } = useQuery({
        queryKey: ['posthogInsights', formData],
        queryFn: () => {
            if (!formData) throw new Error("Form data is not available");
            return fetchInsights({
                projectId: formData.projectId,
                apiKey: formData.apiKey,
                dateFrom: formData.dateRange.from,
                dateTo: formData.dateRange.to,
                region: formData.region,
            });
        },
        enabled: !!formData,
        retry: false,
    });

    React.useEffect(() => {
        if (isError && error) {
            showError(error.message);
        }
    }, [isError, error]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">PostHog Stats Dashboard</h1>
                <p className="text-muted-foreground">Enter your details to fetch your project insights.</p>
            </header>

            <Card className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>Provide your PostHog Project ID and Personal API Key.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="projectId">Project ID</Label>
                            <Input id="projectId" placeholder="Your PostHog Project ID" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Personal API Key</Label>
                            <Input id="apiKey" type="password" placeholder="Your PostHog API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="region">Region</Label>
                            <Select value={region} onValueChange={setRegion}>
                                <SelectTrigger id="region">
                                    <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="US">US</SelectItem>
                                    <SelectItem value="EU">EU</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date Range</Label>
                            <DateRangePicker date={date} setDate={setDate} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Fetching..." : "Fetch Insights"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <section className="mt-12">
                {isLoading && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-24 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {isSuccess && data?.results.length > 0 && (
                    <>
                        <h2 className="text-2xl font-semibold mb-4 text-center">Your Insights</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {data.results.map((insight: any) => (
                                <InsightCard key={insight.id} insight={insight} />
                            ))}
                        </div>
                    </>
                )}

                {isSuccess && data?.results.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No insights found for the selected period.</p>
                    </div>
                )}
            </section>
            <MadeWithDyad />
        </div>
    );
};

export default Index;