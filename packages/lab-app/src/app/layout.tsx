import type { Metadata } from "next";
import { Nunito, Outfit } from "next/font/google";

import "./globals.css";

const outfit = Outfit({
	variable: "--font-outfit",
	weight: ["500", "600"],
	subsets: ["latin"],
});

const nunito = Nunito({
	variable: "--font-nunito",
	weight: ["500", "600", "800"],
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "ChemistLab — Lab Virtual Interaktif",
	description:
		"Jelajahi lab kimia virtual bersama teman-teman kamu secara real-time!",
	robots: { index: true, follow: true },
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="id"
			className={`${outfit.variable} ${nunito.variable} antialiased`}
		>
			<body className="antialiased bg-neutral-800">
				{children}
			</body>
		</html>
	);
}
