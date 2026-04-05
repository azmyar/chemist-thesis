"use client";

import { useCallback, useEffect, useState } from "react";
import { gameClient } from "@/lib/network/client";
import type { GameObjectType, InventoryItem } from "@/lib/protocol";

const OBJECT_LABELS: Record<GameObjectType, string> = {
	workbench: "Meja Kerja",
	storage: "Penyimpanan",
};

const OBJECT_DESC: Record<GameObjectType, string> = {
	workbench: "Tempat menaruh alat dan bahan untuk praktikum",
	storage: "Lemari penyimpanan alat dan bahan",
};

export function ObjectSheet() {
	const [open, setOpen] = useState(false);
	const [objectId, setObjectId] = useState<string | null>(null);
	const [objectType, setObjectType] = useState<GameObjectType | null>(null);
	const [holding, setHolding] = useState<string | null>(null);

	// Items per object
	const [objectItems, setObjectItems] = useState<
		Record<string, InventoryItem[]>
	>({});

	const currentItems = objectId ? objectItems[objectId] ?? [] : [];

	// Listen for Phaser events
	useEffect(() => {
		const onInteract = ((e: CustomEvent) => {
			setObjectId(e.detail.objectId);
			setObjectType(e.detail.objectType);
			setOpen(true);
		}) as EventListener;

		const onItemsChanged = ((e: CustomEvent) => {
			const { objectId: id, items } = e.detail;
			setObjectItems((prev) => ({ ...prev, [id]: items }));
		}) as EventListener;

		const onHoldChanged = ((e: CustomEvent) => {
			setHolding(e.detail.item);
		}) as EventListener;

		window.addEventListener("object-interact", onInteract);
		window.addEventListener("object-items-changed", onItemsChanged);
		window.addEventListener("local-hold-changed", onHoldChanged);
		return () => {
			window.removeEventListener("object-interact", onInteract);
			window.removeEventListener("object-items-changed", onItemsChanged);
			window.removeEventListener("local-hold-changed", onHoldChanged);
		};
	}, []);

	const handleTake = useCallback(
		(itemId: string) => {
			if (!objectId || holding) return;
			gameClient.send({ type: "take_item", objectId, itemId });
		},
		[objectId, holding],
	);

	const handlePlace = useCallback(() => {
		if (!objectId || !holding) return;
		gameClient.send({ type: "place_item", objectId });
	}, [objectId, holding]);

	const handleClose = useCallback(() => {
		setOpen(false);
		setObjectId(null);
		setObjectType(null);
	}, []);

	if (!open) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/30 z-40"
				onClick={handleClose}
			/>

			{/* Sheet */}
			<div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
				<div className="pointer-events-auto w-full max-w-lg bg-white rounded-t-3xl shadow-xl animate-slide-up">
					{/* Handle */}
					<div className="flex justify-center pt-3 pb-2">
						<div
							className="w-12 h-1.5 rounded-full bg-neutral-300 cursor-pointer"
							onClick={handleClose}
						/>
					</div>

					{/* Content */}
					<div className="px-6 pb-8">
						<h2 className="text-lg font-semibold text-neutral-800 mb-0.5">
							{objectType ? OBJECT_LABELS[objectType] : "Object"}
						</h2>
						<p className="text-sm text-neutral-500 mb-4">
							{objectType ? OBJECT_DESC[objectType] : ""}
						</p>

						{/* Holding indicator + place button */}
						{holding && (
							<div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
								<span className="text-sm text-amber-800 flex-1">
									Kamu memegang:{" "}
									<span className="font-semibold">{holding}</span>
								</span>
								<button
									onClick={handlePlace}
									className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 active:bg-amber-700 transition-colors"
								>
									Taruh di sini
								</button>
							</div>
						)}

						{/* Item list */}
						<div className="max-h-64 overflow-y-auto">
							{currentItems.filter((i) => i.quantity > 0).length === 0 && !holding && (
								<p className="text-sm text-neutral-400 text-center py-6">
									Kosong
								</p>
							)}

							{currentItems.filter((i) => i.quantity > 0).map((item) => (
								<div
									key={item.itemId}
									className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-b-0"
								>
									<span className="flex-1 text-sm text-neutral-700">
										{item.name}
									</span>
									<span className="text-xs text-neutral-400 tabular-nums">
										x{item.quantity}
									</span>
									<button
										onClick={() => handleTake(item.itemId)}
										disabled={
											item.quantity <= 0 || holding !== null
										}
										className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
									>
										Ambil
									</button>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
