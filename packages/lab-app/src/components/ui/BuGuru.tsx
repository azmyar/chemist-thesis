/**
 * Bu Guru — NPC pemandu, pixel-art (16×24 grid). Sprite-based, NO emoji.
 * Geometri mirror desain board Figma "REDESIGN v2". Dipakai bersama oleh
 * modal cek pemahaman & pembetulan konsep supaya konsisten.
 */
export function BuGuru({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 16 24"
			shapeRendering="crispEdges"
			fill="none"
			aria-hidden
		>
			{/* hair-back + shadow */}
			<rect x="4" y="1" width="8" height="6" fill="#4a3728" />
			<rect x="5" y="22" width="6" height="1" fill="#ced4da" />
			{/* face */}
			<rect x="5" y="3" width="6" height="5" fill="#f0c090" />
			<rect x="5" y="3" width="6" height="1" fill="#4a3728" />
			<rect x="4" y="3" width="1" height="4" fill="#4a3728" />
			<rect x="11" y="3" width="1" height="4" fill="#4a3728" />
			{/* lab coat */}
			<rect x="4" y="8" width="8" height="9" fill="#f8f9fa" />
			<rect x="4" y="8" width="1" height="9" fill="#dee2e6" />
			<rect x="11" y="8" width="1" height="9" fill="#dee2e6" />
			<rect x="3" y="9" width="1" height="6" fill="#f8f9fa" />
			<rect x="12" y="9" width="1" height="6" fill="#f8f9fa" />
			<rect x="7" y="8" width="2" height="3" fill="#0590d6" />
			<rect x="6" y="8" width="1" height="1" fill="#e9ecef" />
			<rect x="9" y="8" width="1" height="1" fill="#e9ecef" />
			{/* lower body */}
			<rect x="5" y="17" width="6" height="2" fill="#343a40" />
			<rect x="6" y="19" width="1" height="2" fill="#f0c090" />
			<rect x="9" y="19" width="1" height="2" fill="#f0c090" />
			<rect x="6" y="21" width="1" height="1" fill="#1e1e1e" />
			<rect x="9" y="21" width="1" height="1" fill="#1e1e1e" />
			{/* mata (tanpa kacamata) + senyum */}
			<rect x="6" y="5" width="1" height="1" fill="#1e1e1e" />
			<rect x="9" y="5" width="1" height="1" fill="#1e1e1e" />
			<rect x="7" y="7" width="2" height="1" fill="#bf4f4d" />
			{/* hands + buttons */}
			<rect x="3" y="15" width="1" height="1" fill="#f0c090" />
			<rect x="12" y="15" width="1" height="1" fill="#f0c090" />
			<rect x="7" y="11" width="1" height="1" fill="#0590d6" />
			<rect x="7" y="13" width="1" height="1" fill="#0590d6" />
			{/* clipboard */}
			<rect x="9" y="11" width="5" height="5" fill="#7a6244" />
			<rect x="10" y="11" width="3" height="4" fill="#f8f9fa" />
			<rect x="10" y="12" width="3" height="1" fill="#adb5bd" />
			<rect x="10" y="14" width="2" height="1" fill="#adb5bd" />
		</svg>
	);
}
