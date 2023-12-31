import type { Panel, ActionEvent } from "./game-ui";

import { GetEnemyCache } from "./game-enemy.js";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

export type Building = Panel & {
    iconURI: string;
};

export type BuildingMsg = {
    building: Building;
    index: number;
};
export type BuildingEvent = CustomEvent<BuildingMsg>;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** A JSON object containing building types. */
interface BuildingJSON {
    [key: string]: Building;
}

/** All building types in /data/building.json. */
interface BuildingData {
    campfire?: Building;
    tree?: Building;
    crafter?: Building;
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** Global building variables. */
type BuildingCache = {
    /** Index of currently selected building. Undefined if nothing selected. */
    selected: number | undefined;
    /** Spawned buildings. */
    buildings: Building[];

    /** All building types in /data/building.json. */
    buildingTypes: BuildingData;
    /** True if buildingTypes are loaded. */
    areTypesLoaded: boolean;
};

/**
 * A decorated function.
 * One global {@link BuildingCache} object is initialized in the decorator.
 * Calling the resulting function returns the same object every time.
 */
export const GetBuildingCache: () => BuildingCache = (() => {
    let cache: BuildingCache = {
        selected: undefined,
        buildings: [],

        buildingTypes: {},
        areTypesLoaded: false,
    };
    return () => cache;
})();

/**
 * Load building types from /data/building.json into cache.
 */
async function LoadTypes(): Promise<boolean> {
    const cache = GetBuildingCache();
    if (cache.areTypesLoaded) return false;
    return fetch("../data/building.json")
        .then((response) => response.json())
        .then((json: BuildingData) => {
            cache.buildingTypes = json;
            cache.areTypesLoaded = true;
            return true;
        });
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Listen for Grid click event:
 * - Update selected building index.
 * - Clear other selections (enemies, etc).
 */
function ListenClickEvents() {
    const buildingCache = GetBuildingCache();
    const enemyCache = GetEnemyCache();
    window.addEventListener("click_grid", (e: BuildingEvent) => {
        buildingCache.selected = e.detail.index;
        enemyCache.selected = undefined;
    });
}

/**
 * Listen for panel action event:
 * - Spawn buildings.
 */
function ListenActionEvents() {
    const cache = GetBuildingCache();
    window.addEventListener("click_action", (e: ActionEvent) => {
        for (const id of e.detail.action.build || [])
            SpawnBuilding(cache.buildingTypes[id]);
    });
}

/**
 * Init all Building systems.
 * Load JSON files.
 * Run this once at game start.
 */
export async function Init(): Promise<boolean> {
    ListenClickEvents();
    ListenActionEvents();
    return LoadTypes();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Spawn a new building.
 * Dispatch a {@link BuildingEvent} named "spawn_building".
 */
export function SpawnBuilding(type: Building) {
    const cache = GetBuildingCache();
    cache.buildings.push(type);
    window.dispatchEvent(
        new CustomEvent<BuildingMsg>("spawn_building", {
            detail: {
                building: type,
                index: cache.buildings.length - 1,
            },
        })
    );
}
