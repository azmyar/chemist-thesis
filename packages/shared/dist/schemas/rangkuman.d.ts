import { z } from "zod";
export declare const createRangkumanSchema: z.ZodEffects<z.ZodObject<{
    topicId: z.ZodString;
    type: z.ZodEnum<["content", "checkpoint"]>;
    title: z.ZodString;
    contentMd: z.ZodOptional<z.ZodString>;
    checkpointQuestionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "content" | "checkpoint";
    topicId: string;
    title: string;
    contentMd?: string | undefined;
    checkpointQuestionId?: string | undefined;
}, {
    type: "content" | "checkpoint";
    topicId: string;
    title: string;
    contentMd?: string | undefined;
    checkpointQuestionId?: string | undefined;
}>, {
    type: "content" | "checkpoint";
    topicId: string;
    title: string;
    contentMd?: string | undefined;
    checkpointQuestionId?: string | undefined;
}, {
    type: "content" | "checkpoint";
    topicId: string;
    title: string;
    contentMd?: string | undefined;
    checkpointQuestionId?: string | undefined;
}>;
export declare const updateRangkumanSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["content", "checkpoint"]>>;
    title: z.ZodOptional<z.ZodString>;
    contentMd: z.ZodOptional<z.ZodString>;
    checkpointQuestionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: "content" | "checkpoint" | undefined;
    title?: string | undefined;
    contentMd?: string | undefined;
    checkpointQuestionId?: string | undefined;
}, {
    type?: "content" | "checkpoint" | undefined;
    title?: string | undefined;
    contentMd?: string | undefined;
    checkpointQuestionId?: string | undefined;
}>;
export declare const updateRangkumanProgressSchema: z.ZodObject<{
    topicId: z.ZodString;
    progress: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    topicId: string;
    progress: number;
}, {
    topicId: string;
    progress: number;
}>;
export declare const getRangkumanSchema: z.ZodObject<{
    topicId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    topicId: string;
}, {
    topicId: string;
}>;
export type CreateRangkumanType = z.infer<typeof createRangkumanSchema>;
export type UpdateRangkumanType = z.infer<typeof updateRangkumanSchema>;
export type UpdateRangkumanProgressType = z.infer<typeof updateRangkumanProgressSchema>;
export type GetRangkumanType = z.infer<typeof getRangkumanSchema>;
export declare const submitMasterySchema: z.ZodObject<{
    topicId: z.ZodString;
    summaryId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    topicId: string;
    summaryId: string;
}, {
    topicId: string;
    summaryId: string;
}>;
export declare const viewSummarySchema: z.ZodObject<{
    summaryId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    summaryId: string;
}, {
    summaryId: string;
}>;
export type SubmitMasteryType = z.infer<typeof submitMasterySchema>;
export type ViewSummaryType = z.infer<typeof viewSummarySchema>;
//# sourceMappingURL=rangkuman.d.ts.map