import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface ConnectionInfoProps {
  projectId: string;
  onSignOut: () => void;
  isEnvConfig: boolean;
}

export const ConnectionInfo = ({ projectId, onSignOut, isEnvConfig }: ConnectionInfoProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card text-card-foreground p-2 px-4 mb-8">
      <p className="text-sm text-muted-foreground">
        Connected to Project: <span className="font-semibold text-foreground">{projectId}</span>
      </p>
      {!isEnvConfig && (
        <Button variant="ghost" size="sm" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      )}
    </div>
  );
};