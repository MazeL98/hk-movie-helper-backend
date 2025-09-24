import z from 'zod';

export const scheduleListQuerySchema = z.object({
  cinemaId: z.string().optional(),
  filmId:z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type scheduleListQuery = z.infer<typeof scheduleListQuerySchema>

export const scheduleValidDatesQuerySchema = z.object({
  cinemaId: z.string().optional(),
  filmId:z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type scheduleValidDatesQuery = z.infer<typeof scheduleValidDatesQuerySchema>
