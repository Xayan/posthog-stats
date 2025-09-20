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
  const [timerVisual, setTimerVisual] = React.useState("");

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (isFetching) {
      let state = 0;
      const busyStates = ["[## ]", "[ ##]"];
      setTimerVisual(busyStates[0]);
      intervalId = setInterval(() => {
        state = (state + 1) % busyStates.length;
        setTimerVisual(busyStates[state]);
      }, 200);
    } else if (refetchInterval > 0) {
      let timerStep = 0;
      const timerStates = ["[   ]", "[.  ]", "[.. ]", "[ ..]", "[  .]"];
      setTimerVisual(timerStates[0]);
      intervalId = setInterval(() => {
        timerStep = (timerStep + 1) % timerStates.length;
        setTimerVisual(timerStates[timerStep]);
      }, 1000);
    } else {
      setTimerVisual("");
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isFetching, refetchInterval]);

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
