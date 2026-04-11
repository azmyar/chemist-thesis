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
    calcined: z.ZodOptional<z.ZodBoolean>;
    cooled: z.ZodOptional<z.ZodBoolean>;
    cuoMassG: z.ZodOptional<z.ZodNumber>;
    lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
    reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
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
    calcined?: boolean | undefined;
    cooled?: boolean | undefined;
    cuoMassG?: number | undefined;
    lastRecordedMassG?: number | undefined;
    reheatedAfterWeigh?: boolean | undefined;
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
    calcined?: boolean | undefined;
    cooled?: boolean | undefined;
    cuoMassG?: number | undefined;
    lastRecordedMassG?: number | undefined;
    reheatedAfterWeigh?: boolean | undefined;
}>;
export type LabContainerMeta = z.infer<typeof labContainerMetaSchema>;
export declare const inventoryItemSchema: z.ZodObject<{
    itemId: z.ZodString;
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
        calcined: z.ZodOptional<z.ZodBoolean>;
        cooled: z.ZodOptional<z.ZodBoolean>;
        cuoMassG: z.ZodOptional<z.ZodNumber>;
        lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
        reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
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
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
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
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    itemId: string;
    category: "alat" | "bahan";
    quantity: number;
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
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
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
    } | undefined;
}, {
    name: string;
    itemId: string;
    category: "alat" | "bahan";
    quantity: number;
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
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
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
    } | undefined;
}>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export declare const heldItemSchema: z.ZodObject<{
    itemId: z.ZodString;
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
        calcined: z.ZodOptional<z.ZodBoolean>;
        cooled: z.ZodOptional<z.ZodBoolean>;
        cuoMassG: z.ZodOptional<z.ZodNumber>;
        lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
        reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
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
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
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
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    itemId: string;
    category: "alat" | "bahan";
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
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
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
    } | undefined;
}, {
    name: string;
    itemId: string;
    category: "alat" | "bahan";
    weightGrams?: number | undefined;
    volumeMl?: number | undefined;
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
        calcined?: boolean | undefined;
        cooled?: boolean | undefined;
        cuoMassG?: number | undefined;
        lastRecordedMassG?: number | undefined;
        reheatedAfterWeigh?: boolean | undefined;
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
}>;
export type LevelState = z.infer<typeof levelStateSchema>;
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
            calcined: z.ZodOptional<z.ZodBoolean>;
            cooled: z.ZodOptional<z.ZodBoolean>;
            cuoMassG: z.ZodOptional<z.ZodNumber>;
            lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
            reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
        } | undefined;
    }, {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
        } | undefined;
    }[];
}>;
export type PlayerState = z.infer<typeof playerStateSchema>;
export declare const gameObjectTypeSchema: z.ZodEnum<["workbench", "storage", "reagent_table", "timbangan"]>;
export type GameObjectType = z.infer<typeof gameObjectTypeSchema>;
export declare const gameObjectStateSchema: z.ZodObject<{
    id: z.ZodString;
    objectType: z.ZodEnum<["workbench", "storage", "reagent_table", "timbangan"]>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodString;
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
            calcined: z.ZodOptional<z.ZodBoolean>;
            cooled: z.ZodOptional<z.ZodBoolean>;
            cuoMassG: z.ZodOptional<z.ZodNumber>;
            lastRecordedMassG: z.ZodOptional<z.ZodNumber>;
            reheatedAfterWeigh: z.ZodOptional<z.ZodBoolean>;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        quantity: number;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
        } | undefined;
    }, {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        quantity: number;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    objectType: "workbench" | "storage" | "reagent_table" | "timbangan";
    items: {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        quantity: number;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
        } | undefined;
    }[];
}, {
    id: string;
    objectType: "workbench" | "storage" | "reagent_table" | "timbangan";
    items: {
        name: string;
        itemId: string;
        category: "alat" | "bahan";
        quantity: number;
        weightGrams?: number | undefined;
        volumeMl?: number | undefined;
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
            calcined?: boolean | undefined;
            cooled?: boolean | undefined;
            cuoMassG?: number | undefined;
            lastRecordedMassG?: number | undefined;
            reheatedAfterWeigh?: boolean | undefined;
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
export declare const clientPourItemSchema: z.ZodObject<{
    type: z.ZodLiteral<"pour_item">;
    objectId: z.ZodString;
    sourceItemId: z.ZodString;
    targetItemId: z.ZodString;
    transferMl: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "pour_item";
    objectId: string;
    sourceItemId: string;
    targetItemId: string;
    transferMl: number;
}, {
    type: "pour_item";
    objectId: string;
    sourceItemId: string;
    targetItemId: string;
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
    type: z.ZodLiteral<"weigh_item">;
    transferGrams: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "weigh_item";
    transferGrams: number;
}, {
    type: "weigh_item";
    transferGrams: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"pour_item">;
    objectId: z.ZodString;
    sourceItemId: z.ZodString;
    targetItemId: z.ZodString;
    transferMl: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "pour_item";
    objectId: string;
    sourceItemId: string;
    targetItemId: string;
    transferMl: number;
}, {
    type: "pour_item";
    objectId: string;
    sourceItemId: string;
    targetItemId: string;
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
};
export declare const ROOM_CONFIG: {
    readonly MAX_PLAYERS: 20;
    readonly MAP_WIDTH: 1024;
    readonly MAP_HEIGHT: 768;
    readonly TILE_SIZE: 32;
    readonly MAP_COLS: 32;
    readonly MAP_ROWS: 24;
    readonly PLAYER_SPEED: 80;
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