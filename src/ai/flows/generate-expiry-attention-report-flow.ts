'use server';
/**
 * @fileOverview Flow to generate a report on products nearing their expiry date.
 *
 * - generateExpiryAttentionReport - A function that analyzes products and generates a report.
 * - ExpiryAttentionReportInput - The input type for the report generation.
 * - ExpiryAttentionReport - The output type for the report generation.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {Product} from '@/types';

const ExpiryAttentionReportInputSchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      produto: z.string().describe('The name of the product.'),
      marca: z.string().optional().describe('The brand of the product.'),
      unidade: z.string().optional().describe('The unit of the product (e.g., kg, L, unit).'),
      validade: z.string().describe("The product's expiry date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)."),
    })
  ).describe('An array of products to be analyzed.'),
  attentionHorizonDays: z.number().int().positive().describe('The number of days to look ahead for expiring products.'),
  topNProducts: z.number().int().positive().describe('The number of most critical products to include in the detailed report.'),
});
export type ExpiryAttentionReportInput = z.infer<typeof ExpiryAttentionReportInputSchema>;

const ExpiryAttentionReportSchema = z.object({
  criticalItems: z.array(
    z.object({
      productName: z.string().describe('The name of the critical product.'),
      brand: z.string().optional().describe('The brand of the critical product.'),
      quantity: z.number().describe('The quantity of the critical product.'),
      expiryDate: z.string().describe("The expiry date of the critical product in 'YYYY-MM-DD' format."),
      suggestion: z.string().describe('A brief, actionable suggestion for this specific product (e.g., "Use in a recipe," "Donate," "Promote sale").'),
    })
  ).describe('A list of the most critical products that require immediate attention.'),
  overallSummary: z.string().describe('A concise, one-sentence summary of the overall situation. Example: "Found 2 critical items nearing expiry, suggest immediate action." or "No critical items found in the 7-day horizon among 25 products analyzed. Good work!"'),
  analyzedProductsCount: z.number().int().describe('The total number of products that were analyzed.'),
  criticalProductsCount: z.number().int().describe('The number of products identified as critical.'),
});
export type ExpiryAttentionReport = z.infer<typeof ExpiryAttentionReportSchema>;


export async function generateExpiryAttentionReport(
  input: ExpiryAttentionReportInput
): Promise<ExpiryAttentionReport> {
  return expiryAttentionFlow(input);
}


const prompt = ai.definePrompt({
  name: 'expiryAttentionPrompt',
  input: { schema: ExpiryAttentionReportInputSchema },
  output: { schema: ExpiryAttentionReportSchema },
  prompt: `
    You are an expert inventory management assistant for a home user.
    Your task is to analyze a list of grocery products and identify the most critical items that need attention due to their upcoming expiry dates.
    The user wants a clear, actionable report. Today's date is ${new Date().toISOString().split('T')[0]}.

    Analyze the following products:
    {{#each products}}
    - Product: {{{produto}}}, Brand: {{{marca}}}, Expires: {{{validade}}}
    {{/each}}

    Your criteria for "critical" are products that are expiring within the next {{{attentionHorizonDays}}} days.
    
    Please provide a report with the following structure:
    1.  **Critical Items**: Identify the top {{{topNProducts}}} most critical products based on the proximity of their expiry date. For each, provide the product name, brand, quantity, expiry date, and a practical, creative suggestion for what to do with it to avoid waste (e.g., a recipe idea, a specific use, a donation suggestion).
    2.  **Overall Summary**: Give a single-sentence summary of the situation. Mention the number of critical items found and the total number of products analyzed.
    3.  **Counts**: Provide the exact counts for 'analyzedProductsCount' and 'criticalProductsCount'.
  `,
});

const expiryAttentionFlow = ai.defineFlow(
  {
    name: 'expiryAttentionFlow',
    inputSchema: ExpiryAttentionReportInputSchema,
    outputSchema: ExpiryAttentionReportSchema,
  },
  async (input) => {
    // A simple passthrough for now, but could include more logic later
    const { output } = await prompt(input);
    return output!;
  }
);
