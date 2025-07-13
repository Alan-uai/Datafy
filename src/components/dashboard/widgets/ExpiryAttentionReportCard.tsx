
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Info, Wand2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { generateExpiryAttentionReport, type ExpiryAttentionReport } from '@/ai/flows/generate-expiry-attention-report-flow';
import { formatDaysRemainingText } from '@/utils/dateUtils';
import { isToday, isPast, isWithinInterval, addDays, startOfDay, parseISO, isValid, format } from 'date-fns';
import type { Product, UserPreferences } from '@/types';
import AttentionHorizonSelect from '@/components/dashboard/AttentionHorizonSelect';

interface ExpiryAttentionReportCardProps {
  listProducts: Product[];
  preferences?: UserPreferences;
  savePreferences?: (newPreferences: Partial<UserPreferences>) => void;
}

export const ExpiryAttentionReportCard: React.FC<ExpiryAttentionReportCardProps> = ({
  listProducts,
  preferences,
  savePreferences,
}) => {
  const { toast } = useToast();
  const [listStats, setListStats] = useState<{ expiringSoon: number; expired: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiryAttentionReport, setExpiryAttentionReport] = useState<ExpiryAttentionReport | null>(null);
  const attentionHorizon = preferences?.attentionHorizonDays || 7;

  const handleHorizonChange = (newHorizon: number) => {
    if (savePreferences) {
      savePreferences({ attentionHorizonDays: newHorizon });
    }
  };

  const calculateStatsAndReport = useCallback(async (productsToAnalyze: Product[], horizon: number) => {
    setIsLoading(true);
    setExpiryAttentionReport(null);

    // Calculate simple stats first
    try {
      const today = startOfDay(new Date());
      let expiredCount = 0;
      let expiringSoonCount = 0;
      const nonExpiredProducts = [];

      productsToAnalyze.forEach(p => {
        const productForAnalysis = {
            ...p,
            validade: p.expiryDate.toISOString(),
            produto: p.name,
        }
        if ((productForAnalysis as any).isExploding) return;

        const productDate = startOfDay(p.expiryDate);
        if (isPast(productDate) && !isToday(productDate)) {
          expiredCount++;
        } else {
          nonExpiredProducts.push(p);
          if (
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

      // Generate AI report only for non-expired products
      if (nonExpiredProducts.length > 0) {
        const plainProductsForAI = nonExpiredProducts.map(p => ({
          id: p.id,
          produto: p.name,
          marca: p.brand,
          unidade: p.quantity.toString(),
          validade: p.expiryDate.toISOString(),
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
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    calculateStatsAndReport(listProducts, attentionHorizon);
  }, [listProducts, attentionHorizon, calculateStatsAndReport]);
  
  const handleAnalyzeAgain = () => {
      calculateStatsAndReport(listProducts, attentionHorizon);
  };

  return (
    <Card className="shadow-md bg-card/80 backdrop-blur-sm">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-md sm:text-lg font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Radar de Validade
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Análise de itens críticos próximos da validade.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center mb-3">
            <>
              <div>
                <AttentionHorizonSelect currentHorizon={attentionHorizon} onHorizonChange={handleHorizonChange} isLoading={isLoading} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencidos</p>
                <p className={`text-xl sm:text-2xl font-bold ${listStats && listStats.expired > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {isLoading ? '-' : listStats?.expired ?? 0}
                </p>
              </div>
            </>
        </div>

        <Separator />

        {isLoading ? (
          <div className="space-y-3 pt-3">
            <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-muted/50 rounded animate-pulse"></div>
              <div className="h-3 w-5/6 bg-muted/50 rounded animate-pulse"></div>
            </div>
             <div className="h-3 w-1/2 bg-muted/50 rounded animate-pulse"></div>
          </div>
        ) : expiryAttentionReport ? (
          <div className="pt-3 space-y-2">
            <p className="text-sm text-muted-foreground flex items-start gap-1.5">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0"/> <span>{expiryAttentionReport.overallSummary}</span>
            </p>
            {expiryAttentionReport.criticalItems.length > 0 && (
              <ul className="space-y-2 text-sm pl-1">
                {expiryAttentionReport.criticalItems.map(item => (
                    <li key={item.productName + item.expiryDate} className="p-2 border rounded-md bg-amber-900/30">
                      <p className="font-semibold text-amber-400">
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
            disabled={isLoading || listProducts.length === 0}
        >
            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
            Analisar Novamente
        </Button>
      </CardContent>
    </Card>
  );
};
