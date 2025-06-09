
'use server';
/**
 * @fileOverview A Genkit flow to suggest a lucide-react icon name for a product list.
 *
 * - suggestListIcon - A function that suggests an icon name.
 * - SuggestListIconInput - The input type for the suggestListIcon function.
 * - SuggestListIconOutput - The return type for the suggestListIcon function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as LucideIcons from 'lucide-react';

// Generate a list of valid Lucide icon names
const validIconNames = Object.keys(LucideIcons).filter(
  key => 
    key !== 'createLucideIcon' && 
    key !== 'icons' && 
    typeof LucideIcons[key as keyof typeof LucideIcons] === 'object' &&
    key[0] === key[0].toUpperCase() // Ensure it's a PascalCase component name
);

const SuggestListIconInputSchema = z.object({
  listName: z.string().describe('The name of the product list for which an icon is being suggested.'),
  currentIconName: z.string().optional().describe('The current icon name, if one is already set or suggested, to potentially avoid suggesting the same one or to suggest alternatives.'),
});
export type SuggestListIconInput = z.infer<typeof SuggestListIconInputSchema>;

const SuggestListIconOutputSchema = z.object({
  iconName: z.string().describe(`A relevant icon name from the lucide-react library for the given list name. The icon name must be one of the following valid PascalCase names: ${validIconNames.slice(0, 150).join(', ')} (sample). Prefer common and intuitive icons. If the list name is very generic, suggest "ListChecks" or "ClipboardList".`),
});
export type SuggestListIconOutput = z.infer<typeof SuggestListIconOutputSchema>;

export async function suggestListIcon(input: SuggestListIconInput): Promise<SuggestListIconOutput> {
  return suggestListIconFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestListIconPrompt',
  input: { schema: SuggestListIconInputSchema },
  output: { schema: SuggestListIconOutputSchema },
  prompt: `You are an expert UI assistant. Your task is to suggest a relevant icon name from the lucide-react library for a given product list name.
The icon name MUST be a valid PascalCase name from the lucide-react library.
Consider the context of a product or inventory management app.

List Name: {{{listName}}}
{{#if currentIconName}}Current Icon: {{{currentIconName}}}{{/if}}

Based on the list name, suggest the most appropriate icon.
For example:
- If the list name is "Frutas e Vegetais", suggest "Apple" or "Carrot".
- If "Eletrônicos", suggest "Laptop" or "Smartphone".
- If "Roupas", suggest "Shirt".
- If "Limpeza", suggest "Sparkles" or "SprayCan".
- If "Compras da Semana", suggest "ShoppingCart".
- If the list name is very generic like "Minha Lista" or "Geral", suggest "ListChecks" or "ClipboardList".

Provide only ONE icon name in the 'iconName' field of your output.
Valid lucide-react icon names (sample, prefer these if applicable, but you can use others from the full library if more suitable): 
${validIconNames.filter(name => !name.endsWith("Icon") && name !== 'LucideIcon' && name !== 'default').slice(0, 150).join(', ')}

Suggest an icon for: "{{listName}}"
`,
});

const suggestListIconFlow = ai.defineFlow(
  {
    name: 'suggestListIconFlow',
    inputSchema: SuggestListIconInputSchema,
    outputSchema: SuggestListIconOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (output && validIconNames.includes(output.iconName)) {
        return output;
      }
      // Fallback if LLM fails or returns invalid icon
      console.warn(`Suggested icon "${output?.iconName}" is not valid. Falling back.`);
      return { iconName: input.listName.toLowerCase().includes('compra') ? 'ShoppingCart' : 'List' };
    } catch (error) {
        console.error("Error in suggestListIconFlow:", error);
        // Fallback in case of any error during the flow
        return { iconName: input.listName.toLowerCase().includes('compra') ? 'ShoppingCart' : 'List' };
    }
  }
);
