import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    phone: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    forceLogin: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    password: string;
    forceLogin: boolean;
}, {
    phone: string;
    password: string;
    forceLogin?: boolean | undefined;
}>;
export declare const registerSchema: z.ZodObject<{
    phone: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    password: string;
}, {
    phone: string;
    password: string;
}>;
export declare const otpSchema: z.ZodEffects<z.ZodObject<{
    phone: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    password: string;
    confirmPassword: string;
}, {
    phone: string;
    password: string;
    confirmPassword: string;
}>, {
    phone: string;
    password: string;
    confirmPassword: string;
}, {
    phone: string;
    password: string;
    confirmPassword: string;
}>;
export declare const profileSchema: z.ZodObject<{
    name: z.ZodString;
    school_id: z.ZodString;
    grade: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    school_id: string;
    grade: number;
}, {
    name: string;
    school_id: string;
    grade: number;
}>;
export type LoginType = z.infer<typeof loginSchema>;
export type RegisterType = z.infer<typeof registerSchema>;
export type OTPType = z.infer<typeof otpSchema>;
export type ProfileType = z.infer<typeof profileSchema>;
//# sourceMappingURL=auth.d.ts.map