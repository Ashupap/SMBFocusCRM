import { db } from "../../db";
import { eq, and, gte, lt, desc, asc, sql, count } from "drizzle-orm";

export { db };
export { eq, and, gte, lt, desc, asc, sql, count };

export function getDateRangeFilter(period: string) {
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStart, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0);
  }
  
  return { startDate, endDate: now };
}
