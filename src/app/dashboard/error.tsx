"use client"; 

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-var(--header-height,4rem))]">
      <div className="text-center p-8 border rounded-lg shadow-lg bg-card max-w-md">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-3 font-headline">Oops! Something went wrong.</h2>
        <p className="text-muted-foreground mb-6">
          An unexpected error occurred on the dashboard. We apologize for the inconvenience.
        </p>
        <p className="text-sm text-muted-foreground mb-1">Error details:</p>
        <pre className="text-xs bg-muted p-2 rounded-md text-left overflow-auto max-h-32 mb-6">
          {error.message || "Unknown error"}
        </pre>
        <Button
          onClick={() => reset()}
          variant="default"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
