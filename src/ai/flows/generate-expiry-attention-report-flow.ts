
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
  marca: z.string().optional(),
  unidade: z.string(),
  validade: z.string(),
  isExploding: z.boolean().optional(),
});

const GenerateExpiryAttentionReportInputSchema = z.object({
  products: z.array(ProductSchema).describe('List of products to analyze.'),
  attentionHorizonDays: z.number().optional().default(15).describe('How many days in advance to look for expiries (e.g., 15 for next 15 days).'),
  topNProducts: z.number().optional().default(3).describe('Maximum number of most critical products to return in the detailed list.'),
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

// Define the schema for the input of the suggestion prompt
const SuggestionPromptInputItemSchema = z.object({
    productName: z.string(),
    brand: z.string().optional(),
    quantity: z.string(),
    expiryDate: z.string(),
    daysUntilExpiry: z.number(),
    riskScore: z.number(),
});

const SuggestionPromptInputSchema = z.object({
  items: z.array(SuggestionPromptInputItemSchema),
  totalCriticalCount: z.number(),
  displayedCriticalCount: z.number(),
  attentionHorizonDays: z.number(),
  analyzedProductsCount: z.number(),
});

// Define the suggestion prompt at the module level
const suggestionPrompt = ai.definePrompt({
    name: 'generateExpirySuggestionsPrompt',
    input: { schema: SuggestionPromptInputSchema },
    output: { schema: ExpiryAttentionReportSchema.pick({ criticalItems: true, overallSummary: true }) },
    prompt: `
    Você é um assistente de gerenciamento de estoque para um funcionário de supermercado.
    Analise os seguintes itens críticos que estão próximos da validade e possuem estoque considerável.
    Para CADA item da lista 'items' abaixo, você DEVE adicionar um campo 'suggestion' contendo uma sugestão CURTA e PRÁTICA, seguindo estas regras de urgência:
    - Se 'daysUntilExpiry' é 0 (HOJE), a sugestão DEVE refletir URGÊNCIA MÁXIMA (ex: "AÇÃO IMEDIATA! Vence HOJE. Destaque máximo, FIFO, alertar gerente para possível ação de preço ou descarte ao fim do dia.")
    - Se 'daysUntilExpiry' é 1-3 dias, a sugestão DEVE ser de ALERTA (ex: "Estoque alto e validade muito próxima ({{daysUntilExpiry}} dias). Priorize FIFO, destaque e informe gerente.")
    - Para outros itens (vencendo em mais de 3 dias mas dentro do horizonte), use uma sugestão padrão (ex: "Estoque considerável e validade próxima. Verifique FIFO e considere destacar.")
    NÃO sugira descontos específicos, pois o funcionário pode não ter essa autonomia.

    Itens Críticos (Exibindo os Top {{displayedCriticalCount}} de {{totalCriticalCount}} encontrados):
    {{#each items}}
    - Produto: {{productName}}{{#if brand}} ({{brand}}){{/if}}, Quantidade: {{quantity}}, Validade: {{expiryDate}} (Vence em: {{daysUntilExpiry}} dia(s)), Risco: {{riskScore}}.
    {{/each}}

    Baseado nos itens acima (que já incluem nome, marca, quantidade, data de validade, dias para vencer e score de risco) e no fato que foram analisados {{analyzedProductsCount}} produtos no total, gere:
    1. Uma lista 'criticalItems'. Esta lista DEVE conter EXATAMENTE os mesmos itens que foram fornecidos na entrada 'items', com todos os seus campos originais (productName, brand, quantity, expiryDate, daysUntilExpiry, riskScore), mais o campo 'suggestion' que você gerou para cada um. Assegure que o número de itens em 'criticalItems' no output seja o mesmo que em 'items' no input, e que a ordem seja mantida.
    2. Um 'overallSummary' conciso. Se houver itens vencendo HOJE (daysUntilExpiry = 0) entre os listados em 'items' no input, INICIE o sumário com "ALERTA CRÍTICO! Há itens vencendo HOJE!". Em todos os casos, mencione o número total de itens críticos (totalCriticalCount) e o horizonte de dias (attentionHorizonDays).
       Exemplo de sumário (com item vencendo hoje): "ALERTA CRÍTICO! Há itens vencendo HOJE! No total, {{totalCriticalCount}} itens em {{analyzedProductsCount}} analisados precisam de atenção nos próximos {{attentionHorizonDays}} dias. Priorize os {{displayedCriticalCount}} listados."
       Exemplo de sumário (sem item vencendo hoje, totalCriticalCount = 1): "Atenção! 1 item em {{analyzedProductsCount}} analisados precisa de atenção nos próximos {{attentionHorizonDays}} dias."
       Exemplo de sumário (sem item vencendo hoje, displayedCriticalCount = totalCriticalCount): "Atenção! {{totalCriticalCount}} itens em {{analyzedProductsCount}} analisados precisam de atenção nos próximos {{attentionHorizonDays}} dias."
       Exemplo de sumário (sem item vencendo hoje, geral): "Alerta! {{totalCriticalCount}} itens em {{analyzedProductsCount}} analisados precisam de atenção nos próximos {{attentionHorizonDays}} dias. Priorize os {{displayedCriticalCount}} listados."

    Retorne APENAS a estrutura JSON solicitada para 'criticalItems' e 'overallSummary'.
    `,
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
    const { products, attentionHorizonDays = 15, topNProducts = 3 } = input;
    const today = startOfDay(new Date());
    let processedProducts: CriticalExpiryItem[] = [];
    let analyzedCount = 0;

    products.forEach((p) => {
      if (!p.validade || !isValid(parseISO(p.validade))) {
        return; 
      }
      const expiryDate = startOfDay(parseISO(p.validade));
      
      if (!isFuture(expiryDate) && differenceInDays(expiryDate, today) < 0) {
        return; 
      }
      
      analyzedCount++;
      const daysUntilExpiry = differenceInDays(expiryDate, today);

      if (daysUntilExpiry <= attentionHorizonDays && daysUntilExpiry >= 0) {
        const quantity = parseInt(p.unidade, 10);
        if (isNaN(quantity) || quantity <= 0) {
          return; 
        }

        const riskScore = (quantity * 10) / (daysUntilExpiry + 1);

        processedProducts.push({
          productName: p.produto,
          brand: p.marca || undefined,
          quantity: p.unidade,
          expiryDate: p.validade, // Already in YYYY-MM-DD string format
          daysUntilExpiry,
          riskScore,
          suggestion: '', 
        });
      }
    });

    processedProducts.sort((a, b) => {
      if (b.riskScore !== a.riskScore) {
        return b.riskScore - a.riskScore;
      }
      return a.daysUntilExpiry - b.daysUntilExpiry;
    });

    const topCriticalItems = processedProducts.slice(0, topNProducts);
    const criticalProductsCount = processedProducts.length; 

    if (topCriticalItems.length === 0) {
      return {
        criticalItems: [],
        overallSummary: analyzedCount > 0 ? `Nenhum item crítico encontrado no horizonte de ${attentionHorizonDays} dias entre os ${analyzedCount} produtos analisados. Bom trabalho!` : "Nenhum produto com data de validade futura para analisar.",
        analyzedProductsCount: analyzedCount,
        criticalProductsCount: 0,
      };
    }
    
    // Prepare data for the prompt, ensuring all fields for CriticalExpiryItemSchema are present if AI is to return them
    const itemsForPrompt = topCriticalItems.map(item => ({
        productName: item.productName,
        brand: item.brand,
        quantity: item.quantity,
        expiryDate: item.expiryDate, // Pass this to AI
        daysUntilExpiry: item.daysUntilExpiry,
        riskScore: item.riskScore, // Pass this to AI
      }));

    const promptInputData = {
      items: itemsForPrompt,
      totalCriticalCount: criticalProductsCount,
      displayedCriticalCount: topCriticalItems.length,
      attentionHorizonDays: attentionHorizonDays,
      analyzedProductsCount: analyzedCount,
    };
    
    const { output } = await suggestionPrompt(promptInputData);

    if (!output || !output.criticalItems || output.criticalItems.length !== topCriticalItems.length) {
        console.warn("AI suggestion generation failed or returned unexpected number of items. Using fallback suggestions.");
        const fallbackSuggestions = topCriticalItems.map(item => ({
            ...item, // item already includes riskScore and expiryDate
            suggestion: item.daysUntilExpiry === 0 
                ? "AÇÃO IMEDIATA! Vence HOJE. Destaque máximo, FIFO, alertar gerente."
                : "Estoque considerável e validade próxima. Verifique a organização FIFO e/ou comunique ao gerente."
        }));
        
        let fallbackSummary = `Atenção: ${criticalProductsCount} produto(s) em ${analyzedCount} analisados requer(em) cuidados nos próximos ${attentionHorizonDays} dias.`;
        if (topCriticalItems.some(i => i.daysUntilExpiry === 0)) {
            fallbackSummary = `ALERTA CRÍTICO! Há itens vencendo HOJE! ` + fallbackSummary;
        }

        return {
            criticalItems: fallbackSuggestions,
            overallSummary: fallbackSummary,
            analyzedProductsCount: analyzedCount,
            criticalProductsCount: criticalProductsCount,
        };
    }
    
    // The AI is expected to return the full criticalItems structure including the new suggestion.
    // We trust the AI's output structure if validation passes.
    const finalCriticalItems = output.criticalItems.map((aiItem, index) => {
      // Ensure all necessary fields are present from AI, or merge with original if needed (though prompt asks AI for full items)
      const originalItem = topCriticalItems[index];
      return {
        productName: aiItem.productName || originalItem.productName,
        brand: aiItem.brand || originalItem.brand,
        quantity: aiItem.quantity || originalItem.quantity,
        expiryDate: aiItem.expiryDate || originalItem.expiryDate,
        daysUntilExpiry: aiItem.daysUntilExpiry ?? originalItem.daysUntilExpiry, // handle 0
        riskScore: aiItem.riskScore ?? originalItem.riskScore, // handle 0
        suggestion: aiItem.suggestion || (originalItem.daysUntilExpiry === 0 
            ? "AÇÃO IMEDIATA! Vence HOJE. Destaque, FIFO, alertar gerente." 
            : "Verifique FIFO e destaque. Consulte o gerente se necessário."),
      };
    });


    return {
      criticalItems: finalCriticalItems,
      overallSummary: output.overallSummary,
      analyzedProductsCount: analyzedCount,
      criticalProductsCount: criticalProductsCount,
    };
  }
);

