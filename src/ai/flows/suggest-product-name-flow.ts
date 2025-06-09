
'use server';
/**
 * @fileOverview A Genkit flow to suggest a product name and brand.
 *
 * - suggestProductName - A function that suggests a product name and brand.
 * - SuggestProductNameInput - The input type for the suggestProductName function.
 * - SuggestProductNameOutput - The return type for the suggestProductName function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestProductNameInputSchema = z.object({
  currentInput: z.string().describe('The current text input for the product name, which could be a barcode number, a partial name, or a description.'),
  currentBrand: z.string().optional().describe('The current text input for the product brand, if any.'),
});
export type SuggestProductNameInput = z.infer<typeof SuggestProductNameInputSchema>;

const SuggestProductNameOutputSchema = z.object({
  suggestedName: z.string().describe('A concise and common product name suitable for an inventory or shopping list. If the input is a number (like a barcode), try to infer a common product.'),
  suggestedBrand: z.string().optional().describe('A common brand associated with the product, if inferable.'),
});
export type SuggestProductNameOutput = z.infer<typeof SuggestProductNameOutputSchema>;

export async function suggestProductName(input: SuggestProductNameInput): Promise<SuggestProductNameOutput> {
  return suggestProductNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestProductNamePrompt',
  input: { schema: SuggestProductNameInputSchema },
  output: { schema: SuggestProductNameOutputSchema },
  prompt: `You are an expert assistant for inventory management.
Given the current input for a product, which might be a barcode number (e.g., "7891000000000"), a partial name (e.g., "leite cond"), or a short description (e.g., "detergente para louças Ypê"):
Current Input: "{{{currentInput}}}"
{{#if currentBrand}}Current Brand: "{{{currentBrand}}}"{{/if}}

Suggest a concise, common product name and, if possible, a brand.
Focus on terms typically used in shopping lists or home inventories.
- If the input is clearly a barcode number, try to suggest a very common, generic product type if a specific one isn't known (e.g., "Refrigerante Cola", "Biscoito Água e Sal").
- If a brand is mentioned in the input, extract it to suggestedBrand and keep the product name generic (e.g., input "Nescau Cereal Matinal 200g" -> name: "Cereal Matinal", brand: "Nescau").
- If no brand is obvious, suggest only the product name.
- Aim for clarity and brevity. Examples:
  - Input: "7891000315502" -> Name: "Leite Condensado", Brand: "Moça" (if known, otherwise just "Leite Condensado")
  - Input: "leite int" -> Name: "Leite Integral"
  - Input: "coca cola 2l" -> Name: "Refrigerante Cola 2L", Brand: "Coca-Cola"
  - Input: "sabão em pó Omo lavagem perfeita" -> Name: "Sabão em Pó Lavagem Perfeita", Brand: "Omo"
  - Input: "Pão de Forma Pullman Artesano" -> Name: "Pão de Forma Artesano", Brand: "Pullman"

Output only the suggestedName and optionally suggestedBrand.
If the input is very generic and no specific product can be inferred (e.g. "item"), return the input as suggestedName.
`,
});

const suggestProductNameFlow = ai.defineFlow(
  {
    name: 'suggestProductNameFlow',
    inputSchema: SuggestProductNameInputSchema,
    outputSchema: SuggestProductNameOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (output) {
        return output;
      }
      // Fallback if LLM fails or returns no output
      console.warn('Product name suggestion failed. Falling back.');
      return { suggestedName: input.currentInput, suggestedBrand: input.currentBrand || '' };
    } catch (error) {
      console.error("Error in suggestProductNameFlow:", error);
      return { suggestedName: input.currentInput, suggestedBrand: input.currentBrand || '' };
    }
  }
);
