"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	DndContext,
	useDraggable,
	useDroppable,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	closestCenter,
	type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { gameClient } from "@/lib/network/client";
import type { GameObjectType, HeldItem, InventoryItem } from "@/lib/protocol";
import { PROCESS_DURATIONS, PROCESS_LABELS, slowSend } from "@/lib/slowSend";
import { WorkbenchSheet } from "./workbench/WorkbenchSheet";

// ────────────────────────────────────────────────────────────────────────────
// REWRITE: ObjectSheet konsisten dengan WorkbenchSheet — drag-and-drop dengan
// tangan di SAMPING KANAN.
//
// Variant:
//   - workbench   → delegate ke WorkbenchSheet
//   - storage / reagent_table / oven / furnace → object panel (kiri scroll y)
//                  + hand panel (kanan fixed). Drag object→hand = take.
//                  Drag hand→object = place (slowSend oven/furnace).
//   - waste       → disposal zone (kiri) + hand (kanan). Drag hand→disposal.
//   - timbangan   → weigh widget (kiri) + hand (kanan, drag-readonly).
// ────────────────────────────────────────────────────────────────────────────

const OBJECT_LABELS: Record<GameObjectType, string> = {
	workbench: "Meja Kerja",
	storage: "Penyimpanan Alat",
	reagent_table: "Meja Pereaksi",
	timbangan: "Timbangan Analitik",
	oven: "Oven Pengering",
	furnace: "Tanur",
	waste: "Pembuangan",
};

const OBJECT_DESC: Record<GameObjectType, string> = {
	workbench: "Tempat menaruh alat dan bahan untuk praktikum",
	storage: "Lemari penyimpanan alat",
	reagent_table: "Tempat penyimpanan bahan/pereaksi",
	timbangan: "Pegang wadah + bahan padat, lalu timbang",
	oven: "Taruh wadah sampel untuk proses pengeringan",
	furnace: "Taruh wadah sampel untuk proses pemijaran di tanur",
	waste: "Buang isi wadah (padatan/larutan)",
};

const ITEM_EMOJI: Record<string, string> = {
	"piala-gelas": "🧪",
	"pengaduk-kaca": "🥢",
	"hot-plate": "🔥",
	meker: "🔥",
	"corong-stand": "⏬",
	"kertas-saring": "📄",
	erlenmeyer: "🧪",
	"tabung-reaksi": "🧫",
	"kertas-lakmus": "📏",
	"krus-porselen": "🏺",
	"kaca-arloji": "⏺",
	terusi: "💎",
	"air-suling": "💧",
	h2so4: "⚗️",
	naoh: "⚗️",
	"naoh-1n": "⚗️",
	"naoh-8n": "⚗️",
	"koh-4n": "⚗️",
	"nh4oh-4n": "⚗️",
	bacl2: "⚗️",
	hcl: "⚗️",
	"oven-lab": "♨️",
	"furnace-lab": "🔥",
	desikator: "🧊",
	"cuo-hasil-pijar": "⚫",
};

function contentKind(itemId: string): string {
	const sep = itemId.indexOf("::");
	return sep === -1 ? itemId : itemId.slice(0, sep);
}

function getItemKind(item: InventoryItem | HeldItem): string {
	return item.baseItemId ?? contentKind(item.itemId);
}

function formatMeasurement(item: InventoryItem | HeldItem): string {
	const parts: string[] = [];
	if (item.weightGrams !== undefined && item.weightGrams > 0) parts.push(`${item.weightGrams}g`);
	if (item.volumeMl !== undefined && item.volumeMl > 0) parts.push(`${item.volumeMl}mL`);
	if (item.contents && item.contents.length > 0) {
		const inner = item.contents
			.map((c) => {
				let base = c.name;
				if (contentKind(c.itemId) === "cuo-hasil-pijar") base = c.name;
				else if (c.weightGrams) base = `${c.name} ${c.weightGrams}g`;
				else if (c.volumeMl) base = `${c.name} ${c.volumeMl}mL`;
				return c.dissolved ? `${base} (terlarut)` : base;
			})
			.join(", ");
		parts.push(`isi: ${inner}`);
	}
	if (item.labMeta?.lastRecordedMassG !== undefined) {
		parts.push(`bobot tercatat ${item.labMeta.lastRecordedMassG}g`);
	}
	return parts.join(" · ");
}

// ── Draggable card (object panel + hand) ──────────────────────────────────

