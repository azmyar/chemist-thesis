"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gameClient } from "@/lib/network/client";
import type { GameObjectType, HeldItem, InventoryItem } from "@/lib/protocol";
import { PROCESS_DURATIONS, PROCESS_LABELS, slowSend } from "@/lib/slowSend";
import { WorkbenchSheet } from "./workbench/WorkbenchSheet";

const OBJECT_LABELS: Record<GameObjectType, string> = {
	workbench: "Meja Kerja",
	storage: "Penyimpanan Alat",
	reagent_table: "Meja Pereaksi",
	timbangan: "Timbangan Analitik",
	oven: "Oven Pengering",
	furnace: "Tanur (Furnace)",
};

const OBJECT_DESC: Record<GameObjectType, string> = {
	workbench: "Tempat menaruh alat dan bahan untuk praktikum",
	storage: "Lemari penyimpanan alat",
	reagent_table: "Tempat penyimpanan bahan/pereaksi",
	timbangan: "Pegang wadah + bahan padat, lalu timbang",
	oven: "Taruh wadah sampel untuk proses pengeringan",
	furnace: "Taruh wadah sampel untuk proses pemijaran",
};

function contentKind(itemId: string): string {
	const separator = itemId.indexOf("::");
	return separator === -1 ? itemId : itemId.slice(0, separator);
}

function formatMeasurement(item: InventoryItem | HeldItem): string {
	const parts: string[] = [];
	if (item.weightGrams !== undefined && item.weightGrams > 0)
		parts.push(`${item.weightGrams}g`);
	if (item.volumeMl !== undefined && item.volumeMl > 0)
		parts.push(`${item.volumeMl}mL`);
	if (item.contents && item.contents.length > 0) {
		const inner = item.contents
			.map((c) => {
				let base = c.name;
				if (c.weightGrams) base = `${c.name} ${c.weightGrams}g`;
				else if (c.volumeMl) base = `${c.name} ${c.volumeMl}mL`;
				return c.dissolved ? `${base} (terlarut)` : base;
			})
			.join(", ");
		parts.push(`isi: ${inner}`);
	}
	return parts.join(" · ");
}

