import { z } from "zod";
// ── Direction ─────────────────────────────────────
export const directionSchema = z.enum(["up", "down", "left", "right"]);
// ── Item Categories & Measurement ─────────────────
export const itemCategorySchema = z.enum(["alat", "bahan"]);
/** What's been transferred into a container (e.g., weighed solid, poured liquid) */
export const containerContentSchema = z.object({
    itemId: z.string(),
    name: z.string(),
    weightGrams: z.number().optional(),
    volumeMl: z.number().optional(),
    dissolved: z.boolean().optional(),
});
export const labContainerMetaSchema = z.object({
    sampleTerusiG: z.number().optional(),
    acidified: z.boolean().optional(),
    boiled: z.boolean().optional(),
    precipitated: z.boolean().optional(),
    stirred: z.boolean().optional(),
    precipitationChecked: z.boolean().optional(),
    filtered: z.boolean().optional(),
    washed: z.boolean().optional(),
    fromFiltrate: z.boolean().optional(),
    sulfateTestHclAdded: z.boolean().optional(),
    sulfateTestBaCl2Added: z.boolean().optional(),
    baseTested: z.boolean().optional(),
    dried: z.boolean().optional(),
    calcined: z.boolean().optional(),
    cooled: z.boolean().optional(),
    cuoMassG: z.number().optional(),
    lastRecordedMassG: z.number().optional(),
    reheatedAfterWeigh: z.boolean().optional(),
});
// ── Inventory Items ───────────────────────────────
export const inventoryItemSchema = z.object({
    itemId: z.string(),
    name: z.string(),
    category: itemCategorySchema,
    quantity: z.number().int().min(0),
    // Bahan properties (solids have weightGrams, liquids have volumeMl)
    weightGrams: z.number().optional(),
    volumeMl: z.number().optional(),
    // Alat container properties
    maxVolumeMl: z.number().optional(),
    contents: z.array(containerContentSchema).optional(),
    labMeta: labContainerMetaSchema.optional(),
});
// ── Held Item (what a player carries) ─────────────
export const heldItemSchema = z.object({
    itemId: z.string(),
    name: z.string(),
    category: itemCategorySchema,
    // Bahan measurement state
    weightGrams: z.number().optional(),
    volumeMl: z.number().optional(),
    // Container state (alat)
    maxVolumeMl: z.number().optional(),
    contents: z.array(containerContentSchema).optional(),
    labMeta: labContainerMetaSchema.optional(),
});
// ── Level / Milestone ────────────────────────────
export const levelMilestoneSchema = z.object({
    step: z.number().int().min(1),
    title: z.string(),
    completed: z.boolean(),
    completedAt: z.number().optional(),
    detail: z.string().optional(),
});
export const levelStateSchema = z.object({
    levelId: z.string(),
    title: z.string(),
    xp: z.number().int().min(0),
    finished: z.boolean(),
    milestones: z.array(levelMilestoneSchema).length(14),
    startedAt: z.number(),
    updatedAt: z.number(),
    lastEvent: z.string().optional(),
});
// ── Player State ──────────────────────────────────
export const playerStateSchema = z.object({
    id: z.string(),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    direction: directionSchema,
    vx: z.number(),
    vy: z.number(),
    holding: z.array(heldItemSchema).max(2),
});
// ── Game Object State ─────────────────────────────
export const gameObjectTypeSchema = z.enum([
    "workbench",
    "storage",
    "reagent_table",
    "timbangan",
]);
export const gameObjectStateSchema = z.object({
    id: z.string(),
    objectType: gameObjectTypeSchema,
    items: z.array(inventoryItemSchema),
});
// ── Constraint Rules (placeholder for future) ─────
// TODO: Add constraint rules for validating which items can go where
// e.g., "kaca-arloji can only hold solids", "piala-gelas only for liquids"
// For now, all transfers are unconstrained.
// ── Client → Server Messages ──────────────────────
export const clientMoveSchema = z.object({
    type: z.literal("move"),
    x: z.number(),
    y: z.number(),
    direction: directionSchema,
    vx: z.number(),
    vy: z.number(),
});
export const clientStopSchema = z.object({
    type: z.literal("stop"),
    x: z.number(),
    y: z.number(),
    direction: directionSchema,
});
export const clientChatSchema = z.object({
    type: z.literal("chat"),
    text: z.string().min(1).max(200),
});
export const clientTakeItemSchema = z.object({
    type: z.literal("take_item"),
    objectId: z.string(),
    itemId: z.string(),
});
export const clientPlaceItemSchema = z.object({
    type: z.literal("place_item"),
    objectId: z.string(),
    itemId: z.string(),
});
export const clientWeighItemSchema = z.object({
    type: z.literal("weigh_item"),
    transferGrams: z.number().positive(),
});
export const clientPourItemSchema = z.object({
    type: z.literal("pour_item"),
    objectId: z.string(),
    sourceItemId: z.string(),
    targetItemId: z.string(),
    transferMl: z.number().positive(),
});
export const clientDissolveItemSchema = z.object({
    type: z.literal("dissolve_item"),
    objectId: z.string(),
    sourceContainerItemId: z.string(),
    targetContainerItemId: z.string(),
});
export const clientCombineItemsSchema = z.object({
    type: z.literal("combine_items"),
    objectId: z.string(),
    itemIdA: z.string(),
    itemIdB: z.string(),
});
export const clientRecordMassSchema = z.object({
    type: z.literal("record_mass"),
    containerItemId: z.string(),
    measuredMassG: z.number().positive(),
});
export const clientMessageSchema = z.discriminatedUnion("type", [
    clientMoveSchema,
    clientStopSchema,
    clientChatSchema,
    clientTakeItemSchema,
    clientPlaceItemSchema,
    clientWeighItemSchema,
    clientPourItemSchema,
    clientDissolveItemSchema,
    clientCombineItemsSchema,
    clientRecordMassSchema,
]);
// ── Room Config ───────────────────────────────────
export const ROOM_CONFIG = {
    MAX_PLAYERS: 20,
    MAP_WIDTH: 1024,
    MAP_HEIGHT: 768,
    TILE_SIZE: 32,
    MAP_COLS: 32,
    MAP_ROWS: 24,
    PLAYER_SPEED: 80,
};
// ── Join Room Schema ──────────────────────────────
export const joinRoomSchema = z.object({
    roomId: z.string().min(1).max(50),
});
//# sourceMappingURL=lab.js.map