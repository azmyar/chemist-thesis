import { z } from "zod";
export const latihanTypeSchema = z.enum([
    "multiple_choice",
    "short_answer",
    "true_false",
    "essay",
]);
export const latihanParamsSchema = z.object({
    questionId: z.string().min(1, "ID wajib diisi"),
});
export const latihanInteractionSchema = z.object({
    topicId: z.string().min(1, "Topic ID wajib diisi"),
    seq: z.string().min(1, "Urutan harus angka valid"),
});
export const latihanCheckAnswerSchema = z.object({});
export const latihanSaveAnswerSchema = z.object({
    userAnswer: z.string().optional(),
    userImage: z.string().optional(),
});
export const getLatihanListSchema = z.object({
    topicId: z.string().min(1, "Topic ID wajib diisi"),
});
export const getLatihanSchema = z.object({
    id: z.string().min(1, "ID wajib diisi"),
});
export const latihanIdParamSchema = z.object({
    id: z.string().min(1, "ID wajib diisi"),
});
export const latihanOptionInputSchema = z.object({
    seq: z
        .number()
        .int("Urutan opsi harus berupa angka bulat")
        .min(1, "Urutan opsi minimal 1"),
    label: z.string().min(1, "Label opsi wajib diisi"),
    contentMd: z.string().min(1, "Isi opsi wajib diisi"),
    isCorrect: z.boolean({
        required_error: "Status kebenaran opsi wajib diisi",
    }),
});
const validateMultipleChoiceOptions = (options) => {
    if (!options) {
        return false;
    }
    if (options.length < 2) {
        return false;
    }
    const correctCount = options.filter((option) => option.isCorrect).length;
    return correctCount === 1;
};
export const createLatihanSchema = z
    .object({
    topicId: z.string().min(1, "Topic ID wajib diisi"),
    seq: z.number().int("Urutan harus angka valid").min(1, "Urutan minimal 1"),
    type: latihanTypeSchema,
    questionMd: z.string().min(1, "Pertanyaan wajib diisi"),
    explanationMd: z.string().optional(),
    options: z.array(latihanOptionInputSchema).optional(),
})
    .superRefine((data, ctx) => {
    if (data.type === "multiple_choice") {
        if (!validateMultipleChoiceOptions(data.options)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Multiple choice membutuhkan minimal dua opsi dengan tepat satu jawaban benar",
                path: ["options"],
            });
        }
    }
    else if (data.options && data.options.length > 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Opsi hanya boleh disediakan untuk tipe multiple choice",
            path: ["options"],
        });
    }
});
export const updateLatihanSchema = z
    .object({
    id: z.string().min(1, "ID wajib diisi"),
    topicId: z.string().min(1, "Topic ID wajib diisi").optional(),
    seq: z
        .number()
        .int("Urutan harus angka valid")
        .min(1, "Urutan minimal 1")
        .optional(),
    type: latihanTypeSchema.optional(),
    questionMd: z.string().min(1, "Pertanyaan wajib diisi").optional(),
    explanationMd: z.string().nullable().optional(),
    options: z.array(latihanOptionInputSchema).optional(),
})
    .superRefine((data, ctx) => {
    if (data.options !== undefined) {
        if ((data.type ?? "multiple_choice") === "multiple_choice" &&
            !validateMultipleChoiceOptions(data.options)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Multiple choice membutuhkan minimal dua opsi dengan tepat satu jawaban benar",
                path: ["options"],
            });
        }
        else if (data.type && data.type !== "multiple_choice") {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Opsi hanya boleh disediakan untuk tipe multiple choice",
                path: ["options"],
            });
        }
    }
});
export const getLatihanTopicSchema = z.object({
    topicId: z.string().min(1, "Topic ID wajib diisi"),
});
//# sourceMappingURL=latihan.js.map