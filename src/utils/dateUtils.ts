import { differenceInDays, formatDistanceToNowStrict, isPast, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDaysRemainingText = (isoDate: string): string => {
  const date = parseISO(isoDate);
  
  if (isPast(date) && !isToday(date)) {
    return `(venceu há ${formatDistanceToNowStrict(date, { addSuffix: false, locale: ptBR })})`;
  }
  
  const daysRemaining = differenceInDays(date, new Date());

  if (daysRemaining === 0) {
    return '(vence hoje)';
  }
  
  if (daysRemaining === 1) {
    return '(vence amanhã)';
  }

  return `(vence em ${daysRemaining} dias)`;
};
