
'use server';
/**
 * @fileOverview A Genkit flow to generate a human-readable summary of product expiry stats.
 *
 * - generateExpirySummaryText - A function that generates the summary.
 * - GenerateExpirySummaryTextInput - The input type for the function.
 * - GenerateExpirySummaryTextOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateExpirySummaryTextInputSchema = z.object({
  listName: z.string().describe('The name of the product list.'),
  stats: z.object({
    total: z.number().describe('Total number of items in the list.'),
    expiringSoon: z.number().describe('Number of items expiring within the next 7 days (but not yet expired).'),
    expired: z.number().describe('Number of items already expired.'),
  }),
});
export type GenerateExpirySummaryTextInput = z.infer<typeof GenerateExpirySummaryTextInputSchema>;

const GenerateExpirySummaryTextOutputSchema = z.object({
  summaryText: z.string().describe('A short, friendly, and actionable summary phrase (1-2 sentences) about the expiry status of the list.'),
});
export type GenerateExpirySummaryTextOutput = z.infer<typeof GenerateExpirySummaryTextOutputSchema>;

export async function generateExpirySummaryText(input: GenerateExpirySummaryTextInput): Promise<GenerateExpirySummaryTextOutput> {
  return generateExpirySummaryTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExpirySummaryTextPrompt',
  input: { schema: GenerateExpirySummaryTextInputSchema },
  output: { schema: GenerateExpirySummaryTextOutputSchema },
  prompt: `You are a helpful and friendly pantry assistant.
For the product list named "{{listName}}", here are the expiry statistics:
- Total items: {{stats.total}}
- Items expiring soon (next 7 days): {{stats.expiringSoon}}
- Items already expired: {{stats.expired}}

Generate a single, concise, friendly, and actionable summary sentence (max 2 sentences) based on these stats.

Examples:
- If expired > 0 and expiringSoon > 0: "Na lista '{{listName}}', {{stats.expired}} itens venceram e {{stats.expiringSoon}} estão quase lá! Que tal usá-los logo?"
- If expired > 0 and expiringSoon == 0: "Alerta na despensa '{{listName}}'! {{stats.expired}} itens já passaram da validade. Hora da limpeza!"
- If expired == 0 and expiringSoon > 0: "Fique de olho na lista '{{listName}}': {{stats.expiringSoon}} itens vencem em breve. Planeje suas refeições!"
- If expired == 0 and expiringSoon == 0 and total > 0: "Tudo em ordem com as validades na lista '{{listName}}'! Produtos frescos e prontos para uso."
- If expired == 0 and expiringSoon == 0 and total == 0: "Sua lista '{{listName}}' está vazia. Adicione alguns produtos para começar!"
- If total > 0 but specific stats for expiring/expired are low, focus on the positive: "Sua lista '{{listName}}' está bem organizada! Apenas {{stats.expiringSoon}} itens vencendo em breve."

Be encouraging and helpful. Keep it short.
`,
});

const generateExpirySummaryTextFlow = ai.defineFlow(
  {
    name: 'generateExpirySummaryTextFlow',
    inputSchema: GenerateExpirySummaryTextInputSchema,
    outputSchema: GenerateExpirySummaryTextOutputSchema,
  },
  async (input) => {
    try {
      // Basic fallback if AI fails or stats are zero in a way that might confuse the AI prompt significantly
      if (input.stats.total === 0) {
        return { summaryText: `Sua lista '${input.listName}' está vazia. Adicione alguns produtos!` };
      }
      if (input.stats.expired === 0 && input.stats.expiringSoon === 0 && input.stats.total > 0) {
        return { summaryText: `Tudo certo com as validades na lista '${input.listName}'! Nenhum item vencido ou vencendo em breve.` };
      }

      const { output } = await prompt(input);
      if (output && output.summaryText) {
        return output;
      }
      console.warn('Expiry summary text generation failed to produce output. Using basic summary.');
      // Fallback to a more direct, less "AI-like" summary if needed
      let fallbackText = `Lista '${input.listName}': ${input.stats.total} itens.`;
      if (input.stats.expiringSoon > 0) fallbackText += ` ${input.stats.expiringSoon} vencendo em breve.`;
      if (input.stats.expired > 0) fallbackText += ` ${input.stats.expired} vencidos.`;
      return { summaryText: fallbackText };

    } catch (error) {
      console.error("Error in generateExpirySummaryTextFlow:", error);
      let fallbackText = `Resumo da lista '${input.listName}': ${input.stats.total} itens totais.`;
      if (input.stats.expiringSoon > 0) fallbackText += ` ${input.stats.expiringSoon} perto de vencer.`;
      if (input.stats.expired > 0) fallbackText += ` ${input.stats.expired} já vencidos.`;
      return { summaryText: fallbackText };
    }
  }
);
