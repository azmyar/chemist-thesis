import { z } from "zod";

const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
const passwordRegex = /^.{8,}$/;

export const loginSchema = z.object({
	phone: z
		.string()
		.min(1, "Nomor telepon wajib diisi")
		.regex(phoneRegex, "Masukkan nomor telepon Indonesia yang valid")
		.transform((val) =>
			val.replace(/^0/, "62").replace(/^62/, "62").replace(/^\+62/, "62"),
		),
	password: z.string().min(1, "Password wajib diisi"),
	forceLogin: z.boolean().default(false),
});

export const registerSchema = z.object({
	phone: z
		.string()
		.min(1, "Nomor telepon wajib diisi")
		.regex(phoneRegex, "Masukkan nomor telepon Indonesia yang valid")
		.transform((val) =>
			val.replace(/^0/, "62").replace(/^62/, "62").replace(/^\+62/, "62"),
		),
	password: z
		.string()
		.min(8, "Password minimal 8 karakter")
		.max(128, "Password maksimal 128 karakter"),
});

export const otpSchema = z
	.object({
		phone: z
			.string()
			.min(1, "Nomor telepon wajib diisi")
			.regex(phoneRegex, "Masukkan nomor telepon Indonesia yang valid")
			.transform((val) =>
				val.replace(/^0/, "62").replace(/^62/, "62").replace(/^\+62/, "62"),
			),

		password: z
			.string()
			.min(8, "Password minimal 8 karakter")
			.max(128, "Password maksimal 128 karakter")
			.regex(
				passwordRegex,
				"Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus",
			),
		confirmPassword: z.string().min(1, "Konfirmasi Password wajib diisi"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Password tidak cocok",
		path: ["confirmPassword"],
	});

export const profileSchema = z.object({
	name: z
		.string()
		.min(1, "Nama wajib diisi")
		.max(100, "Nama maksimal 100 karakter"),
	school_id: z.string().nonempty("Nama Sekolah wajib diisi"),
	grade: z
		.number({
			required_error: "Kelas wajib diisi",
			invalid_type_error: "Kelas wajib diisi",
		})
		.min(10, "Kelas minimal 10")
		.max(13, "Kelas maksimal 13"),
});

export type LoginType = z.infer<typeof loginSchema>;
export type RegisterType = z.infer<typeof registerSchema>;
export type OTPType = z.infer<typeof otpSchema>;
export type ProfileType = z.infer<typeof profileSchema>;
