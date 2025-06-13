
'use server';
/**
 * @fileOverview A Genkit flow to analyze products and report on critical expiries.
 *
 * - generateExpiryAttentionReport - Analyzes products and identifies critical items.
 * - GenerateExpiryAttentionReportInput - Input type for the flow.
 * - ExpiryAttentionReport - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  parseISO,
  differenceInDays,
  isValid,
  isFuture,
  startOfDay,
} from 'date-fns';
import type { Product, GenerateExpiryAttentionReportInput, ExpiryAttentionReport, CriticalExpiryItem } from '@/types';

const ProductSchema = z.object({
  id: z.string(),
  originalId: z.string().optional(),
  listId: z.string(),
  produto: z.string(),
  marca: z.string().optional(), // Changed to optional
  unidade: z.string(),
  validade: z.string(),
  isExploding: z.boolean().optional(),
});

const GenerateExpiryAttentionReportInputSchema = z.object({
  products: z.array(ProductSchema).describe('List of products to analyze.'),
  attentionHorizonDays: z.number().optional().default(15).describe('How many days in advance to look for expiries (e.g., 15 for next 15 days).'),
  topNProducts: z.number().optional().default(5).describe('Maximum number of most critical products to return in the detailed list.'),
});

const CriticalExpiryItemSchema = z.object({
  productName: z.string(),
  brand: z.string().optional(),
  quantity: z.string(),
  expiryDate: z.string().describe('Expiry date in YYYY-MM-DD format.'),
  daysUntilExpiry: z.number().describe('Number of days remaining until expiry.'),
  riskScore: z.number().describe('A score indicating criticality (higher is more critical).'),
  suggestion: z.string().describe('A brief, actionable suggestion for the employee.'),
});

const ExpiryAttentionReportSchema = z.object({
  criticalItems: z.array(CriticalExpiryItemSchema).describe('A list of the most critical products nearing expiry with high stock.'),
  overallSummary: z.string().describe('A general summary message about the findings.'),
  analyzedProductsCount: z.number().describe('Total number of products analyzed (excluding already expired).'),
  criticalProductsCount: z.number().describe('Number of products identified as critical within the horizon.'),
});

export async function generateExpiryAttentionReport(
  input: GenerateExpiryAttentionReportInput
): Promise<ExpiryAttentionReport> {
  return generateExpiryAttentionReportFlow(input);
}

const generateExpiryAttentionReportFlow = ai.defineFlow(
  {
    name: 'generateExpiryAttentionReportFlow',
    inputSchema: GenerateExpiryAttentionReportInputSchema,
    outputSchema: ExpiryAttentionReportSchema,
  },
  async (input) => {
    const { products, attentionHorizonDays = 15, topNProducts = 5 } = input;
    const today = startOfDay(new Date());
    let processedProducts: CriticalExpiryItem[] = [];
    let analyzedCount = 0;

    products.forEach((p) => {
      if (!p.validade || !isValid(parseISO(p.validade))) {
        return; // Skip products with invalid or no expiry date
      }
      const expiryDate = startOfDay(parseISO(p.validade));
      if (!isFuture(expiryDate) && differenceInDays(expiryDate, today) < 0) {
        return; // Skip already expired products
      }
      
      analyzedCount++;
      const daysUntilExpiry = differenceInDays(expiryDate, today);

      if (daysUntilExpiry <= attentionHorizonDays && daysUntilExpiry >= 0) {
        const quantity = parseInt(p.unidade, 10);
        if (isNaN(quantity) || quantity <= 0) {
          return; // Skip if quantity is not a positive number
        }

        // Risk Score: Higher quantity and fewer days to expiry = higher risk
        // Add 1 to daysUntilExpiry to prevent division by zero for items expiring today
        // Weight quantity more heavily
        const riskScore = (quantity * 10) / (daysUntilExpiry + 1);

        processedProducts.push({
          productName: p.produto,
          brand: p.marca || undefined,
          quantity: p.unidade,
          expiryDate: p.validade,
          daysUntilExpiry,
          riskScore,
          suggestion: '', // Suggestion will be added by the prompt
        });
      }
    });

    // Sort by risk score (descending) and then by days until expiry (ascending)
    processedProducts.sort((a, b) => {
      if (b.riskScore !== a.riskScore) {
        return b.riskScore - a.riskScore;
      }
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    const topCriticalItems = processedProducts.slice(0, topNProducts);
    const criticalProductsCount = processedProducts.length; // Total items meeting criteria before slicing for topN

    if (topCriticalItems.length === 0) {
      return {
        criticalItems: [],
        overallSummary: analyzedCount > 0 ? `Nenhum item crítico encontrado no horizonte de ${attentionHorizonDays} dias entre os ${analyzedCount} produtos analisados. Bom trabalho!` : "Nenhum produto com data de validade futura para analisar.",
        analyzedProductsCount: analyzedCount,
        criticalProductsCount: 0,
      };
    }

    // Use a prompt to generate suggestions for the top critical items and an overall summary
    const promptInput = {
      items: topCriticalItems.map(item => ({
        productName: item.productName,
        brand: item.brand,
        quantity: item.quantity,
        daysUntilExpiry: item.daysUntilExpiry,
      })),
      totalCriticalCount: criticalProductsCount, // Total critical items found
      displayedCriticalCount: topCriticalItems.length, // Items being displayed in detail
      attentionHorizonDays: attentionHorizonDays,
      analyzedProductsCount: analyzedCount,
    };

    const suggestionPrompt = ai.definePrompt({
        name: 'generateExpirySuggestionsPrompt',
        input: { schema: z.any() }, // Keep it simple for this internal prompt
        output: { schema: ExpiryAttentionReportSchema.pick({ criticalItems: true, overallSummary: true }) },
        prompt: `
        Você é um assistente de gerenciamento de estoque para um funcionário de supermercado.
        Analise os seguintes itens críticos que estão próximos da validade e possuem estoque considerável.
        Para cada item, forneça uma sugestão curta e prática para o funcionário.
        As sugestões devem ser genéricas e encorajar ações como: melhor organização FIFO, destaque na gôndola, ou consultar um gerente para promoções.
        Não sugira descontos específicos, pois o funcionário pode não ter essa autonomia.

        Itens Críticos (Exibindo os Top {{displayedCriticalCount}} de {{totalCriticalCount}} encontrados):
        {{#each items}}
        - Produto: {{productName}} {{#if brand}} ({{brand}}){{/if}}, Quantidade: {{quantity}}, Vence em: {{daysUntilExpiry}} dia(s).
        {{/each}}

        Baseado nos itens acima e no fato que foram analisados {{analyzedProductsCount}} produtos no total, gere:
        1. Uma lista de 'criticalItems', onde cada item da lista de entrada recebe um campo 'suggestion'.
           Exemplo de sugestão: "Estoque alto e validade próxima. Verifique organização FIFO e considere destacar na gôndola."
           Outra sugestão: "Atenção a este item! Comunique ao gerente sobre a validade para possível ação."
        2. Um 'overallSummary' conciso e útil sobre a situação geral, mencionando o número de itens críticos encontrados em relação ao total analisado e o horizonte de dias.
           Exemplo de sumário: "Alerta! {{totalCriticalCount}} itens em {{analyzedProductsCount}} analisados precisam de atenção nos próximos {{attentionHorizonDays}} dias. Priorize os {{displayedCriticalCount}} listados."
           Se displayedCriticalCount for igual a totalCriticalCount: "Atenção! {{totalCriticalCount}} itens em {{analyzedProductsCount}} analisados precisam de atenção nos próximos {{attentionHorizonDays}} dias."
           Se totalCriticalCount for 1: "Atenção! 1 item em {{analyzedProductsCount}} analisados precisa de atenção nos próximos {{attentionHorizonDays}} dias."
        `,
    });
    
    const { output } = await suggestionPrompt(promptInput);

    if (!output || !output.criticalItems || output.criticalItems.length !== topCriticalItems.length) {
        console.warn("AI suggestion generation failed or returned unexpected number of items. Using fallback suggestions.");
        const fallbackSuggestions = topCriticalItems.map(item => ({
            ...item,
            suggestion: "Estoque considerável e validade próxima. Verifique a organização FIFO na gôndola e/ou comunique ao gerente."
        }));
        return {
            criticalItems: fallbackSuggestions,
            overallSummary: criticalProductsCount > 0 ? `Atenção: ${criticalProductsCount} produto(s) em ${analyzedCount} analisados requer(em) cuidados nos próximos ${attentionHorizonDays} dias devido à validade e estoque.` : "Nenhum produto crítico identificado para o período.",
            analyzedProductsCount: analyzedCount,
            criticalProductsCount: criticalProductsCount,
        };
    }
    
    // Combine AI suggestions with the original critical items data
    const finalCriticalItems = topCriticalItems.map((item, index) => ({
        ...item,
        suggestion: output.criticalItems[index]?.suggestion || "Verifique FIFO e destaque na gôndola. Consulte o gerente se necessário.",
    }));

    return {
      criticalItems: finalCriticalItems,
      overallSummary: output.overallSummary,
      analyzedProductsCount: analyzedCount,
      criticalProductsCount: criticalProductsCount,
    };
  }
);

    