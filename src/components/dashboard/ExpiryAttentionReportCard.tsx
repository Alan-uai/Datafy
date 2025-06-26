import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Info, Wand2, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateExpiryAttentionReport, type ExpiryAttentionReport } from '@/ai/flows/generate-expiry-attention-report-flow';
import { formatDaysRemainingText } from '@/utils/dateUtils';
import { isToday, isPast, isWithinInterval, addDays, startOfDay, parseISO, isValid, format } from 'date-fns';
import type { Product } from '@/types';
import AttentionHorizonSelect from '@/components/dashboard/AttentionHorizonSelect';

interface ExpiryAttentionReportCardProps {
  listProducts: Product[];
}

export const ExpiryAttentionReportCard: React.FC<ExpiryAttentionReportCardProps> = ({
  listProducts,
}) => {
  const { toast } = useToast();
  const [listStats, setListStats] = useState<{ expiringSoon: number; expired: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [expiryAttentionReport, setExpiryAttentionReport] = useState<ExpiryAttentionReport | null>(null);
  const [isLoadingAttentionReport, setIsLoadingAttentionReport] = useState(false);
  const [attentionHorizon, setAttentionHorizon] = useState(7);

  const calculateStatsAndReport = useCallback(async (productsToAnalyze: Product[], horizon: number) => {
    setIsLoadingStats(true);
    setIsLoadingAttentionReport(true);
    setListStats(null);
    setExpiryAttentionReport(null);

    try {
      const today = startOfDay(new Date());
      let expiredCount = 0;
      let expiringSoonCount = 0;

      productsToAnalyze.forEach(p => {
        if (p.isExploding) return;
        if (p.validade && isValid(parseISO(p.validade))) {
          const productDate = startOfDay(parseISO(p.validade));
          if (isPast(productDate) && !isToday(productDate)) {
            expiredCount++;
          } else if (
            !isToday(productDate) &&
            isWithinInterval(productDate, {
              start: addDays(today, 1),
              end: addDays(today, horizon),
            })
          ) {
            expiringSoonCount++;
          }
        }
      });
      setListStats({ expiringSoon: expiringSoonCount, expired: expiredCount });
    } catch (error) {
      console.error("Error calculating list stats:", error);
      toast({ variant: "destructive", title: "Erro ao calcular estatísticas", description: "Não foi possível carregar as estatísticas da lista." });
    } finally {
      setIsLoadingStats(false);
    }

    try {
      if (productsToAnalyze.length > 0) {
        const plainProductsForAI: Product[] = productsToAnalyze.map(p => ({
          id: p.id,
          originalId: p.originalId,
          listId: p.listId,
          produto: p.produto,
          marca: p.marca,
          unidade: p.unidade,
          validade: p.validade,
          isExploding: p.isExploding,
        }));
        const report = await generateExpiryAttentionReport({ products: plainProductsForAI, attentionHorizonDays: horizon, topNProducts: 3 });
        setExpiryAttentionReport(report);
      } else {
        setExpiryAttentionReport({ criticalItems: [], overallSummary: "Nenhum produto na lista para analisar.", analyzedProductsCount: 0, criticalProductsCount: 0 });
      }
    } catch (error: any) {
      console.error("Error generating expiry attention report:", error);
      toast({ variant: "destructive", title: "Erro na Análise IA", description: `Não foi possível gerar o relatório de atenção: ${error.message}` });
      setExpiryAttentionReport(null);
    } finally {
      setIsLoadingAttentionReport(false);
    }
  }, [toast]);

  useEffect(() => {
    calculateStatsAndReport(listProducts, attentionHorizon);
  }, [listProducts, attentionHorizon, calculateStatsAndReport]);

  const handleAnalyzeAgain = () => {
      calculateStatsAndReport(listProducts, attentionHorizon);
  };

  const isOverallLoading = isLoadingStats || isLoadingAttentionReport;

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-md sm:text-lg font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Radar de Validade
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Análise de itens críticos próximos da validade e com estoque considerável.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center mb-3">
          {isLoadingStats ? (
            <>
              <div>
                <div className="h-3 w-20 sm:w-24 mx-auto bg-muted rounded animate-pulse mb-1.5 sm:mb-2"></div>
                <div className="h-7 w-10 sm:h-8 sm:w-12 mx-auto bg-muted rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-3 w-12 sm:w-16 mx-auto bg-muted rounded animate-pulse mb-1.5 sm:mb-2"></div>
                <div className="h-7 w-10 sm:h-8 sm:w-12 mx-auto bg-muted rounded animate-pulse"></div>
              </div>
            </>
          ) : listStats ? (
            <>
              <div>
                <AttentionHorizonSelect currentHorizon={attentionHorizon} onHorizonChange={setAttentionHorizon} isLoading={isLoadingStats} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencidos</p>
                <p className={`text-xl sm:text-2xl font-bold ${listStats.expired > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {listStats.expired}
                </p>
              </div>
            </>
          ) : (
            <p className="col-span-2 text-sm text-muted-foreground text-center">Estatísticas não disponíveis.</p>
          )}
        </div>

        <Separator />

        {isLoadingAttentionReport ? (
          <div className="space-y-3 pt-3">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-5/6 bg-muted rounded animate-pulse"></div>
            </div>
             <div className="h-3 w-1/2 bg-muted rounded animate-pulse"></div>
          </div>
        ) : expiryAttentionReport ? (
          <div className="pt-3 space-y-2">
            <p className="text-sm text-muted-foreground flex items-start gap-1.5">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0"/> <span>{expiryAttentionReport.overallSummary}</span>
            </p>
            {expiryAttentionReport.criticalItems.length > 0 && (
              <ul className="space-y-2 text-sm pl-1">
                {expiryAttentionReport.criticalItems.map(item => (
                    <li key={item.productName + item.expiryDate} className="p-2 border rounded-md bg-amber-50 dark:bg-amber-900/30">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">
                        {item.productName} {item.brand ? `(${item.brand})` : ''}
                      </p>
                      <p>Qtde: {item.quantity} | Vence em: {format(parseISO(item.expiryDate), 'dd/MM/yyyy')} {formatDaysRemainingText(item.expiryDate)}</p>
                      <p className="mt-1 text-xs italic text-muted-foreground flex items-start gap-1">
                        <Wand2 className="inline h-3 w-3 mr-0.5 mt-0.5 flex-shrink-0"/>
                        <span>{item.suggestion}</span>
                      </p>
                    </li>
                  )                )}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center pt-3">Nenhuma análise disponível para os produtos nesta lista.</p>
        )}
         <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full sm:w-auto"
            onClick={handleAnalyzeAgain}
            disabled={isOverallLoading || listProducts.length === 0}
        >
            <RefreshCw className={cn("mr-2 h-4 w-4", isOverallLoading && "animate-spin")} />
            Analisar Novamente
        </Button>
      </CardContent>
    </Card>
  );
};
