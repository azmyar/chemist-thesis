import { z } from "zod";
export const createRangkumanSchema = z
    .object({
    topicId: z.string().min(1, "Topic ID wajib diisi"),
    type: z.enum(["content", "checkpoint"], {
        errorMap: () => ({ message: "Tipe harus 'content' atau 'checkpoint'" }),
    }),
    title: z.string().min(1, "Judul wajib diisi"),
    contentMd: z.string().optional(),
    checkpointQuestionId: z.string().optional(),
})
    .refine((data) => {
    if (data.type === "content" && !data.contentMd) {
        return false;
    }
    if (data.type === "checkpoint" && !data.checkpointQuestionId) {
        return false;
    }
    return true;
}, {
    message: "Content MD wajib untuk tipe content, Checkpoint Question ID wajib untuk tipe checkpoint",
    path: ["type"],
});
export const updateRangkumanSchema = z.object({
    type: z
        .enum(["content", "checkpoint"], {
        errorMap: () => ({ message: "Tipe harus 'content' atau 'checkpoint'" }),
    })
        .optional(),
    title: z.string().min(1, "Judul wajib diisi").optional(),
    contentMd: z.string().optional(),
    checkpointQuestionId: z.string().optional(),
});
export const updateRangkumanProgressSchema = z.object({
    topicId: z.string().min(1, "Topic ID wajib diisi"),
    progress: z.number().min(1, "Progress minimal 1"),
});
export const getRangkumanSchema = z.object({
    topicId: z.string().min(1, "Topic ID wajib diisi"),
});
export const submitMasterySchema = z.object({
    topicId: z.string().min(1, "Topic ID wajib diisi"),
    summaryId: z.string().min(1, "Summary ID wajib diisi"),
});
export const viewSummarySchema = z.object({
    summaryId: z.string().min(1, "Summary ID wajib diisi"),
});
//# sourceMappingURL=rangkuman.js.map