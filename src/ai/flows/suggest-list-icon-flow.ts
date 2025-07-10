'use server';
/**
 * @fileOverview Flow to suggest a lucide-react icon name based on a list name.
 *
 * - suggestListIcon - A function that suggests an icon for a list.
 * - SuggestListIconInput - The input type for the icon suggestion.
 * - SuggestListIconOutput - The output type for the icon suggestion.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// List of valid Lucide icons available in DynamicIcon component
const availableIcons = ["Beer", "Refrigerator", "Snowflake", "Weight", "ShoppingCart", "Apple", "Carrot", "Milk", "Package", "List", "Home", "Gift", "Box", "Utensils", "Heart", "Star", "Zap", "Camera", "Music", "Palette", "Smartphone", "Crown"];

const SuggestListIconInputSchema = z.object({
  listName: z.string().describe('The name of the list for which to suggest an icon.'),
});
export type SuggestListIconInput = z.infer<typeof SuggestListIconInputSchema>;

const SuggestListIconOutputSchema = z.object({
  iconName: z.string().describe(`The suggested name of a lucide-react icon. Must be one of the following: ${availableIcons.join(', ')}`),
});
export type SuggestListIconOutput = z.infer<typeof SuggestListIconOutputSchema>;

export async function suggestListIcon(
  input: SuggestListIconInput
): Promise<SuggestListIconOutput> {
  return suggestListIconFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestListIconPrompt',
  input: { schema: SuggestListIconInputSchema },
  output: { schema: SuggestListIconOutputSchema },
  prompt: `
    You are an icon suggestion expert.
    Based on the list name provided, suggest the most appropriate icon name from the allowed list.
    
    List Name: {{{listName}}}

    Allowed Icon Names: ${availableIcons.join(', ')}

    Your response must be one of the allowed icon names.
  `,
});

const suggestListIconFlow = ai.defineFlow(
  {
    name: 'suggestListIconFlow',
    inputSchema: SuggestListIconInputSchema,
    outputSchema: SuggestListIconOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    
    if (output && availableIcons.includes(output.iconName)) {
        return output;
    }

    // Fallback in case of invalid response
    return { iconName: 'List' };
  }
);
