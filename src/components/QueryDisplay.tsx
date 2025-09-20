import { useQuery } from "@tanstack/react-query";
import { runHogQLQuery } from "@/services/posthog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { QueryResultTable } from "./QueryResultTable";

interface QueryDisplayProps {
  query: string;
  projectId: string;
  apiKey: string;
  region: string;
}

export const QueryDisplay = ({ query, projectId, apiKey, region }: QueryDisplayProps) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['hogqlQuery', projectId, query],
    queryFn: () => runHogQLQuery({ projectId, apiKey, region, query }),
    enabled: !!query && !!projectId && !!apiKey,
    retry: false,
  });

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
};