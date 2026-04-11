import { z } from "zod";
export declare const latihanTypeSchema: z.ZodEnum<["multiple_choice", "short_answer", "true_false", "essay"]>;
export declare const latihanParamsSchema: z.ZodObject<{
    questionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    questionId: string;
}, {
    questionId: string;
}>;
export declare const latihanInteractionSchema: z.ZodObject<{
    topicId: z.ZodString;
    seq: z.ZodString;
}, "strip", z.ZodTypeAny, {
    topicId: string;
    seq: string;
}, {
    topicId: string;
    seq: string;
}>;
export declare const latihanCheckAnswerSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const latihanSaveAnswerSchema: z.ZodObject<{
    userAnswer: z.ZodOptional<z.ZodString>;
    userImage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userAnswer?: string | undefined;
    userImage?: string | undefined;
}, {
    userAnswer?: string | undefined;
    userImage?: string | undefined;
}>;
export declare const getLatihanListSchema: z.ZodObject<{
    topicId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    topicId: string;
}, {
    topicId: string;
}>;
export declare const getLatihanSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const latihanIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const latihanOptionInputSchema: z.ZodObject<{
    seq: z.ZodNumber;
    label: z.ZodString;
    contentMd: z.ZodString;
    isCorrect: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    contentMd: string;
    seq: number;
    label: string;
    isCorrect: boolean;
}, {
    contentMd: string;
    seq: number;
    label: string;
    isCorrect: boolean;
}>;
export declare const createLatihanSchema: z.ZodEffects<z.ZodObject<{
    topicId: z.ZodString;
    seq: z.ZodNumber;
    type: z.ZodEnum<["multiple_choice", "short_answer", "true_false", "essay"]>;
    questionMd: z.ZodString;
    explanationMd: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        seq: z.ZodNumber;
        label: z.ZodString;
        contentMd: z.ZodString;
        isCorrect: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }, {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "multiple_choice" | "short_answer" | "true_false" | "essay";
    topicId: string;
    seq: number;
    questionMd: string;
    options?: {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }[] | undefined;
    explanationMd?: string | undefined;
}, {
    type: "multiple_choice" | "short_answer" | "true_false" | "essay";
    topicId: string;
    seq: number;
    questionMd: string;
    options?: {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }[] | undefined;
    explanationMd?: string | undefined;
}>, {
    type: "multiple_choice" | "short_answer" | "true_false" | "essay";
    topicId: string;
    seq: number;
    questionMd: string;
    options?: {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }[] | undefined;
    explanationMd?: string | undefined;
}, {
    type: "multiple_choice" | "short_answer" | "true_false" | "essay";
    topicId: string;
    seq: number;
    questionMd: string;
    options?: {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }[] | undefined;
    explanationMd?: string | undefined;
}>;
export declare const updateLatihanSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    topicId: z.ZodOptional<z.ZodString>;
    seq: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodEnum<["multiple_choice", "short_answer", "true_false", "essay"]>>;
    questionMd: z.ZodOptional<z.ZodString>;
    explanationMd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        seq: z.ZodNumber;
        label: z.ZodString;
        contentMd: z.ZodString;
        isCorrect: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }, {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    options?: {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }[] | undefined;
    type?: "multiple_choice" | "short_answer" | "true_false" | "essay" | undefined;
    topicId?: string | undefined;
    seq?: number | undefined;
    questionMd?: string | undefined;
    explanationMd?: string | null | undefined;
}, {
    id: string;
    options?: {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }[] | undefined;
    type?: "multiple_choice" | "short_answer" | "true_false" | "essay" | undefined;
    topicId?: string | undefined;
    seq?: number | undefined;
    questionMd?: string | undefined;
    explanationMd?: string | null | undefined;
}>, {
    id: string;
    options?: {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }[] | undefined;
    type?: "multiple_choice" | "short_answer" | "true_false" | "essay" | undefined;
    topicId?: string | undefined;
    seq?: number | undefined;
    questionMd?: string | undefined;
    explanationMd?: string | null | undefined;
}, {
    id: string;
    options?: {
        contentMd: string;
        seq: number;
        label: string;
        isCorrect: boolean;
    }[] | undefined;
    type?: "multiple_choice" | "short_answer" | "true_false" | "essay" | undefined;
    topicId?: string | undefined;
    seq?: number | undefined;
    questionMd?: string | undefined;
    explanationMd?: string | null | undefined;
}>;
export declare const getLatihanTopicSchema: z.ZodObject<{
    topicId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    topicId: string;
}, {
    topicId: string;
}>;
export type latihanInteractionType = z.infer<typeof latihanInteractionSchema>;
export type GetLatihanListType = z.infer<typeof getLatihanListSchema>;
export type GetLatihanType = z.infer<typeof getLatihanSchema>;
export type LatihanCheckAnswerType = z.infer<typeof latihanCheckAnswerSchema>;
export type LatihanOptionInput = z.infer<typeof latihanOptionInputSchema>;
export type CreateLatihanType = z.infer<typeof createLatihanSchema>;
export type UpdateLatihanType = z.infer<typeof updateLatihanSchema>;
//# sourceMappingURL=latihan.d.ts.map