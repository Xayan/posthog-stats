import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

interface QueryDisplayProps {
  title: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  refetchInterval: number;
  hasData: boolean;
  children: React.ReactNode;
}

export const QueryDisplay = ({ title, isLoading, isError, error, isFetching, refetchInterval, hasData, children }: QueryDisplayProps) => {
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
          <AlertDescription>{error?.message}</AlertDescription>
        </Alert>
      );
    }
  
    if (hasData) {
      return children;
    }
  
    return null;
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        {refetchInterval > 0 && (
          <span className="ml-4 font-mono text-sm text-muted-foreground w-[5ch] whitespace-pre">{timerVisual}</span>
        )}
      </div>
      {renderContent()}
    </div>
  );
};