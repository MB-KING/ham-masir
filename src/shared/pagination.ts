import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export function toPagination(searchParams: URLSearchParams) {
  const { page, pageSize } = paginationSchema.parse(Object.fromEntries(searchParams));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
