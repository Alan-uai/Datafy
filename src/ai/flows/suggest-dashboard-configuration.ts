'use server';

/**
 * @fileOverview AI flow to suggest an optimal dashboard configuration based on user role and data sources.
 *
 * - suggestDashboardConfiguration - A function that suggests dashboard configurations.
 * - SuggestDashboardConfigurationInput - The input type for the suggestDashboardConfiguration function.
 * - SuggestDashboardConfigurationOutput - The return type for the suggestDashboardConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDashboardConfigurationInputSchema = z.object({
  userRole: z.string().describe('The role of the user.'),
  availableDataSources: z
    .array(z.string())
    .describe('A list of available data sources.'),
});
export type SuggestDashboardConfigurationInput = z.infer<
  typeof SuggestDashboardConfigurationInputSchema
>;

const SuggestDashboardConfigurationOutputSchema = z.object({
  suggestedWidgets: z
    .array(z.string())
    .describe('A list of suggested widget configurations.'),
  rationale: z
    .string()
    .describe('The AI rationale for the suggested configuration.'),
});
export type SuggestDashboardConfigurationOutput = z.infer<
  typeof SuggestDashboardConfigurationOutputSchema
>;

export async function suggestDashboardConfiguration(
  input: SuggestDashboardConfigurationInput
): Promise<SuggestDashboardConfigurationOutput> {
  return suggestDashboardConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDashboardConfigurationPrompt',
  input: {schema: SuggestDashboardConfigurationInputSchema},
  output: {schema: SuggestDashboardConfigurationOutputSchema},
  prompt: `You are an AI dashboard configuration expert. Given the user's role and available data sources, suggest an optimal dashboard configuration.

User Role: {{{userRole}}}
Available Data Sources: {{#each availableDataSources}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

Suggest specific widgets and explain why they would be useful for this user.

Output should be in the following JSON format:
{
  "suggestedWidgets": ["widget1", "widget2"],
  "rationale": "Explanation of why these widgets are suggested."
}
`,
});

const suggestDashboardConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestDashboardConfigurationFlow',
    inputSchema: SuggestDashboardConfigurationInputSchema,
    outputSchema: SuggestDashboardConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
