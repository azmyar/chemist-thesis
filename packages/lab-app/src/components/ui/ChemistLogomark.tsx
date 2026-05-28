/**
 * Logomark resmi Chemist (selaras Product/chemist `public/svg/chemist-logomark.svg`).
 * Bentuk orbit/"C" — warna solid brand #0590D6 (primary-500), tanpa gradient.
 */
export function ChemistLogomark({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			width="32"
			height="33"
			viewBox="0 0 32 33"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			<circle
				cx="16.43"
				cy="16.586"
				r="7.419"
				fill="currentColor"
				transform="rotate(-90 16.43 16.586)"
			/>
			<path
				fill="currentColor"
				opacity="0.5"
				d="M.18 13.959a16.4 16.4 0 0 1 3.595-8.044A16.36 16.36 0 0 1 19.803.364l-.88 4.145A12.035 12.035 0 0 0 5.244 20.79a12.08 12.08 0 0 0 10.614 7.551 12.032 12.032 0 0 0 10.639-5.4l3.698 2.387a16.36 16.36 0 0 1-15.237 7.448 16.4 16.4 0 0 1-8.244-3.122A16.46 16.46 0 0 1 .18 13.96"
			/>
			<circle
				cx="26.977"
				cy="5.783"
				r="4.637"
				fill="currentColor"
				transform="rotate(-90 26.977 5.783)"
			/>
		</svg>
	);
}
