"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_DISTANCE = 50;

/**
 * VirtualJoystick — mobile touch input.
 * Dispatches window CustomEvents that the Phaser LabScene listens to:
 * - "joystick-move" with { vx, vy } normalized to -1..1
 * - "joystick-stop" when touch ends
 */
export function VirtualJoystick() {
	const [active, setActive] = useState(false);
	const [basePos, setBasePos] = useState({ x: 88, y: 88 });
	const [thumbPos, setThumbPos] = useState({ x: 88, y: 88 });
	const zoneRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const setDefaultPosition = () => {
			const zone = zoneRef.current;
			if (!zone) return;

			const zoneHeight = zone.clientHeight || 200;
			const y = Math.max(88, zoneHeight - 88);
			const nextPos = { x: 88, y };
			setBasePos(nextPos);
			setThumbPos(nextPos);
		};

		setDefaultPosition();
		window.addEventListener("resize", setDefaultPosition);

		return () => {
			window.removeEventListener("resize", setDefaultPosition);
		};
	}, []);

	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		const touch = e.touches[0];
		const rect = zoneRef.current?.getBoundingClientRect();
		if (!rect) return;

		const x = touch.clientX - rect.left;
		const y = touch.clientY - rect.top;

		setActive(true);
		setBasePos({ x, y });
		setThumbPos({ x, y });
	}, []);

	const handleTouchMove = useCallback(
		(e: React.TouchEvent) => {
			if (!active) return;
			e.preventDefault();

			const touch = e.touches[0];
			const rect = zoneRef.current?.getBoundingClientRect();
			if (!rect) return;

			const touchX = touch.clientX - rect.left;
			const touchY = touch.clientY - rect.top;
			const dx = touchX - basePos.x;
			const dy = touchY - basePos.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			let clampedX = dx;
			let clampedY = dy;

			if (dist > MAX_DISTANCE) {
				clampedX = (dx / dist) * MAX_DISTANCE;
				clampedY = (dy / dist) * MAX_DISTANCE;
			}

			setThumbPos({
				x: basePos.x + clampedX,
				y: basePos.y + clampedY,
			});

			// Normalize to -1..1 range
			const vx = clampedX / MAX_DISTANCE;
			const vy = clampedY / MAX_DISTANCE;

			// Dispatch to Phaser scene
			window.dispatchEvent(
				new CustomEvent("joystick-move", {
					detail: { vx, vy },
				}),
			);
		},
		[active, basePos],
	);

	const handleTouchEnd = useCallback(() => {
		setActive(false);
		setThumbPos(basePos);
		window.dispatchEvent(new CustomEvent("joystick-stop"));
	}, [basePos]);

	return (
		<div
			ref={zoneRef}
			className="joystick-zone"
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
		>
			<div
				className="joystick-base"
				style={{
					left: basePos.x - 60,
					top: basePos.y - 60,
					opacity: active ? 1 : 0.7,
				}}
			/>
			<div
				className="joystick-thumb"
				style={{
					left: thumbPos.x - 25,
					top: thumbPos.y - 25,
					opacity: active ? 1 : 0.75,
				}}
			/>
		</div>
	);
}
