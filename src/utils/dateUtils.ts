import { parseISO, isValid, differenceInMinutes, startOfDay, format, differenceInHours } from 'date-fns';

export const formatDaysRemainingText = (expiryDateString: string): string => {
    if (!expiryDateString || !isValid(parseISO(expiryDateString))) {
      return "";
    }
    const targetExpiryTime = startOfDay(parseISO(expiryDateString));
    const now = new Date();

    const totalMinutesLeft = differenceInMinutes(targetExpiryTime, now);

    if (totalMinutesLeft <= 0) { 
      return "(Vencido)";
    }

    const totalHoursLeft = Math.floor(totalMinutesLeft / 60);

    if (totalHoursLeft < 1) { 
      return `(${totalMinutesLeft}min restantes)`;
    }

    if (totalHoursLeft < 24) { 
      return `(${totalHoursLeft}h restantes)`;
    }

    const days = Math.floor(totalHoursLeft / 24);
    const remainingHoursInDay = totalHoursLeft % 24;

    if (remainingHoursInDay > 0) {
      return `(${days}d e ${remainingHoursInDay}h restantes)`;
    }
    return `(${days}d restantes)`;
  };
