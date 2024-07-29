import { format } from "date-fns";
import { enUS } from "date-fns/locale";

export const formatDateAndTime = (date: Date) => {
  return format(date, "MMMM d, yyyy 'at' h:mm aa", { locale: enUS });
};

export const formatDate = (date: Date) => {
  return format(date, "MMMM d, yyyy", { locale: enUS });
};

export const formatDateShort = (date: Date) => {
  return format(date, "MMM d, yyyy", { locale: enUS });
};
