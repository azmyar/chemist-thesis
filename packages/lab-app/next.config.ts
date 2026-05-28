import type { NextConfig } from "next";
import path from "path";

const LAB_SERVER_URL = process.env.LAB_SERVER_URL ?? "http://localhost:8788";

const nextConfig: NextConfig = {
	// Strict mode menyebabkan useEffect double-run di dev, yang bikin Phaser game
	// di-destroy + re-create cepat dan WS connection lama tidak rapi unmount —
	// ujungnya LabScene kadang nggak menerima snapshot. Production tidak terdampak.
	reactStrictMode: false,
	webpack: (config) => {
		config.resolve.alias = {
			...(config.resolve.alias ?? {}),
			"@": path.resolve(__dirname, "src"),
			"@shared": path.resolve(__dirname, "../../packages/shared/src"),
		};
		return config;
	},
	async rewrites() {
		return [
			{
				source: "/ws/:path*",
				destination: `${LAB_SERVER_URL}/:path*`,
			},
		];
	},
};

export default nextConfig;
