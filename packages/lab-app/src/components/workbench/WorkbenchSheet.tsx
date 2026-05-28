"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
	DndContext,
	useDraggable,
	useDroppable,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	closestCenter,
	pointerWithin,
	type DragEndEvent,
	type CollisionDetection,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { gameClient } from "@/lib/network/client";
import type { HeldItem, InventoryItem } from "@/lib/protocol";
import { PROCESS_DURATIONS, PROCESS_LABELS, slowSend } from "@/lib/slowSend";
import {
	canDissolve,
	canPour,
	formatInfo,
	getContainerUsedVolume,
	hasDissolvedContents,
} from "./logic";

// ────────────────────────────────────────────────────────────────────────────
// REWRITE: drag-and-drop ⟂ orientasi.
// Layout: workspace di KIRI (overflow-y-auto, scroll vertikal sah), tangan
// di KANAN (fixed, tidak scroll). Sebelumnya tangan di BAWAH → drag vertikal
// ke tangan bertabrakan dengan scroll vertikal workspace. Sekarang drag ke
// tangan jadi gerakan HORIZONTAL — beda axis dengan scroll, zero konflik.
// autoScroll aktif lagi: drag ke item bawah/atas di workspace auto-scroll.
//
// Aksi "Buang isi" DIHAPUS dari sheet ini — pembuangan dilakukan via objek
// "Pembuangan" (waste) yang terpisah di lab.
// ────────────────────────────────────────────────────────────────────────────

const ITEM_EMOJI: Record<string, string> = {
	"piala-gelas": "🧪", "pengaduk-kaca": "🥢", "hot-plate": "🔥", "corong-stand": "⏬",
	meker: "🔥",
	"kertas-saring": "📄", erlenmeyer: "🧪", "tabung-reaksi": "🧫", "kertas-lakmus": "📏",
	"krus-porselen": "🏺", "kaca-arloji": "⏺", terusi: "💎", "air-suling": "💧",
	h2so4: "⚗️", naoh: "⚗️", bacl2: "⚗️", hcl: "⚗️",
	"filtrat-cucian": "💧",
	"oven-lab": "♨️", "furnace-lab": "🔥", desikator: "🧊", "cuo-hasil-pijar": "⚫",
};

function getItemKind(item: InventoryItem | HeldItem): string {
	if (item.baseItemId) return item.baseItemId;
	const sep = item.itemId.indexOf("::");
	return sep === -1 ? item.itemId : item.itemId.slice(0, sep);
}

function kindFromItemId(itemId: string): string {
	const sep = itemId.indexOf("::");
	return sep === -1 ? itemId : itemId.slice(0, sep);
}

function hasSolidKind(item: InventoryItem | undefined, kind: string): boolean {
	return (item?.contents ?? []).some(
		(c) => kindFromItemId(c.itemId) === kind && (c.weightGrams ?? 0) > 0,
	);
}

function hasLiquidKind(item: InventoryItem | undefined, kind: string): boolean {
	return (item?.contents ?? []).some(
		(c) => kindFromItemId(c.itemId) === kind && (c.volumeMl ?? 0) > 0,
	);
}

// ── Pair action resolver (workspace-item drop target) ─────────────────────
type Slot = "workspace" | "hand";

type PairAction =
	| { kind: "none" }
	| { kind: "use_held_on_item"; heldItemId: string; targetItemId: string }
	| { kind: "combine_items"; itemIdA: string; itemIdB: string }
	| {
			kind: "pour_with_modal";
			sourceItemId: string;
			targetItemId: string;
			sourceName: string;
			targetName: string;
			maxTransferMl: number;
			defaultMl: number;
			isSulfateTest: boolean;
			completesDissolution: boolean;
	  }
	| {
			kind: "dissolve_silent";
			sourceItemId: string;
			targetItemId: string;
	  }
	| {
			kind: "dissolve_with_modal";
			sourceItemId: string;
			targetItemId: string;
			sourceName: string;
			targetName: string;
			solidSummary: string;
	  }
	| { kind: "combine_with_slow"; itemIdA: string; itemIdB: string; label: string; duration: number };

