"use client";

import { useEffect, useRef, useState } from "react";
import { gameClient } from "@/lib/network/client";

export function ChatOverlay() {
	const [input, setInput] = useState("");
	const [focused, setFocused] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	// Press Enter to focus chat, Escape to blur
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Enter" && !focused) {
				e.preventDefault();
				inputRef.current?.focus();
			}
			if (e.key === "Escape" && focused) {
				inputRef.current?.blur();
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [focused]);

	const sendMessage = () => {
		const text = input.trim();
		if (!text) return;
		gameClient.send({ type: "chat", text: text.slice(0, 200) });
		setInput("");
		inputRef.current?.blur();
	};

	return (
		<div
			className="chat-overlay absolute z-40 flex items-center gap-2 pointer-events-auto
				bottom-4 left-4
				max-[640px]:bottom-auto max-[640px]:left-3 max-[640px]:top-3 max-[640px]:w-[min(200px,48vw)]"
		>
			<input
				ref={inputRef}
				type="text"
				value={input}
				onChange={(e) => setInput(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						sendMessage();
					}
					e.stopPropagation();
				}}
				placeholder="Tekan Enter untuk chat..."
				maxLength={200}
				className="chat-overlay-input w-64 max-[640px]:w-full max-[640px]:placeholder:text-xs max-[640px]:text-xs max-[640px]:py-1 px-3 py-1.5 rounded-lg bg-black/60 border border-neutral-600 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-cyan-500 transition-colors"
			/>
			<button
				onMouseDown={(e) => e.preventDefault()}
				onClick={sendMessage}
				className="chat-overlay-button px-3 py-1.5 max-[640px]:px-2 max-[640px]:py-1 max-[640px]:text-xs rounded-lg bg-cyan-600 hover:bg-cyan-500 text-sm text-white font-medium transition-colors shrink-0"
			>
				Kirim
			</button>
		</div>
	);
}
