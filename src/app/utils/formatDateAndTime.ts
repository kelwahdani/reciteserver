import { format } from 'date-fns';
import { arSA } from 'date-fns/locale'; // Arabic (Saudi Arabia) locale

export const formatDateTimeArabic = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "dd MMMM yyyy", { locale: arSA });
};