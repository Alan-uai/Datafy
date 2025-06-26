import React, { useState, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, AlertCircle, Info, XCircle, CheckCircle } from 'lucide-react'; // Import X instead of Close
import { cn } from '@/lib/utils'; // Assuming cn is needed for icon classnames

interface Message {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}

interface MessageDisplayProps {
  messages: Message[];
  onDismiss: (messageId: string) => void;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  onDismiss,
}) => {

  const getIconForVariant = (variant: Message['variant']) => {
    switch (variant) {
      case 'success':
        return <CheckCircle className={cn("h-4 w-4 text-green-500 dark:text-green-400")} />;
      case 'error':
        return <XCircle className={cn("h-4 w-4 text-destructive")} />;
      case 'warning':
        return <AlertCircle className={cn("h-4 w-4 text-orange-500 dark:text-orange-400")} />;
      case 'info':
        return <Info className={cn("h-4 w-4 text-blue-500 dark:text-blue-400")} />;
      default:
        return null; // No icon for default or unknown variant
    }
  };

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Alert
          key={message.id}
          variant={message.variant === 'error' ? 'destructive' : 'default'} // Use destructive variant from ui/alert for 'error' messages
          className="relative"
        >
          {getIconForVariant(message.variant)} {/* Render the appropriate icon */}
          <AlertTitle>{message.message}</AlertTitle>
          {/* <AlertDescription>This is a description</AlertDescription> */}
          {/* Removed placeholder description if not needed */}
          <button
            onClick={() => onDismiss(message.id)}
            className="absolute top-2 right-2 p-1 rounded-md opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" /> {/* Use X component */} 
          </button>
        </Alert>
      ))}
    </div>
  );
};

interface Message {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}
