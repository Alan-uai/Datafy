"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { suggestDashboardConfiguration } from '@/ai/flows/suggest-dashboard-configuration.ts';
import type { SuggestDashboardConfigurationOutput } from '@/ai/flows/suggest-dashboard-configuration.ts';
import { Wand2, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const aiAssistantSchema = z.object({
  userRole: z.string().min(1, { message: "User role is required." }),
  availableDataSources: z.array(z.string()).min(1, { message: "Select at least one data source." }),
});

type AiAssistantFormInputs = z.infer<typeof aiAssistantSchema>;

const availableRoles = ["Sales Manager", "Developer", "Marketing Analyst", "Product Owner", "Support Agent"];
const allDataSources = ["CRM Data", "User Analytics", "Error Logs", "Financial Records", "Social Media Metrics", "Inventory System"];

export function AiAssistant() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestDashboardConfigurationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, control, watch, setValue } = useForm<AiAssistantFormInputs>({
    resolver: zodResolver(aiAssistantSchema),
    defaultValues: {
      userRole: user?.role || '',
      availableDataSources: [],
    },
  });

  const selectedDataSources = watch('availableDataSources', []);

  const onSubmit: SubmitHandler<AiAssistantFormInputs> = async (data) => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestDashboardConfiguration({
        userRole: data.userRole,
        availableDataSources: data.availableDataSources,
      });
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get suggestions.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline text-xl">AI Dashboard Assistant</CardTitle>
        </div>
        <CardDescription>Get AI-powered suggestions for your dashboard configuration based on your role and data.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userRole">Your Role</Label>
            <Controller
              name="userRole"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value || user?.role}>
                  <SelectTrigger id="userRole">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.userRole && <p className="text-sm text-destructive">{errors.userRole.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Available Data Sources (select multiple)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allDataSources.map(source => (
                    <Button
                        key={source}
                        type="button"
                        variant={selectedDataSources.includes(source) ? "default" : "outline"}
                        onClick={() => {
                            const currentSources = selectedDataSources;
                            if (currentSources.includes(source)) {
                                setValue('availableDataSources', currentSources.filter(s => s !== source));
                            } else {
                                setValue('availableDataSources', [...currentSources, source]);
                            }
                        }}
                        className="w-full justify-start text-left h-auto py-2"
                    >
                        {selectedDataSources.includes(source) && <CheckCircle className="mr-2 h-4 w-4" />}
                        {source}
                    </Button>
                ))}
            </div>
            {errors.availableDataSources && <p className="text-sm text-destructive">{errors.availableDataSources.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Getting Suggestions...' : 'Get AI Suggestions'}
          </Button>
        </CardFooter>
      </form>

      {error && (
        <Alert variant="destructive" className="m-6 mt-0">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {suggestions && (
        <div className="p-6 border-t">
          <h3 className="text-lg font-semibold mb-2 font-headline">AI Suggestions:</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Suggested Widgets:</h4>
              {suggestions.suggestedWidgets.length > 0 ? (
                <ul className="list-disc list-inside pl-4 text-sm text-muted-foreground space-y-1">
                  {suggestions.suggestedWidgets.map((widget, index) => (
                    <li key={index}>{widget}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No specific widget suggestions provided.</p>
              )}
            </div>
            <div>
              <h4 className="font-medium">Rationale:</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{suggestions.rationale}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
