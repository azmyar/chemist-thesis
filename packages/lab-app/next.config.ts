import type { NextConfig } from "next";
import path from "path";

const LAB_SERVER_URL = process.env.LAB_SERVER_URL ?? "http://localhost:8788";

const nextConfig: NextConfig = {
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