function tryUseHeldOnItem(held: HeldItem, target: InventoryItem): PairAction {
	if (target.category !== "alat" || target.maxVolumeMl === undefined) {
		return { kind: "none" };
	}
	const heldKind = getItemKind(held);
	const targetKind = getItemKind(target);
	const okHcBaCl =
		held.category === "bahan" &&
		(held.volumeMl ?? 0) > 0 &&
		(heldKind === "hcl" || heldKind === "bacl2") &&
		targetKind === "tabung-reaksi";
	const okLakmus = heldKind === "kertas-lakmus";
	if (!okHcBaCl && !okLakmus) return { kind: "none" };
	return { kind: "use_held_on_item", heldItemId: held.itemId, targetItemId: target.itemId };
}

function tryWorkspacePair(source: InventoryItem, target: InventoryItem): PairAction {
	if (source.itemId === target.itemId) return { kind: "none" };
	const sKind = getItemKind(source);
	const tKind = getItemKind(target);

	// 1) filter ↔ watch-glass
	if (
		(sKind === "kertas-saring" && tKind === "kaca-arloji") ||
		(sKind === "kaca-arloji" && tKind === "kertas-saring")
	) {
		return { kind: "combine_items", itemIdA: source.itemId, itemIdB: target.itemId };
	}

	// 2) residue ↔ crucible
	if (
		(sKind === "krus-porselen" && (tKind === "kaca-arloji" || tKind === "kertas-saring")) ||
		(tKind === "krus-porselen" && (sKind === "kaca-arloji" || sKind === "kertas-saring"))
	) {
		return { kind: "combine_items", itemIdA: source.itemId, itemIdB: target.itemId };
	}

	// 3) pour
	if (canPour(source, target)) {
		const remaining = (target.maxVolumeMl ?? 0) - getContainerUsedVolume(target);
		const baseTransfer = Math.min(source.volumeMl ?? 0, Math.max(0, remaining));
		const isSulfateTest =
			(sKind === "hcl" || sKind === "bacl2") &&
			tKind === "tabung-reaksi" &&
			(Boolean(target.labMeta?.fromFiltrate) || hasLiquidKind(target, "filtrat-cucian"));
		const maxTransferMl = isSulfateTest ? Math.min(1, baseTransfer) : baseTransfer;
		if (maxTransferMl <= 0) return { kind: "none" };
		const defaultMl = isSulfateTest
			? maxTransferMl
			: Math.min(10, Math.max(0.1, maxTransferMl));
		const completesDissolution =
			sKind === "air-suling" && tKind === "piala-gelas" && hasSolidKind(target, "terusi");
		return {
			kind: "pour_with_modal",
			sourceItemId: source.itemId,
			targetItemId: target.itemId,
			sourceName: source.name,
			targetName: target.name,
			maxTransferMl, defaultMl, isSulfateTest, completesDissolution,
		};
	}

	// 4) dissolve
	if (canDissolve(source, target)) {
		const completesDissolution =
			hasSolidKind(source, "terusi") &&
			tKind === "piala-gelas" &&
			hasLiquidKind(target, "air-suling");
		if (completesDissolution) {
			const solidSummary = (source.contents ?? [])
				.filter((c) => (c.weightGrams ?? 0) > 0)
				.map((c) => `${c.name} ${c.weightGrams}g`)
				.join(", ");
			return {
				kind: "dissolve_with_modal",
				sourceItemId: source.itemId,
				targetItemId: target.itemId,
				sourceName: source.name,
				targetName: target.name,
				solidSummary,
			};
		}
		return { kind: "dissolve_silent", sourceItemId: source.itemId, targetItemId: target.itemId };
	}

	// 5) generic combine fallthrough — dengan slowSend untuk process equipment
	const kinds = new Set([sKind, tKind]);
	if (kinds.has("hot-plate")) {
		const other = sKind === "hot-plate" ? target : source;
		const otherIsDriedCrucible =
			getItemKind(other) === "krus-porselen" && other.labMeta?.dried === true;
		return otherIsDriedCrucible
			? { kind: "combine_with_slow", itemIdA: source.itemId, itemIdB: target.itemId, label: PROCESS_LABELS.tekluChar, duration: PROCESS_DURATIONS.tekluChar }
			: { kind: "combine_with_slow", itemIdA: source.itemId, itemIdB: target.itemId, label: PROCESS_LABELS.hotPlate, duration: PROCESS_DURATIONS.hotPlate };
	}
	if (kinds.has("meker")) {
		return { kind: "combine_with_slow", itemIdA: source.itemId, itemIdB: target.itemId, label: PROCESS_LABELS.meker, duration: PROCESS_DURATIONS.meker };
	}
	if (kinds.has("desikator")) {
		return { kind: "combine_with_slow", itemIdA: source.itemId, itemIdB: target.itemId, label: PROCESS_LABELS.desikator, duration: PROCESS_DURATIONS.desikator };
	}
	return { kind: "combine_items", itemIdA: source.itemId, itemIdB: target.itemId };
}

