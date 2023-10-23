import type { Panel } from "./game-ui";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

export type Building = Panel & {
    iconURI: string;
};

export type BuildingSpawn = {
    building: Building;
    index: number;
};

export type BuildingSpawnEvent = CustomEvent<BuildingSpawn>;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/** A JSON object containing building types. */
interface BuildingJSON {
    [key: string]: Building;
}

/** All building types in /data/building.json. */
interface BuildingData extends BuildingJSON {
    campfire?: Building;
    tree?: Building;
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
        .then((json: { buildings: BuildingData }) => {
            cache.buildingTypes = json.buildings;
            cache.areTypesLoaded = true;
            return true;
        });
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Listen for button click event:
 * - Update cache.selected.
 */
function InitClickEvents() {
    const cache = GetBuildingCache();
    window.addEventListener("click_grid", (e: CustomEvent<number>) => {
        cache.selected = e.detail;
    });
}

/**
 * Init all Building systems.
 * Run this once at game start.
 */
export async function Init(): Promise<boolean> {
    InitClickEvents();
    return LoadTypes();
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Spawn a new building.
 * Dispatch a {@link BuildingSpawnEvent} named "spawn_building".
 */
export function SpawnBuilding(type: Building) {
    const cache = GetBuildingCache();
    cache.buildings.push(type);
    window.dispatchEvent(
        new CustomEvent<BuildingSpawn>("spawn_building", {
            detail: {
                building: type,
                index: cache.buildings.length - 1,
            },
        })
    );
}
