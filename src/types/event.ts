import z from "zod";

export const eventListQuerySchema = z.object({
    userID: z.bigint(),

    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type eventListQuery = z.infer<typeof eventListQuerySchema>

export const eventAddSchema = z.object({
  userID:z.bigint(),
  scheduleID:z.bigint(),
  note:z.string().optional()
})