// ── Custom collision detection ────────────────────────────────────────────
// Prefer specific item slot when pointer is inside one; otherwise fallback
// to pointer collision / closest center for the zone drops (hand, workspace).
const workbenchCollisionDetection: CollisionDetection = (args) => {
	const pointerCollisions = pointerWithin(args);
	const itemHit = pointerCollisions.find((c) => String(c.id).startsWith("drop-item-"));
	if (itemHit) return [itemHit];
	if (pointerCollisions.length > 0) return pointerCollisions;
	return closestCenter(args);
};

// ── Draggable card ────────────────────────────────────────────────────────

function DraggableCard({
	id,
	item,
	variant,
	onDetachFilter,
	onDetachReceiver,
}: {
	id: string;
	item: InventoryItem | HeldItem;
	variant: Slot;
	onDetachFilter?: () => void;
	onDetachReceiver?: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id,
		data: { item, source: variant, itemId: item.itemId },
	});
	const kind = getItemKind(item);
	const isFilterSetup = variant === "workspace" && kind === "corong-stand";
	const setupMeta = item.labMeta;
	const hasSetupFilter = Boolean(setupMeta?.setupFilterPaperAttached);
	const hasSetupReceiver = Boolean(setupMeta?.setupReceiverAttached);
	const setupResidueG = (item.contents ?? []).reduce(
		(s, c) => s + (c.weightGrams ?? 0),
		0,
	);
	const setupReceiverVolumeMl = (setupMeta?.setupReceiverContents ?? []).reduce(
		(s, c) => s + (c.volumeMl ?? 0),
		0,
	);

	const style = {
		transform: CSS.Translate.toString(transform),
		zIndex: isDragging ? 999 : undefined,
		opacity: isDragging ? 0.85 : 1,
	};

	const border = variant === "workspace" ? "border-neutral-200" : "border-amber-200";
	// Sedikit lebih kompak supaya 2 kolom muat di workspace sempit
	const size = variant === "workspace" ? "w-[116px] h-[108px]" : "w-[96px] h-[88px]";

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={`relative flex flex-col items-center justify-center rounded-xl border shadow-sm bg-white select-none touch-none ${border} ${size} ${
				isDragging ? "shadow-lg ring-2 ring-primary-400" : "cursor-grab active:cursor-grabbing"
			}`}
		>
			{isFilterSetup && (hasSetupFilter || hasSetupReceiver) && (
				<div className="absolute left-1 top-1 flex flex-col gap-1 pointer-events-none">
					{hasSetupReceiver && (
						<span className="rounded bg-sky-100 px-1 py-0.5 text-[8px] font-semibold text-sky-700">
							🧪 {setupReceiverVolumeMl > 0 ? `${setupReceiverVolumeMl}mL` : "kosong"}
						</span>
					)}
					{hasSetupFilter && (
						<span className="rounded bg-amber-100 px-1 py-0.5 text-[8px] font-semibold text-amber-700">
							📄 {setupResidueG > 0 ? `${setupResidueG}g` : "bersih"}
						</span>
					)}
				</div>
			)}
			{hasDissolvedContents(item) && (
				<span className="absolute right-1 top-1 rounded bg-emerald-100 px-1 py-0.5 text-[8px] font-semibold text-emerald-700">
					terlarut
				</span>
			)}
			<span className={variant === "workspace" ? "text-xl" : "text-lg"}>
				{ITEM_EMOJI[kind] ?? "📦"}
			</span>
			<span className={`mt-1 text-center leading-tight px-1 w-full text-[10px] whitespace-normal break-words ${variant === "workspace" ? "text-neutral-600" : "text-amber-700"}`}>
				{item.name}
			</span>
			{formatInfo(item) && (
				<span className={`mt-0.5 leading-tight text-center px-1 w-full text-[9px] whitespace-normal break-words ${variant === "workspace" ? "text-neutral-400" : "text-amber-500"}`}>
					{formatInfo(item)}
				</span>
			)}

			{/* Detach buttons untuk corong-stand setup */}
			{isFilterSetup && (hasSetupFilter || hasSetupReceiver) && (
				<div className="absolute bottom-1 left-1 right-1 flex gap-1">
					{hasSetupFilter && onDetachFilter && (
						<button
							type="button"
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDetachFilter(); }}
							className="rounded bg-amber-500 px-1 py-0.5 text-[8px] font-semibold text-white"
						>
							Lepas 📄
						</button>
					)}
					{hasSetupReceiver && onDetachReceiver && (
						<button
							type="button"
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDetachReceiver(); }}
							className="rounded bg-sky-600 px-1 py-0.5 text-[8px] font-semibold text-white"
						>
							Lepas 🧪
						</button>
					)}
				</div>
			)}
		</div>
	);
}

