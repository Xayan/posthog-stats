import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { runHogQLQuery } from "@/services/posthog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { QueryResultTable } from "./QueryResultTable";

interface QueryDisplayProps {
  title: string;
  query: string;
  projectId: string;
  apiKey: string;
  region: string;
  refetchInterval: number;
}

export const QueryDisplay = ({ title, query, projectId, apiKey, region, refetchInterval }: QueryDisplayProps) => {
  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['hogqlQuery', projectId, query],
    queryFn: () => runHogQLQuery({ projectId, apiKey, region, query }),
    enabled: !!query && !!projectId && !!apiKey,
    retry: false,
    refetchInterval: refetchInterval,
  });

  const [timerVisual, setTimerVisual] = React.useState("[   ]");

  React.useEffect(() => {
    if (isFetching) {
      setTimerVisual("[...]");
      return;
    }

    if (refetchInterval === 0) {
      setTimerVisual("");
      return;
    }

    let timerStep = 0;
    const timerStates = [
      "[.  ]",
      "[.. ]",
      "[ ..]",
      "[  .]",
      "[   ]",
    ];

    const intervalId = setInterval(() => {
      setTimerVisual(timerStates[timerStep]);
      timerStep = (timerStep + 1) % timerStates.length;
    }, 1000);

    return () => clearInterval(intervalId);
  }, [refetchInterval, isFetching]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-5/6" />
        </div>
      );
    }
  
    if (isError) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Query Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      );
    }
  
    if (data) {
      return <QueryResultTable data={data} />;
    }
  
    return null;
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        {refetchInterval > 0 && (
          <span className="ml-4 font-mono text-sm text-muted-foreground w-[4ch]">{timerVisual}</span>
        )}
      </div>
      {renderContent()}
    </div>
  );
};