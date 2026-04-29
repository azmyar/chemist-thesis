import type { HeldItem, InventoryItem } from "@/lib/protocol";

export function formatInfo(item: InventoryItem | HeldItem): string {
	const parts: string[] = [];
	if ("quantity" in item && item.quantity > 1) parts.push(`x${item.quantity}`);
	if (item.weightGrams !== undefined && item.weightGrams > 0) parts.push(`${item.weightGrams}g`);
	if (item.volumeMl !== undefined && item.volumeMl > 0) parts.push(`${item.volumeMl}mL`);
	if (item.contents && item.contents.length > 0) {
		const inner = item.contents
			.map((c) => {
				const base = c.weightGrams
					? `${c.name} ${c.weightGrams}g`
					: c.volumeMl
						? `${c.name} ${c.volumeMl}mL`
						: c.name;
				return c.dissolved ? `${base} (terlarut)` : base;
			})
			.join(", ");
		parts.push(inner);
	}
	if (item.labMeta?.acidified) parts.push("diasamkan");
	if (item.labMeta?.boiled) parts.push("didihkan");
	if (item.labMeta?.precipitated) parts.push("mengendap");
	if (item.labMeta?.filtered) parts.push("tersaring");
	if (item.labMeta?.washed) parts.push("dicuci");
	if (item.labMeta?.dried) parts.push("kering");
	if (item.labMeta?.calcined) parts.push("dipijar");
	if (item.labMeta?.cooled) parts.push("didinginkan");
	return parts.join(" · ");
}

export function hasDissolvedContents(item: InventoryItem | HeldItem): boolean {
	return (item.contents ?? []).some((c) => c.dissolved);
}

export function getContainerUsedVolume(item: InventoryItem | HeldItem): number {
	return (item.contents ?? []).reduce((sum, c) => sum + (c.volumeMl ?? 0), 0);
}

export function canPour(source: InventoryItem | undefined, target: InventoryItem | undefined): boolean {
	if (!source || !target) return false;
	if (source.category !== "bahan") return false;
	if (source.volumeMl === undefined || source.volumeMl <= 0) return false;
	if (target.category !== "alat") return false;
	if (target.maxVolumeMl === undefined) return false;
	const remaining = target.maxVolumeMl - getContainerUsedVolume(target);
	return remaining > 0;
}

export function canDissolve(source: InventoryItem | undefined, target: InventoryItem | undefined): boolean {
	if (!source || !target) return false;
	if (source.category !== "alat" || target.category !== "alat") return false;
	const sourceHasSolid = (source.contents ?? []).some((c) => (c.weightGrams ?? 0) > 0);
	if (!sourceHasSolid) return false;
	return target.maxVolumeMl !== undefined;
}
