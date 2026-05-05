"use client";

import { useCallback, useRef, useState } from "react";
import {
	DndContext,
	useDraggable,
	useDroppable,
	PointerSensor,
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

// ── Helpers ──

const workbenchCollisionDetection: CollisionDetection = (args) => {
	const pointerCollisions = pointerWithin(args);
	const itemCollision = pointerCollisions.find((collision) =>
		String(collision.id).startsWith("drop-item-"),
	);
	if (itemCollision) return [itemCollision];
	if (pointerCollisions.length > 0) return pointerCollisions;
	return closestCenter(args);
};

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

function canDiscardItemContents(item: InventoryItem | HeldItem): boolean {
	if (item.category !== "alat") return false;
	const kind = getItemKind(item);
	return item.maxVolumeMl !== undefined || kind === "corong-stand";
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

// ── Draggable card — element itself moves (no DragOverlay) ──

function DraggableCard({ id, item, variant, onDetachFilter, onDetachReceiver }: {
	id: string;
	item: InventoryItem | HeldItem;
	variant: "workspace" | "hand";
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
	const setupResidueG = (item.contents ?? []).reduce((sum, c) => sum + (c.weightGrams ?? 0), 0);
	const setupReceiverVolumeMl = (setupMeta?.setupReceiverContents ?? []).reduce(
		(sum, c) => sum + (c.volumeMl ?? 0),
		0,
	);

	const style = {
		transform: CSS.Translate.toString(transform),
		zIndex: isDragging ? 999 : undefined,
		opacity: isDragging ? 0.85 : 1,
	};

	const border = variant === "workspace" ? "border-neutral-200" : "border-amber-200";
	const size = variant === "workspace" ? "w-[128px] h-[120px]" : "w-[112px] h-[96px]";

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={`relative flex flex-col items-center justify-center rounded-xl border shadow-sm bg-white select-none touch-none ${border} ${size} ${isDragging ? "shadow-lg ring-2 ring-blue-400" : "cursor-grab active:cursor-grabbing"}`}
		>
			{isFilterSetup && (hasSetupFilter || hasSetupReceiver) && (
				<div className="absolute left-1 top-1 flex flex-col gap-1 pointer-events-none">
					{hasSetupReceiver && (
						<span className="rounded bg-sky-100 px-1 py-0.5 text-[8px] font-semibold text-sky-700">
							🧪 penampung {setupReceiverVolumeMl > 0 ? `${setupReceiverVolumeMl}mL` : "kosong"}
						</span>
					)}
					{hasSetupFilter && (
						<span className="rounded bg-amber-100 px-1 py-0.5 text-[8px] font-semibold text-amber-700">
							📄 saring {setupResidueG > 0 ? `${setupResidueG}g` : "bersih"}
						</span>
					)}
				</div>
			)}

			{hasDissolvedContents(item) && (
				<span className="absolute right-1 top-1 rounded bg-emerald-100 px-1 py-0.5 text-[8px] font-semibold text-emerald-700">
					terlarut
				</span>
			)}
			<span className={variant === "workspace" ? "text-2xl" : "text-xl"}>
				{ITEM_EMOJI[kind] ?? "📦"}
			</span>
			<span className={`mt-1 text-center leading-tight px-1 w-full text-[10px] whitespace-normal break-words ${variant === "workspace" ? "text-neutral-600" : "text-amber-700"}`}>
				{item.name}
			</span>
			{formatInfo(item) && (
				<span className={`mt-1 leading-tight text-center px-1 w-full text-[9px] whitespace-normal break-words ${variant === "workspace" ? "text-neutral-400" : "text-amber-500"}`}>
					{formatInfo(item)}
				</span>
			)}

			{isFilterSetup && variant === "workspace" && (hasSetupFilter || hasSetupReceiver) && (
				<div className="absolute bottom-1 left-1 right-1 flex gap-1">
					{hasSetupFilter && onDetachFilter && (
						<button
							type="button"
							onPointerDown={(e) => {
								e.stopPropagation();
							}}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onDetachFilter();
							}}
							className="rounded bg-amber-500 px-1 py-0.5 text-[8px] font-semibold text-white"
						>
							Lepas 📄
						</button>
					)}
					{hasSetupReceiver && onDetachReceiver && (
						<button
							type="button"
							onPointerDown={(e) => {
								e.stopPropagation();
							}}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onDetachReceiver();
							}}
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

// ── Droppable wrapper for combine targets ──

function DroppableSlot({ item, children }: { item: InventoryItem; children: React.ReactNode }) {
	const { setNodeRef, isOver } = useDroppable({
		id: `drop-item-${item.itemId}`,
		data: { type: "workspace-item", itemId: item.itemId },
	});

	return (
		<div
			ref={setNodeRef}
			data-workbench-item-id={item.itemId}
			className={`rounded-xl transition-all ${isOver ? "ring-2 ring-blue-400 scale-105" : ""}`}
		>
			{children}
		</div>
	);
}

function findWorkspaceItemAtPoint(x: number, y: number, excludeItemId?: string): string | undefined {
	for (const el of document.elementsFromPoint(x, y)) {
		const holder = el instanceof HTMLElement ? el.closest<HTMLElement>("[data-workbench-item-id]") : null;
		const itemId = holder?.dataset.workbenchItemId;
		if (itemId && itemId !== excludeItemId) return itemId;
	}
	return undefined;
}

// ── Main ──

interface WorkbenchSheetProps {
	objectId: string;
	items: InventoryItem[];
	holding: HeldItem[];
	onClose: () => void;
}

export function WorkbenchSheet({ objectId, items, holding, onClose }: WorkbenchSheetProps) {
	const pointerSensor = useSensor(PointerSensor, {
		activationConstraint: { distance: 6 },
	});
	const sensors = useSensors(pointerSensor);
	const workspaceElRef = useRef<HTMLDivElement | null>(null);
	const handElRef = useRef<HTMLDivElement | null>(null);
	const disposalElRef = useRef<HTMLDivElement | null>(null);
	const [pourDraft, setPourDraft] = useState<{
		sourceItemId: string;
		targetItemId: string;
		sourceName: string;
		targetName: string;
		maxTransferMl: number;
		completesDissolution?: boolean;
	} | null>(null);
	const [pourMl, setPourMl] = useState("");
	const [dissolveDraft, setDissolveDraft] = useState<{
		sourceContainerItemId: string;
		targetContainerItemId: string;
		sourceName: string;
		targetName: string;
		solidSummary: string;
	} | null>(null);

	const { setNodeRef: setWorkspaceRef, isOver: isOverWorkspace } = useDroppable({ id: "drop-workspace", data: { type: "workspace" } });
	const { setNodeRef: setHandRef, isOver: isOverHand } = useDroppable({ id: "drop-hand", data: { type: "hand" } });
	const { setNodeRef: setDisposalRef, isOver: isOverDisposal } = useDroppable({ id: "drop-disposal", data: { type: "disposal" } });

	const setWorkspaceNodeRef = useCallback(
		(node: HTMLDivElement | null) => {
			workspaceElRef.current = node;
			setWorkspaceRef(node);
		},
		[setWorkspaceRef],
	);

	const setHandNodeRef = useCallback(
		(node: HTMLDivElement | null) => {
			handElRef.current = node;
			setHandRef(node);
		},
		[setHandRef],
	);

	const setDisposalNodeRef = useCallback(
		(node: HTMLDivElement | null) => {
			disposalElRef.current = node;
			setDisposalRef(node);
		},
		[setDisposalRef],
	);

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;

		const activeId = String(active.id);
		const overId = over ? String(over.id) : "";

		const source = (active.data.current?.source as string | undefined)
			?? (activeId.startsWith("hand-") ? "hand" : activeId.startsWith("ws-") ? "workspace" : undefined);

		const dragItemId = (active.data.current?.itemId as string | undefined)
			?? (activeId.startsWith("hand-") ? activeId.slice("hand-".length).replace(/-\d+$/, "")
				: activeId.startsWith("ws-") ? activeId.slice("ws-".length)
				: undefined);

		let overType = (over?.data.current?.type as string | undefined)
			?? (overId === "drop-workspace" ? "workspace"
				: overId === "drop-hand" ? "hand"
				: overId === "drop-disposal" ? "disposal"
				: overId.startsWith("drop-item-") ? "workspace-item"
				: undefined);

		let overItemId = (over?.data.current?.itemId as string | undefined)
			?? (overId.startsWith("drop-item-") ? overId.slice("drop-item-".length) : undefined);

		const translated = active.rect.current.translated ?? active.rect.current.initial;
		let inferredZone: "workspace" | "hand" | "disposal" | undefined;
		if (translated) {
			const centerX = translated.left + translated.width / 2;
			const centerY = translated.top + translated.height / 2;
			const pointedItemId = findWorkspaceItemAtPoint(centerX, centerY, dragItemId);
			if (pointedItemId) {
				overItemId = pointedItemId;
				overType = "workspace-item";
			}

			const inRect = (el: HTMLDivElement | null) => {
				if (!el) return false;
				const r = el.getBoundingClientRect();
				return centerX >= r.left && centerX <= r.right && centerY >= r.top && centerY <= r.bottom;
			};

			if (inRect(disposalElRef.current)) inferredZone = "disposal";
			else if (inRect(handElRef.current)) inferredZone = "hand";
			else if (inRect(workspaceElRef.current)) inferredZone = "workspace";
		}

		// Prioritize geometric zone when available to avoid false targets from closest-center.
		if (inferredZone === "disposal") {
			overType = "disposal";
		} else if (inferredZone === "hand") {
			overType = "hand";
		} else if (!overType && inferredZone === "workspace") {
			overType = "workspace";
		}

		if (!source || !dragItemId || !overType) return;

		if (overType === "disposal") {
			if (source === "workspace") {
				const sourceItem = items.find((i) => i.itemId === dragItemId && i.quantity > 0);
				if (!sourceItem || !canDiscardItemContents(sourceItem)) return;
				gameClient.send({ type: "discard_object_contents", objectId, itemId: dragItemId });
				return;
			}

			if (source === "hand") {
				const heldItem = holding.find((h) => h.itemId === dragItemId);
				if (!heldItem || !canDiscardItemContents(heldItem)) return;
				gameClient.send({ type: "discard_held_contents", itemId: dragItemId });
				return;
			}
		}

		if (source === "hand" && overType === "workspace-item" && overItemId) {
			const heldItem = holding.find((h) => h.itemId === dragItemId);
			const targetItem = items.find((i) => i.itemId === overItemId && i.quantity > 0);
			const heldKind = heldItem ? getItemKind(heldItem) : "";
			const canUseHeldOnTarget = Boolean(
				heldItem &&
					targetItem &&
					targetItem.category === "alat" &&
					targetItem.maxVolumeMl !== undefined &&
					(
						(
							heldItem.category === "bahan" &&
							(heldItem.volumeMl ?? 0) > 0 &&
							(heldKind === "hcl" || heldKind === "bacl2") &&
							getItemKind(targetItem) === "tabung-reaksi"
						) ||
						heldKind === "kertas-lakmus"
					),
			);

			if (canUseHeldOnTarget) {
				gameClient.send({
					type: "use_held_on_item",
					objectId,
					heldItemId: dragItemId,
					targetItemId: overItemId,
				});
				return;
			}

			gameClient.send({ type: "place_item", objectId, itemId: dragItemId });
		} else if (source === "hand" && overType === "workspace") {
			gameClient.send({ type: "place_item", objectId, itemId: dragItemId });
		} else if (source === "workspace" && overType === "hand") {
			gameClient.send({ type: "take_item", objectId, itemId: dragItemId });
		} else if (source === "workspace" && overType === "workspace-item" && overItemId && overItemId !== dragItemId) {
			const sourceItem = items.find((i) => i.itemId === dragItemId && i.quantity > 0);
			const targetItem = items.find((i) => i.itemId === overItemId && i.quantity > 0);
			const sourceKind = sourceItem ? getItemKind(sourceItem) : "";
			const targetKind = targetItem ? getItemKind(targetItem) : "";
			const isFilterToWatchGlass =
				(sourceKind === "kertas-saring" && targetKind === "kaca-arloji") ||
				(sourceKind === "kaca-arloji" && targetKind === "kertas-saring");
			const isResidueToCrucible =
				(sourceKind === "krus-porselen" && (targetKind === "kaca-arloji" || targetKind === "kertas-saring")) ||
				(targetKind === "krus-porselen" && (sourceKind === "kaca-arloji" || sourceKind === "kertas-saring"));

			if (isFilterToWatchGlass || isResidueToCrucible) {
				gameClient.send({
					type: "combine_items",
					objectId,
					itemIdA: dragItemId,
					itemIdB: overItemId,
				});
				return;
			}

			if (canPour(sourceItem, targetItem)) {
				const remainingCapacity = Math.max(
					0,
					(targetItem!.maxVolumeMl ?? 0) - getContainerUsedVolume(targetItem!),
				);
				const isSulfateTestPour =
					(getItemKind(sourceItem!) === "hcl" || getItemKind(sourceItem!) === "bacl2") &&
					getItemKind(targetItem!) === "tabung-reaksi" &&
					(Boolean(targetItem!.labMeta?.fromFiltrate) || hasLiquidKind(targetItem, "filtrat-cucian"));
				const maxTransferMl = Math.min(sourceItem!.volumeMl ?? 0, remainingCapacity, isSulfateTestPour ? 1 : Infinity);
				if (maxTransferMl > 0) {
					const completesDissolution =
						getItemKind(sourceItem!) === "air-suling" &&
						getItemKind(targetItem!) === "piala-gelas" &&
						hasSolidKind(targetItem, "terusi");
					setPourDraft({
						sourceItemId: sourceItem!.itemId,
						targetItemId: targetItem!.itemId,
						sourceName: sourceItem!.name,
						targetName: targetItem!.name,
						maxTransferMl,
						completesDissolution,
					});
					setPourMl(String(isSulfateTestPour ? maxTransferMl : Math.min(10, Math.max(0.1, maxTransferMl))));
					return;
				}
			}

			if (canDissolve(sourceItem, targetItem)) {
				const completesDissolution =
					hasSolidKind(sourceItem, "terusi") &&
					getItemKind(targetItem!) === "piala-gelas" &&
					hasLiquidKind(targetItem, "air-suling");
				if (!completesDissolution) {
					gameClient.send({
						type: "dissolve_item",
						objectId,
						sourceContainerItemId: sourceItem!.itemId,
						targetContainerItemId: targetItem!.itemId,
					});
					return;
				}

				const solidSummary = (sourceItem?.contents ?? [])
					.filter((c) => (c.weightGrams ?? 0) > 0)
					.map((c) => `${c.name} ${(c.weightGrams ?? 0)}g`)
					.join(", ");

				setDissolveDraft({
					sourceContainerItemId: sourceItem!.itemId,
					targetContainerItemId: targetItem!.itemId,
					sourceName: sourceItem!.name,
					targetName: targetItem!.name,
					solidSummary,
				});
				return;
			}

			const combineMsg = {
				type: "combine_items" as const,
				objectId,
				itemIdA: dragItemId,
				itemIdB: overItemId,
			};
			const kinds = [kindFromItemId(dragItemId), kindFromItemId(overItemId)];
			if (kinds.includes("hot-plate")) {
				const otherItemId = kindFromItemId(dragItemId) === "hot-plate" ? overItemId : dragItemId;
				const otherItem = items.find((i) => i.itemId === otherItemId && i.quantity > 0);
				if (otherItem && getItemKind(otherItem) === "krus-porselen" && otherItem.labMeta?.dried) {
					slowSend(combineMsg, PROCESS_LABELS.tekluChar, PROCESS_DURATIONS.tekluChar);
				} else {
					slowSend(combineMsg, PROCESS_LABELS.hotPlate, PROCESS_DURATIONS.hotPlate);
				}
			} else if (kinds.includes("meker")) {
				slowSend(combineMsg, PROCESS_LABELS.meker, PROCESS_DURATIONS.meker);
			} else if (kinds.includes("desikator")) {
				slowSend(combineMsg, PROCESS_LABELS.desikator, PROCESS_DURATIONS.desikator);
			} else {
				gameClient.send(combineMsg);
			}
		}
	}, [holding, items, objectId]);

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

	const handleDissolve = useCallback(() => {
		if (!dissolveDraft) return;

		gameClient.send({
			type: "dissolve_item",
			objectId,
			sourceContainerItemId: dissolveDraft.sourceContainerItemId,
			targetContainerItemId: dissolveDraft.targetContainerItemId,
		});

		setDissolveDraft(null);
	}, [dissolveDraft, objectId]);

	const workspaceItems = items.filter((i) => i.quantity > 0);

	return (
		<>
			<div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

			<DndContext sensors={sensors} collisionDetection={workbenchCollisionDetection} onDragEnd={handleDragEnd} autoScroll={false}>
				<div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center" style={{ touchAction: "none" }}>
					<div
						className="workbench-sheet w-full max-w-lg bg-white rounded-t-3xl shadow-xl animate-slide-up flex min-h-0 flex-col"
						style={{ height: "min(70dvh, 640px)", maxHeight: "calc(100dvh - 2rem)" }}
					>
						{/* Handle */}
						<div className="flex justify-center pt-3 pb-1 shrink-0">
							<div className="w-12 h-1.5 rounded-full bg-neutral-300 cursor-pointer" onClick={onClose} />
						</div>

						{/* Header */}
						<div className="px-5 pb-2 shrink-0">
							<h2 className="text-lg font-semibold text-neutral-800">Meja Kerja</h2>
							<p className="text-xs text-neutral-400">Drag item untuk bikin setup: 📄 ke corong, lalu 🧪 piala penampung</p>
						</div>

						{/* Workspace */}
						<div
							ref={setWorkspaceNodeRef}
							className={`workbench-workspace mx-4 mb-2 min-h-[160px] flex-1 overflow-y-auto rounded-2xl border-2 border-dashed relative select-none transition-colors ${isOverWorkspace ? "bg-blue-50 border-blue-300" : "bg-neutral-50 border-neutral-200"}`}
						>
							{workspaceItems.length === 0 && (
								<p className="absolute inset-0 flex items-center justify-center text-sm text-neutral-300">
									Drag item dari tangan ke sini
								</p>
							)}
							<div className="p-3 flex flex-wrap gap-3 content-start">
								{workspaceItems.map((item) => (
									<DroppableSlot key={item.itemId} item={item}>
										<DraggableCard
											id={`ws-${item.itemId}`}
											item={item}
											variant="workspace"
											onDetachFilter={
												getItemKind(item) === "corong-stand" && item.labMeta?.setupFilterPaperAttached
													? () =>
														gameClient.send({
															type: "detach_setup_part",
															objectId,
															setupItemId: item.itemId,
															part: "filter",
														})
													: undefined
											}
											onDetachReceiver={
												getItemKind(item) === "corong-stand" && item.labMeta?.setupReceiverAttached
													? () =>
														gameClient.send({
															type: "detach_setup_part",
															objectId,
															setupItemId: item.itemId,
															part: "receiver",
														})
													: undefined
											}
										/>
									</DroppableSlot>
								))}
							</div>
						</div>

{/* Hand tray */}
						<div
							ref={setHandNodeRef}
							className={`workbench-hand mx-4 mb-4 p-3 rounded-2xl border-2 flex shrink-0 gap-2 min-h-[88px] select-none overflow-x-auto transition-colors ${isOverHand ? "bg-amber-100 border-amber-400" : "bg-amber-50 border-amber-200"}`}
						>
							<div className="text-xs text-amber-400 self-center mr-1 shrink-0">🤲</div>
							{holding.length === 0 && <p className="text-xs text-amber-300 self-center">Tangan kosong</p>}
							{holding.map((item, index) => (
								<DraggableCard
									key={`${item.itemId}-${index}`}
									id={`hand-${item.itemId}-${index}`}
									item={item}
									variant="hand"
								/>
							))}
							{holding.length === 1 && (
								<div className="w-[112px] h-[96px] rounded-xl border-2 border-dashed border-amber-200 flex items-center justify-center shrink-0">
									<span className="text-[10px] text-amber-300">slot</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</DndContext>

			{pourDraft && (
				<div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35">
					<div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl">
						<h3 className="text-base font-semibold text-neutral-800">
							{pourDraft.completesDissolution ? "Pelarutan" : "Penuangan Larutan"}
						</h3>
						{pourDraft.completesDissolution ? (
							<p className="mt-1 text-sm text-neutral-600">
								Tambahkan <span className="font-semibold">{pourDraft.sourceName}</span> ke{" "}
								<span className="font-semibold">{pourDraft.targetName}</span> untuk melarutkan terusi?
							</p>
						) : (
							<p className="mt-1 text-sm text-neutral-600">
								Tuang <span className="font-semibold">{pourDraft.sourceName}</span> ke <span className="font-semibold">{pourDraft.targetName}</span>
							</p>
						)}
						<p className="mt-1 text-xs text-neutral-500">Maks: {pourDraft.maxTransferMl} mL</p>

						<div className="mt-4 flex gap-2">
							<input
								type="number"
								step="0.1"
								min="0"
								max={pourDraft.maxTransferMl}
								value={pourMl}
								onChange={(e) => setPourMl(e.target.value)}
								placeholder="mL"
								className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
							/>
							<button
								onClick={handlePour}
								className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
							>
								{pourDraft.completesDissolution ? "Larutkan" : "Tuang"}
							</button>
						</div>

						<button
							onClick={() => {
								setPourDraft(null);
								setPourMl("");
							}}
							className="mt-3 text-xs text-neutral-500 hover:text-neutral-700"
						>
							Batal
						</button>
					</div>
				</div>
			)}

			{dissolveDraft && (
				<div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35">
					<div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl">
						<h3 className="text-base font-semibold text-neutral-800">Pelarutan</h3>
						<p className="mt-1 text-sm text-neutral-600">
							Larutkan padatan dari <span className="font-semibold">{dissolveDraft.sourceName}</span> ke <span className="font-semibold">{dissolveDraft.targetName}</span>?
						</p>
						<p className="mt-1 text-xs text-neutral-500">{dissolveDraft.solidSummary}</p>

						<div className="mt-4 flex gap-2">
							<button
								onClick={handleDissolve}
								className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
							>
								Larutkan
							</button>
							<button
								onClick={() => setDissolveDraft(null)}
								className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
							>
								Batal
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