function DraggableObjectCard({
	id,
	item,
	variant,
}: {
	id: string;
	item: InventoryItem | HeldItem;
	variant: "object" | "hand";
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id,
		data: { item, source: variant, itemId: item.itemId },
	});
	const style = {
		transform: CSS.Translate.toString(transform),
		zIndex: isDragging ? 999 : undefined,
		opacity: isDragging ? 0.85 : 1,
	};
	const kind = getItemKind(item);
	const size = variant === "object" ? "w-[116px] h-[108px]" : "w-[96px] h-[88px]";
	const tone =
		variant === "object" ? "border-neutral-200 text-neutral-700" : "border-amber-200 text-amber-800";

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={`relative flex flex-col items-center justify-center rounded-xl border bg-white shadow-sm select-none touch-none ${size} ${tone} ${
				isDragging ? "shadow-lg ring-2 ring-primary-400" : "cursor-grab active:cursor-grabbing"
			}`}
		>
			{"quantity" in item && item.quantity > 1 && (
				<span className="absolute right-1 top-1 rounded bg-neutral-100 px-1 py-0.5 text-[9px] font-semibold text-neutral-500">
					x{item.quantity}
				</span>
			)}
			<span className={variant === "object" ? "text-xl" : "text-lg"}>
				{ITEM_EMOJI[kind] ?? "📦"}
			</span>
			<span className="mt-1 w-full px-1 text-center text-[10px] leading-tight whitespace-normal break-words">
				{item.name}
			</span>
			{formatMeasurement(item) && (
				<span className={`mt-0.5 w-full px-1 text-center text-[9px] leading-tight whitespace-normal break-words ${variant === "object" ? "text-neutral-400" : "text-amber-500"}`}>
					{formatMeasurement(item)}
				</span>
			)}
		</div>
	);
}

// ── Droppable zones ───────────────────────────────────────────────────────

function ObjectPanel({
	label,
	hint,
	children,
	tone = "neutral",
	highlight,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
	tone?: "neutral" | "rose";
	highlight: boolean;
}) {
	const { setNodeRef, isOver } = useDroppable({ id: "drop-object", data: { type: "object" } });
	const base =
		tone === "rose"
			? "border-rose-200 bg-rose-50/40"
			: "border-neutral-200 bg-neutral-50";
	const active = isOver
		? "ring-2 ring-primary-400 border-primary-300"
		: highlight
			? "border-primary-300"
			: "";
	return (
		<div ref={setNodeRef} className={`flex-1 min-w-0 min-h-0 flex flex-col rounded-2xl border-2 border-dashed transition-all ${base} ${active}`}>
			<div className="px-3 pt-2 pb-1 shrink-0 flex items-center justify-between">
				<p className={`text-[10px] uppercase tracking-wide font-semibold ${tone === "rose" ? "text-rose-600" : "text-neutral-500"}`}>{label}</p>
				{hint && <p className="text-[10px] text-neutral-400">{hint}</p>}
			</div>
			<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-2 pb-2">
				{children}
			</div>
		</div>
	);
}

function WasteDisposalZone() {
	const { setNodeRef, isOver } = useDroppable({ id: "drop-waste-disposal", data: { type: "disposal" } });
	return (
		<div
			ref={setNodeRef}
			className={`flex-1 min-h-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all ${
				isOver ? "bg-rose-100 border-rose-400 ring-2 ring-rose-300" : "bg-rose-50/40 border-rose-200"
			}`}
		>
			<p className="text-4xl">🛢️</p>
			<p className="mt-2 text-sm font-semibold text-rose-700">Buang ke sini</p>
			<p className="mt-0.5 text-[11px] text-rose-500 text-center px-2">
				Geser wadah dari tangan ke sini — wadah tetap di tangan, isinya dibuang
			</p>
		</div>
	);
}

function HandPanel({
	holding,
	highlight,
	children,
}: {
	holding: HeldItem[];
	highlight: boolean;
	children: React.ReactNode;
}) {
	const { setNodeRef, isOver } = useDroppable({ id: "drop-hand", data: { type: "hand" } });
	const dynamic = isOver
		? "bg-amber-100 border-amber-400"
		: highlight
			? "bg-amber-100/60 border-amber-300"
			: "bg-amber-50 border-amber-200";
	return (
		<div
			ref={setNodeRef}
			className={`shrink-0 flex flex-col items-center gap-2 w-[120px] p-2 rounded-2xl border-2 transition-colors touch-none ${dynamic}`}
		>
			<p className="text-[10px] uppercase tracking-wide font-semibold text-amber-600 mt-0.5">
				Tangan {holding.length}/2
			</p>
			{children}
		</div>
	);
}