// ── Droppable wrapper for combine targets (each workspace item) ───────────

function DroppableItemSlot({
	item,
	children,
}: {
	item: InventoryItem;
	children: React.ReactNode;
}) {
	const { setNodeRef, isOver } = useDroppable({
		id: `drop-item-${item.itemId}`,
		data: { type: "workspace-item", itemId: item.itemId },
	});
	return (
		<div
			ref={setNodeRef}
			data-workbench-item-id={item.itemId}
			className={`rounded-xl transition-all ${isOver ? "ring-2 ring-primary-400 scale-105" : ""}`}
		>
			{children}
		</div>
	);
}

// ── Workspace & Hand zones ────────────────────────────────────────────────

function WorkspaceZone({
	isEmpty,
	highlight,
	children,
}: {
	isEmpty: boolean;
	highlight: boolean;
	children: React.ReactNode;
}) {
	const { setNodeRef } = useDroppable({ id: "drop-workspace", data: { type: "workspace" } });
	return (
		<div
			ref={setNodeRef}
			className={`workbench-workspace flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y rounded-2xl border-2 border-dashed transition-colors relative ${
				highlight ? "bg-primary-50/40 border-primary-200" : "bg-neutral-50 border-neutral-200"
			}`}
		>
			{isEmpty ? (
				<p className="absolute inset-0 flex items-center justify-center text-xs text-neutral-400 select-none px-3 text-center">
					Belum ada apa-apa di meja. Geser alat/bahan dari tangan.
				</p>
			) : (
				<div className="flex flex-wrap gap-2 p-3 content-start">{children}</div>
			)}
		</div>
	);
}

function HandZone({
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
			className={`workbench-hand shrink-0 flex flex-col items-center gap-2 w-[120px] p-2 rounded-2xl border-2 transition-colors touch-none ${dynamic}`}
		>
			<p className="text-[10px] uppercase tracking-wide font-semibold text-amber-600 mt-0.5">
				Tangan {holding.length}/2
			</p>
			{children}
		</div>
	);
}

// ── Main component ───────────────────────────────────────────────────────

interface WorkbenchSheetProps {
	objectId: string;
	items: InventoryItem[];
	holding: HeldItem[];
	onClose: () => void;
}

