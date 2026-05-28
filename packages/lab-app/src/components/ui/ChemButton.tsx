"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ChemButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	/** "chem" = gradient brand (CTA utama), "primary" = biru solid */
	variant?: "chem" | "primary";
	size?: "lg" | "md";
	children: ReactNode;
}

/**
 * Tombol 3D khas Chemist (selaras Product/chemist `ui/button.tsx`).
 * Struktur 3 lapis: container (teks) → outer (border + "bibir" bawah yang
 * mengempis saat ditekan) → inner (shadow kedalaman).
 */
export function ChemButton({
	variant = "chem",
	size = "lg",
	className = "",
	children,
	disabled,
	...props
}: ChemButtonProps) {
	const sizeText = size === "lg" ? "h-11 heading-1" : "h-10 heading-2";
	const lip =
		size === "lg"
			? "pt-[1px] pb-[3px] active:pb-0 active:translate-y-[3px]"
			: "pt-[1px] pb-[2px] active:pb-0 active:translate-y-[2px]";
	const outerBg =
		variant === "chem"
			? "bg-chem-gradient border-primary-500"
			: "bg-primary-500 border-primary-800";
	const innerShadow =
		variant === "chem" ? "chem-button-shadow" : "primary-button-shadow";

	return (
		<button
			disabled={disabled}
			className={`flex cursor-pointer items-center justify-center whitespace-nowrap rounded-[10px] text-center text-white transition-transform disabled:pointer-events-none disabled:opacity-50 ${sizeText} ${className}`}
			{...props}
		>
			<div
				className={`flex h-fit w-full overflow-hidden rounded-[12px] border ${lip} ${outerBg}`}
			>
				<div
					className={`flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-[6px] ${innerShadow}`}
				>
					<span className="flex-1">{children}</span>
				</div>
			</div>
		</button>
	);
}