// ── Main ──────────────────────────────────────────────────────────────────

export function ObjectSheet() {
	const [open, setOpen] = useState(false);
	const [objectId, setObjectId] = useState<string | null>(null);
	const [objectType, setObjectType] = useState<GameObjectType | null>(null);
	const [holding, setHolding] = useState<HeldItem[]>([]);
	const [weighGrams, setWeighGrams] = useState("");
	const [, setRecordMassG] = useState("");
	const [isDragging, setIsDragging] = useState(false);
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

	const handleClose = useCallback(() => {
		setOpen(false);
		setObjectId(null);
		setObjectType(null);
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

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, handleClose]);

	// Sensors — match WorkbenchSheet
	const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 6 } });
	const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } });
	const sensors = useSensors(mouseSensor, touchSensor);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			setIsDragging(false);
			const itemId = event.active.data.current?.itemId as string | undefined;
			const source = event.active.data.current?.source as "object" | "hand" | undefined;
			const overId = event.over ? String(event.over.id) : "";
			if (!itemId || !source || !overId) return;
			// object → hand : take
			if (source === "object" && overId === "drop-hand") {
				handleTake(itemId);
				return;
			}
			// hand → object : place (blocked for timbangan; rejected gracefully)
			if (source === "hand" && overId === "drop-object" && objectType !== "timbangan") {
				handlePlace(itemId);
				return;
			}
			// hand → disposal (waste variant)
			if (source === "hand" && overId === "drop-waste-disposal" && objectType === "waste") {
				const held = holding.find((h) => h.itemId === itemId);
				if (!held) return;
				const kind = contentKind(held.itemId);
				const canDiscard =
					held.category === "alat" &&
					(held.maxVolumeMl !== undefined || kind === "corong-stand") &&
					(held.contents ?? []).length > 0;
				if (canDiscard) handleDiscardHeld(itemId);
				return;
			}
		},
		[handleTake, handlePlace, handleDiscardHeld, objectType, holding],
	);

	if (!open) return null;

	// Workbench: delegate
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
	const isWaste = objectType === "waste";
	const heldBahan = holding.find((h) => h.category === "bahan" && (h.weightGrams ?? 0) > 0);
	const heldContainer = holding.find((h) => h.category === "alat" && h.maxVolumeMl !== undefined);
	const heldCuoContainer = holding.find(
		(h) =>
			h.category === "alat" &&
			(h.contents ?? []).some((c) => contentKind(c.itemId) === "cuo-hasil-pijar" && (c.weightGrams ?? 0) > 0),
	);
	const cuoBalanceReadingG = heldCuoContainer?.labMeta?.cuoMassG;
	const canWeigh = isTimbangan && !!heldBahan && !!heldContainer;
	const canRecordMass = isTimbangan && !!heldCuoContainer && cuoBalanceReadingG !== undefined;
	const weighingTerusi = canWeigh && contentKind(heldBahan!.itemId) === "terusi";
	const containerKindForWeigh = heldContainer ? contentKind(heldContainer.itemId) : null;
	const alreadyInContainerG = weighingTerusi
		? (heldContainer!.contents ?? []).reduce(
				(sum, c) => (contentKind(c.itemId) === "terusi" ? sum + (c.weightGrams ?? 0) : sum),
				0,
			)
		: 0;
	const nonCanonicalContainer = weighingTerusi && containerKindForWeigh !== "kaca-arloji";
	const availableItems = currentItems.filter((i) => i.quantity > 0);
	const handFull = holding.length >= 2;

	return (
		<>
			<div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />
			<div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
				<div
					className="pointer-events-auto w-full max-w-lg bg-white rounded-t-3xl shadow-xl animate-slide-up flex min-h-0 flex-col"
					style={{ maxHeight: "85dvh" }}
				>
					<div className="flex justify-center pt-2 pb-2 shrink-0">
						<div className="w-12 h-1.5 rounded-full bg-neutral-300 cursor-pointer" onClick={handleClose} />
					</div>
					<div className="px-4 pb-3 shrink-0">
						<h2 className={`heading-1 ${isWaste ? "text-rose-700" : "text-neutral-800"}`}>
							{isWaste && "🗑️ "}{objectType ? OBJECT_LABELS[objectType] : "Objek"}
						</h2>
						<p className="body-4 text-neutral-500 mt-0.5">
							{isTimbangan
								? "Pegang wadah + bahan padat, lalu timbang."
								: isWaste
									? "Geser wadah dari tangan ke zona pembuangan."
									: "Geser item dari objek ke tangan, atau dari tangan ke objek."}
						</p>
					</div>

					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={() => setIsDragging(true)}
						onDragCancel={() => setIsDragging(false)}
						onDragEnd={handleDragEnd}
						autoScroll={{ threshold: { x: 0, y: 0.15 }, acceleration: 8 }}
					>
						<div className="flex flex-1 min-h-0 gap-2 px-3 pb-3">
							{/* LEFT: object panel / waste disposal / timbangan widget */}
							{isWaste ? (
								<WasteDisposalZone />
							) : isTimbangan ? (
								<TimbanganWidget
									canWeigh={canWeigh}
									weighingTerusi={weighingTerusi}
									heldBahan={heldBahan}
									heldContainer={heldContainer}
									heldCuoContainer={heldCuoContainer}
									cuoBalanceReadingG={cuoBalanceReadingG}
									canRecordMass={canRecordMass}
									alreadyInContainerG={alreadyInContainerG}
									nonCanonicalContainer={nonCanonicalContainer}
									weighGrams={weighGrams}
									setWeighGrams={setWeighGrams}
									weighInputRef={weighInputRef}
									handleScoop={handleScoop}
									handleWeigh={handleWeigh}
									handleClose={handleClose}
									handleDiscardHeld={handleDiscardHeld}
									setRecordMassG={setRecordMassG}
								/>
							) : (
								<ObjectPanel
									label={objectType ? OBJECT_LABELS[objectType] : "Objek"}
									hint={isDragging ? "Lepas di sini untuk taruh" : "Geser ke tangan"}
									highlight={isDragging}
								>
									{availableItems.length === 0 ? (
										<p className="flex h-32 items-center justify-center text-sm text-neutral-400">
											Kosong
										</p>
									) : (
										<div className="flex flex-wrap gap-2 content-start py-1">
											{availableItems.map((item) => (
												<DraggableObjectCard
													key={item.itemId}
													id={`object-${item.itemId}`}
													item={item}
													variant="object"
												/>
											))}
										</div>
									)}
								</ObjectPanel>
							)}

							{/* RIGHT: hand panel */}
							<HandPanel holding={holding} highlight={isDragging}>
								{holding.length === 0 ? (
									<p className="m-auto text-[10px] text-amber-500 italic select-none text-center px-1">
										Tangan kosong
									</p>
								) : (
									<>
										{holding.map((item, idx) => (
											<DraggableObjectCard
												key={`${item.itemId}-${idx}`}
												id={`hand-${item.itemId}-${idx}`}
												item={item}
												variant="hand"
											/>
										))}
										{holding.length === 1 && (
											<div className="w-[96px] h-[88px] rounded-xl border-2 border-dashed border-amber-200 flex items-center justify-center text-amber-300 text-xl shrink-0 select-none">
												+
											</div>
										)}
									</>
								)}
							</HandPanel>
						</div>
					</DndContext>

					{/* Footer hint */}
					<div className="px-4 pb-[calc(env(safe-area-inset-bottom,0)+10px)] shrink-0">
						{isTimbangan ? (
							<p className="text-[10px] text-neutral-400 text-center leading-snug">
								Untuk menimbang, pegang wadah + bahan padat di tangan.
							</p>
						) : isWaste ? (
							<p className="text-[10px] text-neutral-400 text-center leading-snug">
								Hanya wadah dengan isi yang bisa dibuang.
							</p>
						) : objectType === "oven" || objectType === "furnace" ? (
							<p className="text-[10px] text-neutral-400 text-center leading-snug">
								Drop wadah di {OBJECT_LABELS[objectType].toLowerCase()} untuk memulai proses ({(PROCESS_DURATIONS[objectType] / 1000).toFixed(0)}s).
							</p>
						) : handFull ? (
							<p className="text-[10px] text-amber-600 text-center leading-snug">
								Tangan penuh — kembalikan dulu salah satu sebelum ambil item baru.
							</p>
						) : (
							<p className="text-[10px] text-neutral-400 text-center leading-snug">
								Geser item ke samping (tangan) — scroll vertikal aman.
							</p>
						)}
					</div>
				</div>
			</div>
		</>
	);
}

