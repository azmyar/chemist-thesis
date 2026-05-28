import { z } from "zod";
export declare const directionSchema: z.ZodEnum<["up", "down", "left", "right"]>;
export type Direction = z.infer<typeof directionSchema>;
export declare const itemCategorySchema: z.ZodEnum<["alat", "bahan"]>;
export type ItemCategory = z.infer<typeof itemCategorySchema>;
/** What's been transferred into a container (e.g., weighed solid, poured liquid) */
export declare const containerContentSchema: z.ZodObject<{
    itemId: z.ZodString;
    name: z.ZodString;
    weightGrams: z.ZodOptional<z.ZodNumber>;
    volumeMl: z.ZodOptional<z.ZodNumber>;
    dissolved: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    itemId: string;
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
    dissolved?: boolean | undefined;
}, {
    name: string;
    itemId: string;
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
    dissolved?: boolean | undefined;
}>;
export type ContainerContent = z.infer<typeof containerContentSchema>;
/**
 * Decision value stored per container. Flexible key-value so new step handlers
 * can log context-specific choices without schema migration.
 */
export declare const decisionValueSchema: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
export type DecisionValue = z.infer<typeof decisionValueSchema>;
export declare const containerOutcomesSchema: z.ZodObject<{
    issues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    massErrorG: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    issues?: string[] | undefined;
    massErrorG?: number | undefined;
}, {
    issues?: string[] | undefined;
    massErrorG?: number | undefined;
}>;
export type ContainerOutcomes = z.infer<typeof containerOutcomesSchema>;
export declare const labContainerMetaSchema: z.ZodObject<{
    sampleTerusiG: z.ZodOptional<z.ZodNumber>;
    acidified: z.ZodOptional<z.ZodBoolean>;
    boiled: z.ZodOptional<z.ZodBoolean>;
    precipitated: z.ZodOptional<z.ZodBoolean>;
    stirred: z.ZodOptional<z.ZodBoolean>;
    precipitationChecked: z.ZodOptional<z.ZodBoolean>;
    filtered: z.ZodOptional<z.ZodBoolean>;
    washed: z.ZodOptional<z.ZodBoolean>;
    fromFiltrate: z.ZodOptional<z.ZodBoolean>;
    sulfateTestHclAdded: z.ZodOptional<z.ZodBoolean>;
    sulfateTestBaCl2Added: z.ZodOptional<z.ZodBoolean>;
    baseTested: z.ZodOptional<z.ZodBoolean>;
    dried: z.ZodOptional<z.ZodBoolean>;
    transferredToCrucible: z.ZodOptional<z.ZodBoolean>;
    tekluCharred: z.ZodOptional<z.ZodBoolean>;
    calcined: z.ZodOptional<z.ZodBoolean>;
    cooled: z.ZodOptional<z.ZodBoolean>;
    cuoMassG: z.ZodOptional<z.ZodNumber>;
    lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
    reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
    setupFilterPaperAttached: z.ZodOptional<z.ZodBoolean>;
    setupReceiverAttached: z.ZodOptional<z.ZodBoolean>;
    setupReceiverItemId: z.ZodOptional<z.ZodString>;
    setupReceiverName: z.ZodOptional<z.ZodString>;
    setupReceiverMaxVolumeMl: z.ZodOptional<z.ZodNumber>;
    setupReceiverContents: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        name: z.ZodString;
        weightGrams: z.ZodOptional<z.ZodNumber>;
        volumeMl: z.ZodOptional<z.ZodNumber>;
        dissolved: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }, {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }>, "many">>;
    setupReceiverFromFiltrate: z.ZodOptional<z.ZodBoolean>;
    decisions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
    outcomes: z.ZodOptional<z.ZodObject<{
        issues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        massErrorG: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        issues?: string[] | undefined;
        massErrorG?: number | undefined;
    }, {
        issues?: string[] | undefined;
        massErrorG?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    sampleTerusiG?: number | undefined;
    acidified?: boolean | undefined;
    boiled?: boolean | undefined;
    precipitated?: boolean | undefined;
    stirred?: boolean | undefined;
    precipitationChecked?: boolean | undefined;
    filtered?: boolean | undefined;
    washed?: boolean | undefined;
    fromFiltrate?: boolean | undefined;
    sulfateTestHclAdded?: boolean | undefined;
    sulfateTestBaCl2Added?: boolean | undefined;
    baseTested?: boolean | undefined;
    dried?: boolean | undefined;
    transferredToCrucible?: boolean | undefined;
    tekluCharred?: boolean | undefined;
    calcined?: boolean | undefined;
    cooled?: boolean | undefined;
    cuoMassG?: number | undefined;
    lastRecordedMassG?: number | undefined;
    reheatedAfterWeigh?: boolean | undefined;
    setupFilterPaperAttached?: boolean | undefined;
    setupReceiverAttached?: boolean | undefined;
    setupReceiverItemId?: string | undefined;
    setupReceiverName?: string | undefined;
    setupReceiverMaxVolumeMl?: number | undefined;
    setupReceiverContents?: {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }[] | undefined;
    setupReceiverFromFiltrate?: boolean | undefined;
    decisions?: Record<string, string | number | boolean> | undefined;
    outcomes?: {
        issues?: string[] | undefined;
        massErrorG?: number | undefined;
    } | undefined;
}, {
    sampleTerusiG?: number | undefined;
    acidified?: boolean | undefined;
    boiled?: boolean | undefined;
    precipitated?: boolean | undefined;
    stirred?: boolean | undefined;
    precipitationChecked?: boolean | undefined;
    filtered?: boolean | undefined;
    washed?: boolean | undefined;
    fromFiltrate?: boolean | undefined;
    sulfateTestHclAdded?: boolean | undefined;
    sulfateTestBaCl2Added?: boolean | undefined;
    baseTested?: boolean | undefined;
    dried?: boolean | undefined;
    transferredToCrucible?: boolean | undefined;
    tekluCharred?: boolean | undefined;
    calcined?: boolean | undefined;
    cooled?: boolean | undefined;
    cuoMassG?: number | undefined;
    lastRecordedMassG?: number | undefined;
    reheatedAfterWeigh?: boolean | undefined;
    setupFilterPaperAttached?: boolean | undefined;
    setupReceiverAttached?: boolean | undefined;
    setupReceiverItemId?: string | undefined;
    setupReceiverName?: string | undefined;
    setupReceiverMaxVolumeMl?: number | undefined;
    setupReceiverContents?: {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }[] | undefined;
    setupReceiverFromFiltrate?: boolean | undefined;
    decisions?: Record<string, string | number | boolean> | undefined;
    outcomes?: {
        issues?: string[] | undefined;
        massErrorG?: number | undefined;
    } | undefined;
}>;
export type LabContainerMeta = z.infer<typeof labContainerMetaSchema>;
export declare const inventoryItemSchema: z.ZodObject<{
    itemId: z.ZodString;
    baseItemId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    category: z.ZodEnum<["alat", "bahan"]>;
    quantity: z.ZodNumber;
    weightGrams: z.ZodOptional<z.ZodNumber>;
    volumeMl: z.ZodOptional<z.ZodNumber>;
    maxVolumeMl: z.ZodOptional<z.ZodNumber>;
    contents: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        name: z.ZodString;
        weightGrams: z.ZodOptional<z.ZodNumber>;
        volumeMl: z.ZodOptional<z.ZodNumber>;
        dissolved: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }, {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }>, "many">>;
    labMeta: z.ZodOptional<z.ZodObject<{
        sampleTerusiG: z.ZodOptional<z.ZodNumber>;
        acidified: z.ZodOptional<z.ZodBoolean>;
        boiled: z.ZodOptional<z.ZodBoolean>;
        precipitated: z.ZodOptional<z.ZodBoolean>;
        stirred: z.ZodOptional<z.ZodBoolean>;
        precipitationChecked: z.ZodOptional<z.ZodBoolean>;
        filtered: z.ZodOptional<z.ZodBoolean>;
        washed: z.ZodOptional<z.ZodBoolean>;
        fromFiltrate: z.ZodOptional<z.ZodBoolean>;
        sulfateTestHclAdded: z.ZodOptional<z.ZodBoolean>;
        sulfateTestBaCl2Added: z.ZodOptional<z.ZodBoolean>;
        baseTested: z.ZodOptional<z.ZodBoolean>;
        dried: z.ZodOptional<z.ZodBoolean>;
        transferredToCrucible: z.ZodOptional<z.ZodBoolean>;
        tekluCharred: z.ZodOptional<z.ZodBoolean>;
        calcined: z.ZodOptional<z.ZodBoolean>;
        cooled: z.ZodOptional<z.ZodBoolean>;
        cuoMassG: z.ZodOptional<z.ZodNumber>;
        lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
        reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
        setupFilterPaperAttached: z.ZodOptional<z.ZodBoolean>;
        setupReceiverAttached: z.ZodOptional<z.ZodBoolean>;
        setupReceiverItemId: z.ZodOptional<z.ZodString>;
        setupReceiverName: z.ZodOptional<z.ZodString>;
        setupReceiverMaxVolumeMl: z.ZodOptional<z.ZodNumber>;
        setupReceiverContents: z.ZodOptional<z.ZodArray<z.ZodObject<{
            itemId: z.ZodString;
            name: z.ZodString;
            weightGrams: z.ZodOptional<z.ZodNumber>;
            volumeMl: z.ZodOptional<z.ZodNumber>;
            dissolved: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }, {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }>, "many">>;
        setupReceiverFromFiltrate: z.ZodOptional<z.ZodBoolean>;
        decisions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        outcomes: z.ZodOptional<z.ZodObject<{
            issues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            massErrorG: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        }, {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        sampleTerusiG?: number | undefined;
        acidified?: boolean | undefined;
        boiled?: boolean | undefined;
        precipitated?: boolean | undefined;
        stirred?: boolean | undefined;
        precipitationChecked?: boolean | undefined;
        filtered?: boolean | undefined;
        washed?: boolean | undefined;
        fromFiltrate?: boolean | undefined;
        sulfateTestHclAdded?: boolean | undefined;
        sulfateTestBaCl2Added?: boolean | undefined;
        baseTested?: boolean | undefined;
        dried?: boolean | undefined;
        transferredToCrucible?: boolean | undefined;
        tekluCharred?: boolean | undefined;
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
        setupFilterPaperAttached?: boolean | undefined;
        setupReceiverAttached?: boolean | undefined;
        setupReceiverItemId?: string | undefined;
        setupReceiverName?: string | undefined;
        setupReceiverMaxVolumeMl?: number | undefined;
        setupReceiverContents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        setupReceiverFromFiltrate?: boolean | undefined;
        decisions?: Record<string, string | number | boolean> | undefined;
        outcomes?: {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        } | undefined;
    }, {
        sampleTerusiG?: number | undefined;
        acidified?: boolean | undefined;
        boiled?: boolean | undefined;
        precipitated?: boolean | undefined;
        stirred?: boolean | undefined;
        precipitationChecked?: boolean | undefined;
        filtered?: boolean | undefined;
        washed?: boolean | undefined;
        fromFiltrate?: boolean | undefined;
        sulfateTestHclAdded?: boolean | undefined;
        sulfateTestBaCl2Added?: boolean | undefined;
        baseTested?: boolean | undefined;
        dried?: boolean | undefined;
        transferredToCrucible?: boolean | undefined;
        tekluCharred?: boolean | undefined;
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
        setupFilterPaperAttached?: boolean | undefined;
        setupReceiverAttached?: boolean | undefined;
        setupReceiverItemId?: string | undefined;
        setupReceiverName?: string | undefined;
        setupReceiverMaxVolumeMl?: number | undefined;
        setupReceiverContents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        setupReceiverFromFiltrate?: boolean | undefined;
        decisions?: Record<string, string | number | boolean> | undefined;
        outcomes?: {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    itemId: string;
    category: "alat" | "bahan";
    quantity: number;
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
    baseItemId?: string | undefined;
    maxVolumeMl?: number | undefined;
    contents?: {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }[] | undefined;
    labMeta?: {
        sampleTerusiG?: number | undefined;
        acidified?: boolean | undefined;
        boiled?: boolean | undefined;
        precipitated?: boolean | undefined;
        stirred?: boolean | undefined;
        precipitationChecked?: boolean | undefined;
        filtered?: boolean | undefined;
        washed?: boolean | undefined;
        fromFiltrate?: boolean | undefined;
        sulfateTestHclAdded?: boolean | undefined;
        sulfateTestBaCl2Added?: boolean | undefined;
        baseTested?: boolean | undefined;
        dried?: boolean | undefined;
        transferredToCrucible?: boolean | undefined;
        tekluCharred?: boolean | undefined;
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
        setupFilterPaperAttached?: boolean | undefined;
        setupReceiverAttached?: boolean | undefined;
        setupReceiverItemId?: string | undefined;
        setupReceiverName?: string | undefined;
        setupReceiverMaxVolumeMl?: number | undefined;
        setupReceiverContents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        setupReceiverFromFiltrate?: boolean | undefined;
        decisions?: Record<string, string | number | boolean> | undefined;
        outcomes?: {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        } | undefined;
    } | undefined;
}, {
    name: string;
    itemId: string;
    category: "alat" | "bahan";
    quantity: number;
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
    baseItemId?: string | undefined;
    maxVolumeMl?: number | undefined;
    contents?: {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }[] | undefined;
    labMeta?: {
        sampleTerusiG?: number | undefined;
        acidified?: boolean | undefined;
        boiled?: boolean | undefined;
        precipitated?: boolean | undefined;
        stirred?: boolean | undefined;
        precipitationChecked?: boolean | undefined;
        filtered?: boolean | undefined;
        washed?: boolean | undefined;
        fromFiltrate?: boolean | undefined;
        sulfateTestHclAdded?: boolean | undefined;
        sulfateTestBaCl2Added?: boolean | undefined;
        baseTested?: boolean | undefined;
        dried?: boolean | undefined;
        transferredToCrucible?: boolean | undefined;
        tekluCharred?: boolean | undefined;
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
        setupFilterPaperAttached?: boolean | undefined;
        setupReceiverAttached?: boolean | undefined;
        setupReceiverItemId?: string | undefined;
        setupReceiverName?: string | undefined;
        setupReceiverMaxVolumeMl?: number | undefined;
        setupReceiverContents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        setupReceiverFromFiltrate?: boolean | undefined;
        decisions?: Record<string, string | number | boolean> | undefined;
        outcomes?: {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        } | undefined;
    } | undefined;
}>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export declare const heldItemSchema: z.ZodObject<{
    itemId: z.ZodString;
    baseItemId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    category: z.ZodEnum<["alat", "bahan"]>;
    weightGrams: z.ZodOptional<z.ZodNumber>;
    volumeMl: z.ZodOptional<z.ZodNumber>;
    maxVolumeMl: z.ZodOptional<z.ZodNumber>;
    contents: z.ZodOptional<z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        name: z.ZodString;
        weightGrams: z.ZodOptional<z.ZodNumber>;
        volumeMl: z.ZodOptional<z.ZodNumber>;
        dissolved: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }, {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }>, "many">>;
    labMeta: z.ZodOptional<z.ZodObject<{
        sampleTerusiG: z.ZodOptional<z.ZodNumber>;
        acidified: z.ZodOptional<z.ZodBoolean>;
        boiled: z.ZodOptional<z.ZodBoolean>;
        precipitated: z.ZodOptional<z.ZodBoolean>;
        stirred: z.ZodOptional<z.ZodBoolean>;
        precipitationChecked: z.ZodOptional<z.ZodBoolean>;
        filtered: z.ZodOptional<z.ZodBoolean>;
        washed: z.ZodOptional<z.ZodBoolean>;
        fromFiltrate: z.ZodOptional<z.ZodBoolean>;
        sulfateTestHclAdded: z.ZodOptional<z.ZodBoolean>;
        sulfateTestBaCl2Added: z.ZodOptional<z.ZodBoolean>;
        baseTested: z.ZodOptional<z.ZodBoolean>;
        dried: z.ZodOptional<z.ZodBoolean>;
        transferredToCrucible: z.ZodOptional<z.ZodBoolean>;
        tekluCharred: z.ZodOptional<z.ZodBoolean>;
        calcined: z.ZodOptional<z.ZodBoolean>;
        cooled: z.ZodOptional<z.ZodBoolean>;
        cuoMassG: z.ZodOptional<z.ZodNumber>;
        lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
        reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
        setupFilterPaperAttached: z.ZodOptional<z.ZodBoolean>;
        setupReceiverAttached: z.ZodOptional<z.ZodBoolean>;
        setupReceiverItemId: z.ZodOptional<z.ZodString>;
        setupReceiverName: z.ZodOptional<z.ZodString>;
        setupReceiverMaxVolumeMl: z.ZodOptional<z.ZodNumber>;
        setupReceiverContents: z.ZodOptional<z.ZodArray<z.ZodObject<{
            itemId: z.ZodString;
            name: z.ZodString;
            weightGrams: z.ZodOptional<z.ZodNumber>;
            volumeMl: z.ZodOptional<z.ZodNumber>;
            dissolved: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }, {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }>, "many">>;
        setupReceiverFromFiltrate: z.ZodOptional<z.ZodBoolean>;
        decisions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
        outcomes: z.ZodOptional<z.ZodObject<{
            issues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            massErrorG: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        }, {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        sampleTerusiG?: number | undefined;
        acidified?: boolean | undefined;
        boiled?: boolean | undefined;
        precipitated?: boolean | undefined;
        stirred?: boolean | undefined;
        precipitationChecked?: boolean | undefined;
        filtered?: boolean | undefined;
        washed?: boolean | undefined;
        fromFiltrate?: boolean | undefined;
        sulfateTestHclAdded?: boolean | undefined;
        sulfateTestBaCl2Added?: boolean | undefined;
        baseTested?: boolean | undefined;
        dried?: boolean | undefined;
        transferredToCrucible?: boolean | undefined;
        tekluCharred?: boolean | undefined;
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
        setupFilterPaperAttached?: boolean | undefined;
        setupReceiverAttached?: boolean | undefined;
        setupReceiverItemId?: string | undefined;
        setupReceiverName?: string | undefined;
        setupReceiverMaxVolumeMl?: number | undefined;
        setupReceiverContents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        setupReceiverFromFiltrate?: boolean | undefined;
        decisions?: Record<string, string | number | boolean> | undefined;
        outcomes?: {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        } | undefined;
    }, {
        sampleTerusiG?: number | undefined;
        acidified?: boolean | undefined;
        boiled?: boolean | undefined;
        precipitated?: boolean | undefined;
        stirred?: boolean | undefined;
        precipitationChecked?: boolean | undefined;
        filtered?: boolean | undefined;
        washed?: boolean | undefined;
        fromFiltrate?: boolean | undefined;
        sulfateTestHclAdded?: boolean | undefined;
        sulfateTestBaCl2Added?: boolean | undefined;
        baseTested?: boolean | undefined;
        dried?: boolean | undefined;
        transferredToCrucible?: boolean | undefined;
        tekluCharred?: boolean | undefined;
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
        setupFilterPaperAttached?: boolean | undefined;
        setupReceiverAttached?: boolean | undefined;
        setupReceiverItemId?: string | undefined;
        setupReceiverName?: string | undefined;
        setupReceiverMaxVolumeMl?: number | undefined;
        setupReceiverContents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        setupReceiverFromFiltrate?: boolean | undefined;
        decisions?: Record<string, string | number | boolean> | undefined;
        outcomes?: {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    itemId: string;
    category: "alat" | "bahan";
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
    baseItemId?: string | undefined;
    maxVolumeMl?: number | undefined;
    contents?: {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }[] | undefined;
    labMeta?: {
        sampleTerusiG?: number | undefined;
        acidified?: boolean | undefined;
        boiled?: boolean | undefined;
        precipitated?: boolean | undefined;
        stirred?: boolean | undefined;
        precipitationChecked?: boolean | undefined;
        filtered?: boolean | undefined;
        washed?: boolean | undefined;
        fromFiltrate?: boolean | undefined;
        sulfateTestHclAdded?: boolean | undefined;
        sulfateTestBaCl2Added?: boolean | undefined;
        baseTested?: boolean | undefined;
        dried?: boolean | undefined;
        transferredToCrucible?: boolean | undefined;
        tekluCharred?: boolean | undefined;
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
        setupFilterPaperAttached?: boolean | undefined;
        setupReceiverAttached?: boolean | undefined;
        setupReceiverItemId?: string | undefined;
        setupReceiverName?: string | undefined;
        setupReceiverMaxVolumeMl?: number | undefined;
        setupReceiverContents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        setupReceiverFromFiltrate?: boolean | undefined;
        decisions?: Record<string, string | number | boolean> | undefined;
        outcomes?: {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        } | undefined;
    } | undefined;
}, {
    name: string;
    itemId: string;
    category: "alat" | "bahan";
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
    baseItemId?: string | undefined;
    maxVolumeMl?: number | undefined;
    contents?: {
        name: string;
        itemId: string;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        dissolved?: boolean | undefined;
    }[] | undefined;
    labMeta?: {
        sampleTerusiG?: number | undefined;
        acidified?: boolean | undefined;
        boiled?: boolean | undefined;
        precipitated?: boolean | undefined;
        stirred?: boolean | undefined;
        precipitationChecked?: boolean | undefined;
        filtered?: boolean | undefined;
        washed?: boolean | undefined;
        fromFiltrate?: boolean | undefined;
        sulfateTestHclAdded?: boolean | undefined;
        sulfateTestBaCl2Added?: boolean | undefined;
        baseTested?: boolean | undefined;
        dried?: boolean | undefined;
        transferredToCrucible?: boolean | undefined;
        tekluCharred?: boolean | undefined;
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
        setupFilterPaperAttached?: boolean | undefined;
        setupReceiverAttached?: boolean | undefined;
        setupReceiverItemId?: string | undefined;
        setupReceiverName?: string | undefined;
        setupReceiverMaxVolumeMl?: number | undefined;
        setupReceiverContents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        setupReceiverFromFiltrate?: boolean | undefined;
        decisions?: Record<string, string | number | boolean> | undefined;
        outcomes?: {
            issues?: string[] | undefined;
            massErrorG?: number | undefined;
        } | undefined;
    } | undefined;
}>;
export type HeldItem = z.infer<typeof heldItemSchema>;
export declare const levelMilestoneSchema: z.ZodObject<{
    step: z.ZodNumber;
    title: z.ZodString;
    completed: z.ZodBoolean;
    completedAt: z.ZodOptional<z.ZodNumber>;
    detail: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    step: number;
    completed: boolean;
    completedAt?: number | undefined;
    detail?: string | undefined;
}, {
    title: string;
    step: number;
    completed: boolean;
    completedAt?: number | undefined;
    detail?: string | undefined;
}>;
export type LevelMilestone = z.infer<typeof levelMilestoneSchema>;
export declare const levelStateSchema: z.ZodObject<{
    levelId: z.ZodString;
    title: z.ZodString;
    xp: z.ZodNumber;
    finished: z.ZodBoolean;
    milestones: z.ZodArray<z.ZodObject<{
        step: z.ZodNumber;
        title: z.ZodString;
        completed: z.ZodBoolean;
        completedAt: z.ZodOptional<z.ZodNumber>;
        detail: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        step: number;
        completed: boolean;
        completedAt?: number | undefined;
        detail?: string | undefined;
    }, {
        title: string;
        step: number;
        completed: boolean;
        completedAt?: number | undefined;
        detail?: string | undefined;
    }>, "many">;
    startedAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    lastEvent: z.ZodOptional<z.ZodString>;
    studentName: z.ZodOptional<z.ZodString>;
    sid: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    levelId: string;
    xp: number;
    finished: boolean;
    milestones: {
        title: string;
        step: number;
        completed: boolean;
        completedAt?: number | undefined;
        detail?: string | undefined;
    }[];
    startedAt: number;
    updatedAt: number;
    lastEvent?: string | undefined;
    studentName?: string | undefined;
    sid?: string | undefined;
}, {
    title: string;
    levelId: string;
    xp: number;
    finished: boolean;
    milestones: {
        title: string;
        step: number;
        completed: boolean;
        completedAt?: number | undefined;
        detail?: string | undefined;
    }[];
    startedAt: number;
    updatedAt: number;
    lastEvent?: string | undefined;
    studentName?: string | undefined;
    sid?: string | undefined;
}>;
export type LevelState = z.infer<typeof levelStateSchema>;
export declare const reportIssueSchema: z.ZodObject<{
    code: z.ZodString;
    impactMassG: z.ZodNumber;
    decisionSummary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    impactMassG: number;
    decisionSummary: string;
}, {
    code: string;
    impactMassG: number;
    decisionSummary: string;
}>;
export type ReportIssue = z.infer<typeof reportIssueSchema>;
export declare const levelReportSchema: z.ZodObject<{
    levelId: z.ZodString;
    sampleMassG: z.ZodNumber;
    cuoMassG: z.ZodNumber;
    gravimetricFactor: z.ZodNumber;
    kadarPercent: z.ZodNumber;
    theoreticalPercent: z.ZodNumber;
    deviationPercent: z.ZodNumber;
    issues: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        impactMassG: z.ZodNumber;
        decisionSummary: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        code: string;
        impactMassG: number;
        decisionSummary: string;
    }, {
        code: string;
        impactMassG: number;
        decisionSummary: string;
    }>, "many">;
    decisions: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>;
    generatedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    issues: {
        code: string;
        impactMassG: number;
        decisionSummary: string;
    }[];
    cuoMassG: number;
    decisions: Record<string, string | number | boolean>;
    levelId: string;
    sampleMassG: number;
    gravimetricFactor: number;
    kadarPercent: number;
    theoreticalPercent: number;
    deviationPercent: number;
    generatedAt: number;
}, {
    issues: {
        code: string;
        impactMassG: number;
        decisionSummary: string;
    }[];
    cuoMassG: number;
    decisions: Record<string, string | number | boolean>;
    levelId: string;
    sampleMassG: number;
    gravimetricFactor: number;
    kadarPercent: number;
    theoreticalPercent: number;
    deviationPercent: number;
    generatedAt: number;
}>;
export type LevelReport = z.infer<typeof levelReportSchema>;
export interface ConceptFeedback {
    code: string;
    title: string;
    why: string;
    correction: string;
    relatedConcept: string;
    blocking: boolean;
}
export declare const playerStateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    x: z.ZodNumber;
    y: z.ZodNumber;
    direction: z.ZodEnum<["up", "down", "left", "right"]>;
    vx: z.ZodNumber;
    vy: z.ZodNumber;
    holding: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        baseItemId: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        category: z.ZodEnum<["alat", "bahan"]>;
        weightGrams: z.ZodOptional<z.ZodNumber>;
        volumeMl: z.ZodOptional<z.ZodNumber>;
        maxVolumeMl: z.ZodOptional<z.ZodNumber>;
        contents: z.ZodOptional<z.ZodArray<z.ZodObject<{
            itemId: z.ZodString;
            name: z.ZodString;
            weightGrams: z.ZodOptional<z.ZodNumber>;
            volumeMl: z.ZodOptional<z.ZodNumber>;
            dissolved: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }, {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }>, "many">>;
        labMeta: z.ZodOptional<z.ZodObject<{
            sampleTerusiG: z.ZodOptional<z.ZodNumber>;
            acidified: z.ZodOptional<z.ZodBoolean>;
            boiled: z.ZodOptional<z.ZodBoolean>;
            precipitated: z.ZodOptional<z.ZodBoolean>;
            stirred: z.ZodOptional<z.ZodBoolean>;
            precipitationChecked: z.ZodOptional<z.ZodBoolean>;
            filtered: z.ZodOptional<z.ZodBoolean>;
            washed: z.ZodOptional<z.ZodBoolean>;
            fromFiltrate: z.ZodOptional<z.ZodBoolean>;
            sulfateTestHclAdded: z.ZodOptional<z.ZodBoolean>;
            sulfateTestBaCl2Added: z.ZodOptional<z.ZodBoolean>;
            baseTested: z.ZodOptional<z.ZodBoolean>;
            dried: z.ZodOptional<z.ZodBoolean>;
            transferredToCrucible: z.ZodOptional<z.ZodBoolean>;
            tekluCharred: z.ZodOptional<z.ZodBoolean>;
            calcined: z.ZodOptional<z.ZodBoolean>;
            cooled: z.ZodOptional<z.ZodBoolean>;
            cuoMassG: z.ZodOptional<z.ZodNumber>;
            lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
            reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
            setupFilterPaperAttached: z.ZodOptional<z.ZodBoolean>;
            setupReceiverAttached: z.ZodOptional<z.ZodBoolean>;
            setupReceiverItemId: z.ZodOptional<z.ZodString>;
            setupReceiverName: z.ZodOptional<z.ZodString>;
            setupReceiverMaxVolumeMl: z.ZodOptional<z.ZodNumber>;
            setupReceiverContents: z.ZodOptional<z.ZodArray<z.ZodObject<{
                itemId: z.ZodString;
                name: z.ZodString;
                weightGrams: z.ZodOptional<z.ZodNumber>;
                volumeMl: z.ZodOptional<z.ZodNumber>;
                dissolved: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }, {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }>, "many">>;
            setupReceiverFromFiltrate: z.ZodOptional<z.ZodBoolean>;
            decisions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
            outcomes: z.ZodOptional<z.ZodObject<{
                issues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                massErrorG: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            }, {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        }, {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        baseItemId?: string | undefined;
        maxVolumeMl?: number | undefined;
        contents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        labMeta?: {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        } | undefined;
    }, {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        baseItemId?: string | undefined;
        maxVolumeMl?: number | undefined;
        contents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        labMeta?: {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    vx: number;
    vy: number;
    holding: {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        baseItemId?: string | undefined;
        maxVolumeMl?: number | undefined;
        contents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        labMeta?: {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        } | undefined;
    }[];
}, {
    name: string;
    id: string;
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    vx: number;
    vy: number;
    holding: {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        baseItemId?: string | undefined;
        maxVolumeMl?: number | undefined;
        contents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        labMeta?: {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        } | undefined;
    }[];
}>;
export type PlayerState = z.infer<typeof playerStateSchema>;
export declare const gameObjectTypeSchema: z.ZodEnum<["workbench", "storage", "reagent_table", "timbangan", "oven", "furnace", "waste"]>;
export type GameObjectType = z.infer<typeof gameObjectTypeSchema>;
export declare const gameObjectStateSchema: z.ZodObject<{
    id: z.ZodString;
    objectType: z.ZodEnum<["workbench", "storage", "reagent_table", "timbangan", "oven", "furnace", "waste"]>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
        baseItemId: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        category: z.ZodEnum<["alat", "bahan"]>;
        quantity: z.ZodNumber;
        weightGrams: z.ZodOptional<z.ZodNumber>;
        volumeMl: z.ZodOptional<z.ZodNumber>;
        maxVolumeMl: z.ZodOptional<z.ZodNumber>;
        contents: z.ZodOptional<z.ZodArray<z.ZodObject<{
            itemId: z.ZodString;
            name: z.ZodString;
            weightGrams: z.ZodOptional<z.ZodNumber>;
            volumeMl: z.ZodOptional<z.ZodNumber>;
            dissolved: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }, {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }>, "many">>;
        labMeta: z.ZodOptional<z.ZodObject<{
            sampleTerusiG: z.ZodOptional<z.ZodNumber>;
            acidified: z.ZodOptional<z.ZodBoolean>;
            boiled: z.ZodOptional<z.ZodBoolean>;
            precipitated: z.ZodOptional<z.ZodBoolean>;
            stirred: z.ZodOptional<z.ZodBoolean>;
            precipitationChecked: z.ZodOptional<z.ZodBoolean>;
            filtered: z.ZodOptional<z.ZodBoolean>;
            washed: z.ZodOptional<z.ZodBoolean>;
            fromFiltrate: z.ZodOptional<z.ZodBoolean>;
            sulfateTestHclAdded: z.ZodOptional<z.ZodBoolean>;
            sulfateTestBaCl2Added: z.ZodOptional<z.ZodBoolean>;
            baseTested: z.ZodOptional<z.ZodBoolean>;
            dried: z.ZodOptional<z.ZodBoolean>;
            transferredToCrucible: z.ZodOptional<z.ZodBoolean>;
            tekluCharred: z.ZodOptional<z.ZodBoolean>;
            calcined: z.ZodOptional<z.ZodBoolean>;
            cooled: z.ZodOptional<z.ZodBoolean>;
            cuoMassG: z.ZodOptional<z.ZodNumber>;
            lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
            reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
            setupFilterPaperAttached: z.ZodOptional<z.ZodBoolean>;
            setupReceiverAttached: z.ZodOptional<z.ZodBoolean>;
            setupReceiverItemId: z.ZodOptional<z.ZodString>;
            setupReceiverName: z.ZodOptional<z.ZodString>;
            setupReceiverMaxVolumeMl: z.ZodOptional<z.ZodNumber>;
            setupReceiverContents: z.ZodOptional<z.ZodArray<z.ZodObject<{
                itemId: z.ZodString;
                name: z.ZodString;
                weightGrams: z.ZodOptional<z.ZodNumber>;
                volumeMl: z.ZodOptional<z.ZodNumber>;
                dissolved: z.ZodOptional<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }, {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }>, "many">>;
            setupReceiverFromFiltrate: z.ZodOptional<z.ZodBoolean>;
            decisions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>>>;
            outcomes: z.ZodOptional<z.ZodObject<{
                issues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                massErrorG: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            }, {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        }, {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        quantity: number;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        baseItemId?: string | undefined;
        maxVolumeMl?: number | undefined;
        contents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        labMeta?: {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        } | undefined;
    }, {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        quantity: number;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        baseItemId?: string | undefined;
        maxVolumeMl?: number | undefined;
        contents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        labMeta?: {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    objectType: "workbench" | "storage" | "reagent_table" | "timbangan" | "oven" | "furnace" | "waste";
    items: {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        quantity: number;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        baseItemId?: string | undefined;
        maxVolumeMl?: number | undefined;
        contents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        labMeta?: {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        } | undefined;
    }[];
}, {
    id: string;
    objectType: "workbench" | "storage" | "reagent_table" | "timbangan" | "oven" | "furnace" | "waste";
    items: {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        quantity: number;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
        baseItemId?: string | undefined;
        maxVolumeMl?: number | undefined;
        contents?: {
            name: string;
            itemId: string;
            weightGrams?: number | undefined;
            volumeMl?: number | undefined;
            dissolved?: boolean | undefined;
        }[] | undefined;
        labMeta?: {
            sampleTerusiG?: number | undefined;
            acidified?: boolean | undefined;
            boiled?: boolean | undefined;
            precipitated?: boolean | undefined;
            stirred?: boolean | undefined;
            precipitationChecked?: boolean | undefined;
            filtered?: boolean | undefined;
            washed?: boolean | undefined;
            fromFiltrate?: boolean | undefined;
            sulfateTestHclAdded?: boolean | undefined;
            sulfateTestBaCl2Added?: boolean | undefined;
            baseTested?: boolean | undefined;
            dried?: boolean | undefined;
            transferredToCrucible?: boolean | undefined;
            tekluCharred?: boolean | undefined;
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
            setupFilterPaperAttached?: boolean | undefined;
            setupReceiverAttached?: boolean | undefined;
            setupReceiverItemId?: string | undefined;
            setupReceiverName?: string | undefined;
            setupReceiverMaxVolumeMl?: number | undefined;
            setupReceiverContents?: {
                name: string;
                itemId: string;
                weightGrams?: number | undefined;
                volumeMl?: number | undefined;
                dissolved?: boolean | undefined;
            }[] | undefined;
            setupReceiverFromFiltrate?: boolean | undefined;
            decisions?: Record<string, string | number | boolean> | undefined;
            outcomes?: {
                issues?: string[] | undefined;
                massErrorG?: number | undefined;
            } | undefined;
        } | undefined;
    }[];
}>;
export type GameObjectState = z.infer<typeof gameObjectStateSchema>;
export declare const clientMoveSchema: z.ZodObject<{
    type: z.ZodLiteral<"move">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    direction: z.ZodEnum<["up", "down", "left", "right"]>;
    vx: z.ZodNumber;
    vy: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "move";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    vx: number;
    vy: number;
}, {
    type: "move";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    vx: number;
    vy: number;
}>;
export declare const clientStopSchema: z.ZodObject<{
    type: z.ZodLiteral<"stop">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    direction: z.ZodEnum<["up", "down", "left", "right"]>;
}, "strip", z.ZodTypeAny, {
    type: "stop";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
}, {
    type: "stop";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
}>;
export declare const clientChatSchema: z.ZodObject<{
    type: z.ZodLiteral<"chat">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "chat";
    text: string;
}, {
    type: "chat";
    text: string;
}>;
export declare const clientTakeItemSchema: z.ZodObject<{
    type: z.ZodLiteral<"take_item">;
    objectId: z.ZodString;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "take_item";
    itemId: string;
    objectId: string;
}, {
    type: "take_item";
    itemId: string;
    objectId: string;
}>;
export declare const clientPlaceItemSchema: z.ZodObject<{
    type: z.ZodLiteral<"place_item">;
    objectId: z.ZodString;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "place_item";
    itemId: string;
    objectId: string;
}, {
    type: "place_item";
    itemId: string;
    objectId: string;
}>;
export declare const clientUseHeldOnItemSchema: z.ZodObject<{
    type: z.ZodLiteral<"use_held_on_item">;
    objectId: z.ZodString;
    heldItemId: z.ZodString;
    targetItemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "use_held_on_item";
    objectId: string;
    heldItemId: string;
    targetItemId: string;
}, {
    type: "use_held_on_item";
    objectId: string;
    heldItemId: string;
    targetItemId: string;
}>;
export declare const clientWeighItemSchema: z.ZodObject<{
    type: z.ZodLiteral<"weigh_item">;
    transferGrams: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "weigh_item";
    transferGrams: number;
}, {
    type: "weigh_item";
    transferGrams: number;
}>;
/**
 * Tap-to-scoop weighing. Unlike weigh_item, the client specifies no amount;
 * the server picks a small random transfer (mimics manual spatula scoop).
 * Intended for realistic sample weighing on a balance.
 */
export declare const clientScoopSampleSchema: z.ZodObject<{
    type: z.ZodLiteral<"scoop_sample">;
}, "strip", z.ZodTypeAny, {
    type: "scoop_sample";
}, {
    type: "scoop_sample";
}>;
export declare const clientPourItemSchema: z.ZodObject<{
    type: z.ZodLiteral<"pour_item">;
    objectId: z.ZodString;
    sourceItemId: z.ZodString;
    targetItemId: z.ZodString;
    transferMl: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "pour_item";
    objectId: string;
    targetItemId: string;
    sourceItemId: string;
    transferMl: number;
}, {
    type: "pour_item";
    objectId: string;
    targetItemId: string;
    sourceItemId: string;
    transferMl: number;
}>;
export declare const clientDissolveItemSchema: z.ZodObject<{
    type: z.ZodLiteral<"dissolve_item">;
    objectId: z.ZodString;
    sourceContainerItemId: z.ZodString;
    targetContainerItemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "dissolve_item";
    objectId: string;
    sourceContainerItemId: string;
    targetContainerItemId: string;
}, {
    type: "dissolve_item";
    objectId: string;
    sourceContainerItemId: string;
    targetContainerItemId: string;
}>;
export declare const clientCombineItemsSchema: z.ZodObject<{
    type: z.ZodLiteral<"combine_items">;
    objectId: z.ZodString;
    itemIdA: z.ZodString;
    itemIdB: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "combine_items";
    objectId: string;
    itemIdA: string;
    itemIdB: string;
}, {
    type: "combine_items";
    objectId: string;
    itemIdA: string;
    itemIdB: string;
}>;
export declare const clientRecordMassSchema: z.ZodObject<{
    type: z.ZodLiteral<"record_mass">;
    containerItemId: z.ZodString;
    measuredMassG: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "record_mass";
    containerItemId: string;
    measuredMassG: number;
}, {
    type: "record_mass";
    containerItemId: string;
    measuredMassG: number;
}>;
export declare const clientDiscardObjectContentsSchema: z.ZodObject<{
    type: z.ZodLiteral<"discard_object_contents">;
    objectId: z.ZodString;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "discard_object_contents";
    itemId: string;
    objectId: string;
}, {
    type: "discard_object_contents";
    itemId: string;
    objectId: string;
}>;
export declare const clientDiscardHeldContentsSchema: z.ZodObject<{
    type: z.ZodLiteral<"discard_held_contents">;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "discard_held_contents";
    itemId: string;
}, {
    type: "discard_held_contents";
    itemId: string;
}>;
export declare const setupDetachPartSchema: z.ZodEnum<["filter", "receiver", "all"]>;
export type SetupDetachPart = z.infer<typeof setupDetachPartSchema>;
export declare const clientDetachSetupPartSchema: z.ZodObject<{
    type: z.ZodLiteral<"detach_setup_part">;
    objectId: z.ZodString;
    setupItemId: z.ZodString;
    part: z.ZodEnum<["filter", "receiver", "all"]>;
}, "strip", z.ZodTypeAny, {
    type: "detach_setup_part";
    objectId: string;
    setupItemId: string;
    part: "filter" | "receiver" | "all";
}, {
    type: "detach_setup_part";
    objectId: string;
    setupItemId: string;
    part: "filter" | "receiver" | "all";
}>;
export declare const clientResetLevelSchema: z.ZodObject<{
    type: z.ZodLiteral<"reset_level">;
}, "strip", z.ZodTypeAny, {
    type: "reset_level";
}, {
    type: "reset_level";
}>;
export declare const clientMessageSchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"move">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    direction: z.ZodEnum<["up", "down", "left", "right"]>;
    vx: z.ZodNumber;
    vy: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "move";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    vx: number;
    vy: number;
}, {
    type: "move";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    vx: number;
    vy: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"stop">;
    x: z.ZodNumber;
    y: z.ZodNumber;
    direction: z.ZodEnum<["up", "down", "left", "right"]>;
}, "strip", z.ZodTypeAny, {
    type: "stop";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
}, {
    type: "stop";
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
}>, z.ZodObject<{
    type: z.ZodLiteral<"chat">;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "chat";
    text: string;
}, {
    type: "chat";
    text: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"take_item">;
    objectId: z.ZodString;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "take_item";
    itemId: string;
    objectId: string;
}, {
    type: "take_item";
    itemId: string;
    objectId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"place_item">;
    objectId: z.ZodString;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "place_item";
    itemId: string;
    objectId: string;
}, {
    type: "place_item";
    itemId: string;
    objectId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"use_held_on_item">;
    objectId: z.ZodString;
    heldItemId: z.ZodString;
    targetItemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "use_held_on_item";
    objectId: string;
    heldItemId: string;
    targetItemId: string;
}, {
    type: "use_held_on_item";
    objectId: string;
    heldItemId: string;
    targetItemId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"weigh_item">;
    transferGrams: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "weigh_item";
    transferGrams: number;
}, {
    type: "weigh_item";
    transferGrams: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"scoop_sample">;
}, "strip", z.ZodTypeAny, {
    type: "scoop_sample";
}, {
    type: "scoop_sample";
}>, z.ZodObject<{
    type: z.ZodLiteral<"pour_item">;
    objectId: z.ZodString;
    sourceItemId: z.ZodString;
    targetItemId: z.ZodString;
    transferMl: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "pour_item";
    objectId: string;
    targetItemId: string;
    sourceItemId: string;
    transferMl: number;
}, {
    type: "pour_item";
    objectId: string;
    targetItemId: string;
    sourceItemId: string;
    transferMl: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"dissolve_item">;
    objectId: z.ZodString;
    sourceContainerItemId: z.ZodString;
    targetContainerItemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "dissolve_item";
    objectId: string;
    sourceContainerItemId: string;
    targetContainerItemId: string;
}, {
    type: "dissolve_item";
    objectId: string;
    sourceContainerItemId: string;
    targetContainerItemId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"combine_items">;
    objectId: z.ZodString;
    itemIdA: z.ZodString;
    itemIdB: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "combine_items";
    objectId: string;
    itemIdA: string;
    itemIdB: string;
}, {
    type: "combine_items";
    objectId: string;
    itemIdA: string;
    itemIdB: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"record_mass">;
    containerItemId: z.ZodString;
    measuredMassG: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "record_mass";
    containerItemId: string;
    measuredMassG: number;
}, {
    type: "record_mass";
    containerItemId: string;
    measuredMassG: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"discard_object_contents">;
    objectId: z.ZodString;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "discard_object_contents";
    itemId: string;
    objectId: string;
}, {
    type: "discard_object_contents";
    itemId: string;
    objectId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"discard_held_contents">;
    itemId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "discard_held_contents";
    itemId: string;
}, {
    type: "discard_held_contents";
    itemId: string;
}>, z.ZodObject<{
    type: z.ZodLiteral<"detach_setup_part">;
    objectId: z.ZodString;
    setupItemId: z.ZodString;
    part: z.ZodEnum<["filter", "receiver", "all"]>;
}, "strip", z.ZodTypeAny, {
    type: "detach_setup_part";
    objectId: string;
    setupItemId: string;
    part: "filter" | "receiver" | "all";
}, {
    type: "detach_setup_part";
    objectId: string;
    setupItemId: string;
    part: "filter" | "receiver" | "all";
}>, z.ZodObject<{
    type: z.ZodLiteral<"reset_level">;
}, "strip", z.ZodTypeAny, {
    type: "reset_level";
}, {
    type: "reset_level";
}>]>;
export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ServerMessage = {
    type: "snapshot";
    selfId: string;
    players: PlayerState[];
    objects: GameObjectState[];
} | {
    type: "player_join";
    player: PlayerState;
} | {
    type: "player_leave";
    playerId: string;
} | {
    type: "player_move";
    playerId: string;
    x: number;
    y: number;
    direction: Direction;
    vx: number;
    vy: number;
} | {
    type: "player_stop";
    playerId: string;
    x: number;
    y: number;
    direction: Direction;
} | {
    type: "error";
    message: string;
} | {
    type: "concept_feedback";
    feedback: ConceptFeedback;
} | {
    type: "chat";
    playerId: string;
    playerName: string;
    text: string;
} | {
    type: "object_items_changed";
    objectId: string;
    items: InventoryItem[];
} | {
    type: "player_hold";
    playerId: string;
    holding: HeldItem[];
} | {
    type: "level_state";
    level: LevelState;
} | {
    type: "level_report";
    report: LevelReport;
};
export declare const ROOM_CONFIG: {
    readonly MAX_PLAYERS: 20;
    readonly MAP_WIDTH: 736;
    readonly MAP_HEIGHT: 608;
    readonly TILE_SIZE: 32;
    readonly MAP_COLS: 23;
    readonly MAP_ROWS: 19;
    readonly PLAYER_SPEED: 120;
};
export declare const joinRoomSchema: z.ZodObject<{
    roomId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    roomId: string;
}, {
    roomId: string;
}>;
export type JoinRoomRequest = z.infer<typeof joinRoomSchema>;
//# sourceMappingURL=lab.d.ts.map