export function ObjectSheet() {
	const [open, setOpen] = useState(false);
	const [objectId, setObjectId] = useState<string | null>(null);
	const [objectType, setObjectType] = useState<GameObjectType | null>(null);
	const [holding, setHolding] = useState<HeldItem[]>([]);
	const [weighGrams, setWeighGrams] = useState("");
	const [recordMassG, setRecordMassG] = useState("");
	const weighInputRef = useRef<HTMLInputElement>(null);

	const [objectItems, setObjectItems] = useState<Record<string, InventoryItem[]>>({});
	const currentItems = objectId ? objectItems[objectId] ?? [] : [];

	useEffect(() => {
		const onInteract = ((e: CustomEvent) => {
			setObjectId(e.detail.objectId);
			setObjectType(e.detail.objectType);
			setWeighGrams("");
			setRecordMassG("");
			setOpen(true);
		}) as EventListener;

		const onItemsChanged = ((e: CustomEvent) => {
			const { objectId: id, items } = e.detail;
			setObjectItems((prev) => ({ ...prev, [id]: items }));
		}) as EventListener;

		const onHoldChanged = ((e: CustomEvent) => {
			setHolding(e.detail.holding ?? []);
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
			if (!objectId || holding.length >= 2) return;
			gameClient.send({ type: "take_item", objectId, itemId });
		},
		[objectId, holding],
	);

	const handlePlace = useCallback(
		(itemId: string) => {
			if (!objectId) return;
			const message = { type: "place_item" as const, objectId, itemId };
			if (objectType === "oven") {
				slowSend(message, PROCESS_LABELS.oven, PROCESS_DURATIONS.oven);
				return;
			}
			if (objectType === "furnace") {
				slowSend(message, PROCESS_LABELS.furnace, PROCESS_DURATIONS.furnace);
				return;
			}
			gameClient.send(message);
		},
		[objectId, objectType],
	);

	const handleWeigh = useCallback(() => {
		const grams = parseFloat(weighGrams);
		if (Number.isNaN(grams) || grams <= 0) return;
		gameClient.send({ type: "weigh_item", transferGrams: grams });
		setWeighGrams("");
	}, [weighGrams]);

	const handleScoop = useCallback(() => {
		gameClient.send({ type: "scoop_sample" });
	}, []);

	const handleDiscardHeld = useCallback((itemId: string) => {
		gameClient.send({ type: "discard_held_contents", itemId });
	}, []);

	const handleRecordMass = useCallback(
		(containerItemId: string) => {
			const grams = parseFloat(recordMassG);
			if (Number.isNaN(grams) || grams <= 0) return;
			gameClient.send({
				type: "record_mass",
				containerItemId,
				measuredMassG: grams,
			});
			setRecordMassG("");
		},
		[recordMassG],
	);

	const handleClose = useCallback(() => {
		setOpen(false);
		setObjectId(null);
		setObjectType(null);
	}, []);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, handleClose]);

	if (!open) return null;

	// Workbench uses its own drag-and-drop sheet
	if (objectType === "workbench" && objectId) {
		return (
			<WorkbenchSheet
				objectId={objectId}
				items={currentItems}
				holding={holding}
				onClose={handleClose}
			/>
		);
	}

	const isTimbangan = objectType === "timbangan";
	const heldBahan = holding.find((h) => h.category === "bahan" && (h.weightGrams ?? 0) > 0);
	const heldContainer = holding.find((h) => h.category === "alat" && h.maxVolumeMl !== undefined);
	const heldCuoContainer = holding.find(
		(h) =>
			h.category === "alat" &&
			(h.contents ?? []).some((c) => contentKind(c.itemId) === "cuo-hasil-pijar" && (c.weightGrams ?? 0) > 0),
	);
	const canWeigh = isTimbangan && !!heldBahan && !!heldContainer;
	const canRecordMass = isTimbangan && !!heldCuoContainer;

	// Step 1 — Open-world weighing advisories for terusi sample.
	// Scoop-based interaction; server accepts any cumulative mass.
	const weighingTerusi = canWeigh && contentKind(heldBahan!.itemId) === "terusi";
	const containerKindForWeigh = heldContainer ? contentKind(heldContainer.itemId) : null;
	const alreadyInContainerG = weighingTerusi
		? (heldContainer!.contents ?? []).reduce(
				(sum, c) => (contentKind(c.itemId) === "terusi" ? sum + (c.weightGrams ?? 0) : sum),
				0,
			)
		: 0;
	const nonCanonicalContainer = weighingTerusi && containerKindForWeigh !== "kaca-arloji";

	return (
		<>
			<div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />

			<div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
				<div
					className="pointer-events-auto w-full max-w-lg bg-white rounded-t-3xl shadow-xl animate-slide-up flex flex-col"
					style={{ maxHeight: "min(85dvh, 720px)" }}
				>
					<div className="flex justify-center pt-3 pb-2 shrink-0">
						<div className="w-12 h-1.5 rounded-full bg-neutral-300 cursor-pointer" onClick={handleClose} />
					</div>

					<div
						className="px-6 pb-8 overflow-y-auto"
						style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
					>
						<h2 className="text-lg font-semibold text-neutral-800 mb-0.5">
							{objectType ? OBJECT_LABELS[objectType] : "Object"}
						</h2>
						<p className="text-sm text-neutral-500 mb-4">
							{objectType ? OBJECT_DESC[objectType] : ""}
						</p>

						{/* Holding indicator */}
						{holding.length > 0 && (
							<div className="mb-4 space-y-2">
								{holding.map((item) => (
									<div
										key={item.itemId}
										className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200"
									>
										<div className="flex-1">
											<span className="text-sm text-amber-800">
												🤲 <span className="font-semibold">{item.name}</span>
											</span>
											{formatMeasurement(item) && (
												<span className="text-xs text-amber-600 ml-1.5">
													({formatMeasurement(item)})
												</span>
											)}
										</div>
										{!isTimbangan && (
											<button
												onClick={() => handlePlace(item.itemId)}
												className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 active:bg-amber-700 transition-colors shrink-0"
											>
												Taruh
											</button>
										)}
									</div>
								))}
							</div>
						)}

						{/* Timbangan weighing UI */}
						{isTimbangan && (
							<>
								{canWeigh && weighingTerusi ? (
									<div className="mb-4 px-3 py-3 rounded-xl bg-green-50 border border-green-200">
										<p className="text-[11px] text-green-700/80 uppercase tracking-wide">
											Neraca Analitik
										</p>
										<div className="mt-1 flex items-baseline gap-2">
											<span
												className={`font-mono text-3xl font-semibold tabular-nums ${
													alreadyInContainerG >= 0.45 && alreadyInContainerG <= 0.55
														? "text-emerald-700"
														: alreadyInContainerG > 0
															? "text-amber-700"
															: "text-neutral-400"
												}`}
											>
												{alreadyInContainerG.toFixed(4)}
											</span>
											<span className="text-sm text-neutral-500">g</span>
										</div>
										<p className="mt-0.5 text-[11px] text-green-700/70">
											{heldContainer!.name} · sumber: {heldBahan!.name} ({heldBahan!.weightGrams}g tersisa)
										</p>

										<div className="mt-3 grid grid-cols-2 gap-2">
											<button
												onClick={handleScoop}
												disabled={(heldBahan!.weightGrams ?? 0) <= 0}
												className="col-span-2 px-3 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												🥄 Ambil sedikit sampel
											</button>
											<button
												onClick={() => handleDiscardHeld(heldContainer!.itemId)}
												disabled={alreadyInContainerG <= 0}
												className="px-3 py-2 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
											>
												🗑️ Kosongkan wadah
											</button>
											<button
												onClick={handleClose}
												disabled={alreadyInContainerG <= 0}
												className="px-3 py-2 rounded-lg bg-neutral-800 text-white text-xs font-medium hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
											>
												✓ Selesai timbang
											</button>
										</div>

										<div className="mt-3 space-y-1">
											<p className="text-[11px] text-green-700/80">
												Rentang kerja gravimetri: <span className="font-mono">0,45–0,55 g</span>
											</p>
											{alreadyInContainerG > 0 && (alreadyInContainerG < 0.45 || alreadyInContainerG > 0.55) && (
												<p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
													Massa saat ini{" "}
													<span className="font-mono font-semibold">
														{alreadyInContainerG.toFixed(4)} g
													</span>{" "}
													di luar rentang standar. Tahap berikutnya akan terkunci sampai massa diperbaiki.
												</p>
											)}
											{nonCanonicalContainer && (
												<p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
													Penimbangan sampel harus dilakukan pada kaca arloji sebelum masuk ke tahap pelarutan.
												</p>
											)}
										</div>
									</div>
								) : canWeigh ? (
									<div className="mb-4 px-3 py-3 rounded-xl bg-green-50 border border-green-200">
										<p className="text-sm text-green-800 mb-2">
											Timbang{" "}
											<span className="font-semibold">{heldBahan!.name}</span>
											{" "}({heldBahan!.weightGrams}g tersisa) ke{" "}
											<span className="font-semibold">{heldContainer!.name}</span>
										</p>
										<div className="flex gap-2">
											<input
												ref={weighInputRef}
												type="number"
												step="0.0001"
												min="0"
												max={heldBahan!.weightGrams}
												value={weighGrams}
												onChange={(e) => setWeighGrams(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") handleWeigh();
													e.stopPropagation();
												}}
												onKeyUp={(e) => e.stopPropagation()}
												placeholder="Gram..."
												className="flex-1 px-3 py-2 rounded-lg border border-green-200 bg-white text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
											/>
											<button
												onClick={handleWeigh}
												className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
											>
												Timbang
											</button>
										</div>
									</div>
								) : canRecordMass ? (
									<div className="mb-4 px-3 py-3 rounded-xl bg-blue-50 border border-blue-200">
										<p className="text-sm text-blue-800 mb-2">
											Catat bobot CuO dari <span className="font-semibold">{heldCuoContainer!.name}</span>
										</p>
										<div className="flex gap-2">
											<input
												type="number"
												step="0.0001"
												min="0"
												value={recordMassG}
												onChange={(e) => setRecordMassG(e.target.value)}
												onKeyDown={(e) => {
													if (e.key === "Enter") handleRecordMass(heldCuoContainer!.itemId);
													e.stopPropagation();
												}}
												onKeyUp={(e) => e.stopPropagation()}
												placeholder="Gram CuO..."
												className="flex-1 px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
											/>
											<button
												onClick={() => handleRecordMass(heldCuoContainer!.itemId)}
												className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors"
											>
												Catat
											</button>
										</div>
									</div>
								) : (
									<div className="mb-4 px-3 py-3 rounded-xl bg-neutral-50 border border-neutral-200">
										<p className="text-sm text-neutral-500">
											{!heldBahan && !heldContainer && "Pegang wadah+bahan padat untuk menimbang atau wadah berisi CuO untuk pencatatan bobot"}
											{!heldBahan && heldContainer && "Ambil bahan padat untuk ditimbang"}
											{heldBahan && !heldContainer && "Ambil wadah (kaca arloji, piala gelas, dll.)"}
										</p>
									</div>
								)}
							</>
						)}

						{/* Item list (non-timbangan objects) */}
						{!isTimbangan && (
							<div className="max-h-64 overflow-y-auto">
								{currentItems.filter((i) => i.quantity > 0).length === 0 && holding.length === 0 && (
									<p className="text-sm text-neutral-400 text-center py-6">Kosong</p>
								)}

								{currentItems.filter((i) => i.quantity > 0).map((item) => (
									<div key={item.itemId} className="flex items-center gap-3 py-2.5 border-b border-neutral-100 last:border-b-0">
										<div className="flex-1">
											<span className="text-sm text-neutral-700">{item.name}</span>
											{formatMeasurement(item) && (
												<span className="text-xs text-neutral-400 ml-1.5">
													({formatMeasurement(item)})
												</span>
											)}
										</div>
										<span className="text-xs text-neutral-400 tabular-nums">x{item.quantity}</span>
										<button
											onClick={() => handleTake(item.itemId)}
											disabled={item.quantity <= 0 || holding.length >= 2}
											className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
										>
											Ambil
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