// ── Timbangan widget (unchanged behavior, just contained component) ──────

function TimbanganWidget({
	canWeigh, weighingTerusi, heldBahan, heldContainer, heldCuoContainer,
	cuoBalanceReadingG, canRecordMass, alreadyInContainerG, nonCanonicalContainer,
	weighGrams, setWeighGrams, weighInputRef, handleScoop, handleWeigh, handleClose,
	handleDiscardHeld, setRecordMassG,
}: {
	canWeigh: boolean;
	weighingTerusi: boolean;
	heldBahan?: HeldItem;
	heldContainer?: HeldItem;
	heldCuoContainer?: HeldItem;
	cuoBalanceReadingG?: number;
	canRecordMass: boolean;
	alreadyInContainerG: number;
	nonCanonicalContainer: boolean;
	weighGrams: string;
	setWeighGrams: (v: string) => void;
	weighInputRef: React.RefObject<HTMLInputElement | null>;
	handleScoop: () => void;
	handleWeigh: () => void;
	handleClose: () => void;
	handleDiscardHeld: (id: string) => void;
	setRecordMassG: (v: string) => void;
}) {
	return (
		<div className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain touch-pan-y">
			{canWeigh && weighingTerusi ? (
				<div className="px-3 py-3 rounded-xl bg-green-50 border border-green-200">
					<p className="text-[11px] text-green-700/80 uppercase tracking-wide">Neraca Analitik</p>
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
							type="button"
							onClick={handleScoop}
							disabled={(heldBahan!.weightGrams ?? 0) <= 0}
							className="col-span-2 px-3 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							🥄 Ambil sedikit sampel
						</button>
						<button
							type="button"
							onClick={() => handleDiscardHeld(heldContainer!.itemId)}
							disabled={alreadyInContainerG <= 0}
							className="px-3 py-2 rounded-lg bg-white border border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
						>
							🗑️ Kosongkan wadah
						</button>
						<button
							type="button"
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
								<span className="font-mono font-semibold">{alreadyInContainerG.toFixed(4)} g</span>{" "}
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
				<div className="px-3 py-3 rounded-xl bg-green-50 border border-green-200">
					<p className="text-sm text-green-800 mb-2">
						Timbang <span className="font-semibold">{heldBahan!.name}</span>{" "}
						({heldBahan!.weightGrams}g tersisa) ke{" "}
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
							type="button"
							onClick={handleWeigh}
							className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors"
						>
							Timbang
						</button>
					</div>
				</div>
			) : canRecordMass ? (
				<div className="px-3 py-3 rounded-xl bg-blue-50 border border-blue-200">
					<p className="text-[11px] text-blue-700/80 uppercase tracking-wide">Neraca Analitik</p>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="font-mono text-3xl font-semibold tabular-nums text-blue-800">
							{cuoBalanceReadingG!.toFixed(4)}
						</span>
						<span className="text-sm text-neutral-500">g</span>
					</div>
					<p className="mt-0.5 text-[11px] text-blue-700/70">
						{heldCuoContainer!.name} berisi CuO hasil pijar yang sudah didinginkan
					</p>
					<div className="mt-3">
						<button
							type="button"
							onClick={() => {
								setRecordMassG(cuoBalanceReadingG!.toFixed(4));
								gameClient.send({
									type: "record_mass",
									containerItemId: heldCuoContainer!.itemId,
									measuredMassG: cuoBalanceReadingG!,
								});
							}}
							className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors"
						>
							Catat bobot CuO
						</button>
					</div>
				</div>
			) : (
				<div className="px-3 py-3 rounded-xl bg-neutral-50 border border-neutral-200">
					<p className="text-sm text-neutral-500">
						{!heldBahan && !heldContainer && "Bawa wadah + bahan padat ke tangan untuk menimbang, atau pegang wadah berisi CuO untuk pencatatan bobot."}
						{!heldBahan && heldContainer && "Ambil bahan padat ke tangan untuk ditimbang."}
						{heldBahan && !heldContainer && "Ambil wadah ke tangan (kaca arloji, piala gelas, dll.)."}
					</p>
				</div>
			)}
		</div>
	);
}