export function WorkbenchSheet({ objectId, items, holding, onClose }: WorkbenchSheetProps) {
	const [pourDraft, setPourDraft] = useState<{
		sourceItemId: string;
		targetItemId: string;
		sourceName: string;
		targetName: string;
		maxTransferMl: number;
		isSulfateTestPour: boolean;
		completesDissolution: boolean;
	} | null>(null);
	const [pourMl, setPourMl] = useState("");
	const [dissolveDraft, setDissolveDraft] = useState<{
		sourceItemId: string;
		targetItemId: string;
		sourceName: string;
		targetName: string;
		solidSummary: string;
	} | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const workspaceElRef = useRef<HTMLDivElement>(null);

	const workspaceItems = useMemo(
		() => items.filter((i) => i.quantity > 0),
		[items],
	);

	// Sensors: mouse instant-ish, touch press-and-hold (anti drag-vs-scroll)
	const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 6 } });
	const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } });
	const sensors = useSensors(mouseSensor, touchSensor);

	const executePair = useCallback(
		(action: PairAction) => {
			switch (action.kind) {
				case "use_held_on_item":
					gameClient.send({
						type: "use_held_on_item",
						objectId,
						heldItemId: action.heldItemId,
						targetItemId: action.targetItemId,
					});
					return;
				case "combine_items":
					gameClient.send({
						type: "combine_items",
						objectId,
						itemIdA: action.itemIdA,
						itemIdB: action.itemIdB,
					});
					return;
				case "combine_with_slow":
					slowSend(
						{ type: "combine_items", objectId, itemIdA: action.itemIdA, itemIdB: action.itemIdB },
						action.label,
						action.duration,
					);
					return;
				case "pour_with_modal":
					setPourDraft({
						sourceItemId: action.sourceItemId,
						targetItemId: action.targetItemId,
						sourceName: action.sourceName,
						targetName: action.targetName,
						maxTransferMl: action.maxTransferMl,
						isSulfateTestPour: action.isSulfateTest,
						completesDissolution: action.completesDissolution,
					});
					setPourMl(String(action.defaultMl));
					return;
				case "dissolve_silent":
					gameClient.send({
						type: "dissolve_item",
						objectId,
						sourceContainerItemId: action.sourceItemId,
						targetContainerItemId: action.targetItemId,
					});
					return;
				case "dissolve_with_modal":
					setDissolveDraft({
						sourceItemId: action.sourceItemId,
						targetItemId: action.targetItemId,
						sourceName: action.sourceName,
						targetName: action.targetName,
						solidSummary: action.solidSummary,
					});
					return;
			}
		},
		[objectId],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			setIsDragging(false);
			const dragItemId = event.active.data.current?.itemId as string | undefined;
			const source = event.active.data.current?.source as Slot | undefined;
			const overId = event.over ? String(event.over.id) : "";
			const overData = event.over?.data.current as
				| { type?: string; itemId?: string }
				| undefined;
			if (!dragItemId || !source || !overId) return;

			// 1) Drop on a specific workspace item → resolve pair
			if (overData?.type === "workspace-item" && overData.itemId) {
				const targetItem = workspaceItems.find((i) => i.itemId === overData.itemId);
				if (!targetItem) return;
				if (source === "hand") {
					const heldItem = holding.find((h) => h.itemId === dragItemId);
					if (!heldItem) return;
					const action = tryUseHeldOnItem(heldItem, targetItem);
					if (action.kind !== "none") {
						executePair(action);
					} else {
						// Fallthrough: drop-hand-onto-item juga sah sebagai "place"
						gameClient.send({ type: "place_item", objectId, itemId: dragItemId });
					}
					return;
				}
				// source === "workspace"
				const sourceItem = workspaceItems.find((i) => i.itemId === dragItemId);
				if (!sourceItem) return;
				const action = tryWorkspacePair(sourceItem, targetItem);
				if (action.kind !== "none") executePair(action);
				return;
			}

			// 2) Drop on hand zone (kosong atau slot kosong) → take
			if (overId === "drop-hand") {
				if (source === "workspace") {
					gameClient.send({ type: "take_item", objectId, itemId: dragItemId });
				}
				// hand → hand: no-op
				return;
			}

			// 3) Drop on workspace zone (area kosong) → place
			if (overId === "drop-workspace" || overData?.type === "workspace") {
				if (source === "hand") {
					gameClient.send({ type: "place_item", objectId, itemId: dragItemId });
				}
				// workspace → workspace area: no-op
				return;
			}
		},
		[objectId, workspaceItems, holding, executePair],
	);

	const handleDetachFilter = useCallback(
		(itemId: string) => {
			gameClient.send({
				type: "detach_setup_part",
				objectId,
				setupItemId: itemId,
				part: "filter",
			});
		},
		[objectId],
	);

	const handleDetachReceiver = useCallback(
		(itemId: string) => {
			gameClient.send({
				type: "detach_setup_part",
				objectId,
				setupItemId: itemId,
				part: "receiver",
			});
		},
		[objectId],
	);

	const handlePour = useCallback(() => {
		if (!pourDraft) return;
		const transferMl = parseFloat(pourMl);
		if (Number.isNaN(transferMl) || transferMl <= 0 || transferMl > pourDraft.maxTransferMl) {
			return;
		}
		gameClient.send({
			type: "pour_item",
			objectId,
			sourceItemId: pourDraft.sourceItemId,
			targetItemId: pourDraft.targetItemId,
			transferMl,
		});
		setPourDraft(null);
		setPourMl("");
	}, [objectId, pourDraft, pourMl]);

	const handleDissolveConfirm = useCallback(() => {
		if (!dissolveDraft) return;
		gameClient.send({
			type: "dissolve_item",
			objectId,
			sourceContainerItemId: dissolveDraft.sourceItemId,
			targetContainerItemId: dissolveDraft.targetItemId,
		});
		setDissolveDraft(null);
	}, [objectId, dissolveDraft]);

	const handCanPlace = holding.length === 1;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

			{/* Sheet */}
			<div className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none">
				<div
					className="workbench-sheet w-full max-w-lg bg-white rounded-t-3xl shadow-xl animate-slide-up flex min-h-0 flex-col pointer-events-auto"
					style={{ maxHeight: "85dvh" }}
				>
					{/* Handle */}
					<div className="flex justify-center pt-2 pb-2 shrink-0">
						<div
							className="w-12 h-1.5 rounded-full bg-neutral-300 cursor-pointer"
							onClick={onClose}
						/>
					</div>
					{/* Header */}
					<div className="px-4 pb-3 shrink-0">
						<h2 className="heading-1 text-neutral-800">Meja Kerja</h2>
						<p className="body-4 text-neutral-500 mt-0.5">
							Geser alat/bahan. Drag ke samping (tangan) atau ke item lain (gabung/tuang/larut).
						</p>
					</div>

					<DndContext
						sensors={sensors}
						collisionDetection={workbenchCollisionDetection}
						onDragStart={() => setIsDragging(true)}
						onDragCancel={() => setIsDragging(false)}
						onDragEnd={handleDragEnd}
						autoScroll={{ threshold: { x: 0, y: 0.15 }, acceleration: 8 }}
					>
						<div className="flex flex-1 min-h-0 gap-2 px-3 pb-3">
							{/* LEFT: Workspace (scroll vertikal) */}
							<div className="flex-1 min-w-0 flex flex-col" ref={workspaceElRef}>
								<p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-1 px-1">
									Area kerja
								</p>
								<WorkspaceZone
									isEmpty={workspaceItems.length === 0}
									highlight={isDragging}
								>
									{workspaceItems.map((item) => (
										<DroppableItemSlot key={item.itemId} item={item}>
											<DraggableCard
												id={`workspace-${item.itemId}`}
												item={item}
												variant="workspace"
												onDetachFilter={() => handleDetachFilter(item.itemId)}
												onDetachReceiver={() => handleDetachReceiver(item.itemId)}
											/>
										</DroppableItemSlot>
									))}
								</WorkspaceZone>
							</div>

							{/* RIGHT: Hand (fixed, no scroll, drop sideways = no axis conflict) */}
							<HandZone holding={holding} highlight={isDragging}>
								{holding.length === 0 ? (
									<p className="m-auto text-[10px] text-amber-500 italic select-none text-center px-1">
										Tangan kosong
									</p>
								) : (
									<>
										{holding.map((item, idx) => (
											<DraggableCard
												key={`${item.itemId}-${idx}`}
												id={`hand-${item.itemId}-${idx}`}
												item={item}
												variant="hand"
											/>
										))}
										{handCanPlace && (
											<div className="w-[96px] h-[88px] rounded-xl border-2 border-dashed border-amber-200 flex items-center justify-center text-amber-300 text-xl shrink-0 select-none">
												+
											</div>
										)}
									</>
								)}
							</HandZone>
						</div>
					</DndContext>

					<div className="px-4 pb-[calc(env(safe-area-inset-bottom,0)+10px)] shrink-0">
						<p className="text-[10px] text-neutral-400 text-center leading-snug">
							Untuk buang isi wadah, bawa ke objek <span className="font-semibold text-rose-500">🗑️ Pembuangan</span>.
						</p>
					</div>
				</div>
			</div>

			{/* Pour modal */}
			{pourDraft && (
				<>
					<div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => { setPourDraft(null); setPourMl(""); }} />
					<div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none px-4">
						<div className="pointer-events-auto bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
							<h3 className="heading-1 text-neutral-800">
								{pourDraft.completesDissolution ? "Pelarutan" : "Tuang"}
							</h3>
							<p className="body-4 text-neutral-500 mt-1">
								Dari <span className="font-semibold text-neutral-800">{pourDraft.sourceName}</span> ke <span className="font-semibold text-neutral-800">{pourDraft.targetName}</span>
							</p>
							<label className="mt-4 block">
								<span className="text-xs text-neutral-600">Volume (mL) — maks {pourDraft.maxTransferMl}</span>
								<input
									type="number"
									step="0.1"
									min="0.1"
									max={pourDraft.maxTransferMl}
									value={pourMl}
									onChange={(e) => setPourMl(e.target.value)}
									onKeyDown={(e) => e.stopPropagation()}
									onKeyUp={(e) => e.stopPropagation()}
									className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-neutral-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
								/>
							</label>
							{pourDraft.isSulfateTestPour && (
								<p className="mt-2 text-[11px] text-amber-700">
									Uji pengotor sulfat: tuang maksimal 1 mL.
								</p>
							)}
							<div className="mt-5 flex justify-end gap-2">
								<button
									type="button"
									onClick={() => { setPourDraft(null); setPourMl(""); }}
									className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
								>
									Batal
								</button>
								<button
									type="button"
									onClick={handlePour}
									className="rounded-xl bg-primary-500 hover:bg-primary-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
								>
									{pourDraft.completesDissolution ? "Larutkan" : "Tuang"}
								</button>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Dissolve confirmation modal */}
			{dissolveDraft && (
				<>
					<div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setDissolveDraft(null)} />
					<div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none px-4">
						<div className="pointer-events-auto bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
							<h3 className="heading-1 text-neutral-800">Larutkan</h3>
							<p className="body-4 text-neutral-500 mt-1">
								Pindahkan <span className="font-semibold text-neutral-800">{dissolveDraft.solidSummary || dissolveDraft.sourceName}</span> dari <span className="font-semibold text-neutral-800">{dissolveDraft.sourceName}</span> ke <span className="font-semibold text-neutral-800">{dissolveDraft.targetName}</span>?
							</p>
							<div className="mt-5 flex justify-end gap-2">
								<button
									type="button"
									onClick={() => setDissolveDraft(null)}
									className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
								>
									Batal
								</button>
								<button
									type="button"
									onClick={handleDissolveConfirm}
									className="rounded-xl bg-primary-500 hover:bg-primary-600 px-4 py-2 text-sm font-semibold text-white active:scale-95"
								>
									Larutkan
								</button>
							</div>
						</div>
					</div>
				</>
			)}
		</>
	);
}
