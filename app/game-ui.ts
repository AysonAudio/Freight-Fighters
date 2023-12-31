import type { Building, BuildingMsg, BuildingEvent } from "./game-building";
import type {
    Enemy,
    EnemyMsg,
    EnemyEvent,
    SpawnEnemiesEvent,
} from "./game-enemy";
import type {
    PlayerNums,
    NumVars,
    NumChangeEvent,
    CounterMsg,
    CounterEvent,
} from "./game-player";

import { GetBuildingCache } from "./game-building.js";
import { GetEnemyCache } from "./game-enemy.js";
import { GetPlayerCache } from "./game-player.js";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

export type Action = {
    title: string;
    desc: string;
    iconURI: string;
    build?: string[];
    kill?: boolean;
    adjustCurr?: NumVars;
    adjustRenew?: PlayerNums;
    min?: NumVars;
    max?: NumVars;
};

export type Panel = {
    title: string;
    desc: string;
    portraitURI: string;
    counterIDs: string[];
    actions: Action[];
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

export type ActionMsg = {
    buttonIndex: number;
    building?: Building;
    enemy?: Enemy;
    action?: Action;
};
export type ActionEvent = CustomEvent<ActionMsg>;

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * All global UI variables.
 */
type CacheUI = {
    /**
     * Building Grid.
     * Each child button is a spot for a spawned building.
     */
    gridDiv: HTMLDivElement;
    /** Child buttons. */
    gridButtons: NodeListOf<HTMLButtonElement>;
    /** Child images of child buttons. */
    gridButtonImgs: NodeListOf<HTMLImageElement>;

    /**
     * Panel.
     * Unhides and shows details when a building or enemy is clicked on.
     */
    panelDiv: HTMLDivElement;
    /** Building/enemy name. */
    panelHeading: HTMLHeadingElement;
    /** Building/enemy portrait. */
    panelImage: HTMLImageElement;
    /** Building/enemy counters. */
    panelSpans: NodeListOf<HTMLSpanElement>;
    /** Building/enemy description. */
    panelParagraph: HTMLParagraphElement;
    /** Building/enemy actions. */
    panelButtons: NodeListOf<HTMLButtonElement>;
    /** Building/enemy action icons. */
    panelSubimages: NodeListOf<HTMLImageElement>;

    /**
     * Fight Bar.
     * Each child button is a spawned enemy.
     */
    fightBarDiv: HTMLDivElement;
    /** Cloned to spawn a new enemy. */
    enemyTemplate: HTMLTemplateElement;

    /** Wood Display. UI that shows player resources. */
    woodSpan: HTMLSpanElement;
    /** Troops Display. UI that shows player resources. */
    troopsSpan: HTMLSpanElement;

    /**
     * Day Toast.
     * Shows the current game day.
     */
    dayToastDiv: HTMLDivElement;
    /** Toast title. */
    dayToastHeading: HTMLHeadingElement;

    /**
     * Global tooltip.
     * Unhides and moves to cursor when hovering over a UI element.
     */
    tooltipDiv: HTMLDivElement;
    /** Tooltip title. */
    tooltipHeading: HTMLHeadingElement;
    /** Tooltip desc. */
    tooltipParagraph: HTMLParagraphElement;
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * A decorated function.
 * One global {@link CacheUI} object is initialized in the decorator.
 * Calling the resulting function returns the same object every time.
 */
export const GetCacheUI: () => CacheUI = (() => {
    const cache: CacheUI = {
        gridDiv: document.body.querySelector("#game > .grid"),
        gridButtons: document.body.querySelectorAll("#game > .grid > button"),
        gridButtonImgs: document.body.querySelectorAll(
            "#game > .grid > button > img"
        ),

        panelDiv: document.body.querySelector("#game > .panel"),
        panelHeading: document.body.querySelector("#game > .panel > .title"),
        panelImage: document.body.querySelector("#game > .panel > .portrait"),
        panelSpans: document.body.querySelectorAll(
            "#game > .panel > .mini-bar"
        ),
        panelParagraph: document.body.querySelector("#game > .panel > .desc"),
        panelButtons: document.body.querySelectorAll("#game > .panel > button"),
        panelSubimages: document.body.querySelectorAll(
            "#game > .panel > button > img"
        ),

        fightBarDiv: document.body.querySelector("#game > #fight"),

        enemyTemplate: document.body.querySelector("#enemy"),

        woodSpan: document.body.querySelector("#game > .dashboard > #wood"),
        troopsSpan: document.body.querySelector("#game > .dashboard > #troops"),

        dayToastDiv: document.body.querySelector("#day"),
        dayToastHeading: document.body.querySelector("#day > h1"),

        tooltipDiv: document.body.querySelector(".tooltip"),
        tooltipHeading: document.body.querySelector(".tooltip > .title"),
        tooltipParagraph: document.body.querySelector(".tooltip > .desc"),
    };

    return () => cache;
})();

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Show an animated toast notification that shows the current game day.
 */
export function ShowGameDay(day: number) {
    const cache = GetCacheUI();
    cache.dayToastHeading.innerHTML = "Day " + (day + 1).toString();
    cache.dayToastDiv.animate(
        [
            { opacity: "0" },
            { opacity: "100" },
            { opacity: "100" },
            { opacity: "0" },
        ],
        {
            easing: "cubic-bezier(0, 0.2, 1, 1)",
            duration: 1800,
            iterations: 1,
        }
    );
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function UpdatePanelText(obj: Building | Enemy | undefined) {
    const cache = GetCacheUI();
    if (obj) {
        cache.panelHeading.style.display = "";
        cache.panelParagraph.style.display = "";
        cache.panelHeading.innerHTML = obj.title;
        cache.panelParagraph.innerHTML = obj.desc;
    } else {
        cache.panelHeading.style.display = "none";
        cache.panelParagraph.style.display = "none";
        cache.panelHeading.innerHTML = "";
        cache.panelParagraph.innerHTML = "";
    }
}

// ------------------------ //

function UpdatePanelPortrait(obj: Building | Enemy | undefined) {
    const cache = GetCacheUI();
    if (obj) {
        cache.panelImage.style.display = "";
        cache.panelImage.src = obj.portraitURI;
    } else {
        cache.panelImage.style.display = "none";
        cache.panelImage.src = "";
    }
}

// ------------------------ //

function UpdatePanelButtons(obj: Building | Enemy | undefined) {
    const cache = GetCacheUI();
    const buttons = cache.panelButtons;
    const imgs = cache.panelSubimages;

    if (obj) {
        const actions = obj.actions || [];
        for (let i = 0; i < actions.length; i++) {
            buttons[i].style.display = "";
            imgs[i].src = actions[i].iconURI;
        }
        for (let i = actions.length; i < imgs.length; i++) {
            buttons[i].style.display = "none";
            imgs[i].src = "";
        }
    } else {
        for (let i = 0; i < imgs.length; i++) {
            buttons[i].style.display = "none";
            imgs[i].src = "";
        }
    }
}

// ------------------------ //

function UpdatePanelCounters(obj: Building | Enemy | undefined) {
    const cacheUI = GetCacheUI();
    const cachePlayer = GetPlayerCache();
    const spans = cacheUI.panelSpans;

    if (obj) {
        const usedSpans = obj.counterIDs ? obj.counterIDs.length : 0;
        for (let i = 0; i < usedSpans; i++) {
            const counter = cachePlayer.counters[obj.counterIDs[i]];
            if (!counter) continue;

            const value = counter.number || cachePlayer.current[counter.key];
            spans[i].style.display = "";
            spans[i].innerHTML = counter.emblem.repeat(value);
        }
        for (let i = usedSpans; i < spans.length; i++) {
            spans[i].style.display = "none";
            spans[i].innerHTML = "";
        }
    } else {
        for (let i = 0; i < spans.length; i++) {
            spans[i].style.display = "none";
            spans[i].innerHTML = "";
        }
    }
}

// ------------------------ //

function UpdatePanel(obj?: Building | Enemy | undefined) {
    UpdatePanelText(obj);
    UpdatePanelPortrait(obj);
    UpdatePanelButtons(obj);
    UpdatePanelCounters(obj);
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Show a tooltip above a hovered element.
 */
function ShowTooltip(hovered?: HTMLElement, title?: string, desc?: string) {
    if (!hovered) return;

    const cache = GetCacheUI();
    const hoveredRect = hovered.getBoundingClientRect();
    let buttonBottomVH: number;
    let buttonTopVH: number;
    let buttonLeftVW: number;

    let tooltipRect: DOMRect;
    let tooltipVW: number;
    let tooltipVH: number;

    const marginVW = 2;
    const marginVH = 2;

    const windowWidth = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
    );
    const windowHeight = Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
    );

    cache.tooltipDiv.style.display = "";
    cache.tooltipHeading.innerHTML = title || "";
    cache.tooltipParagraph.innerHTML = desc || "";

    tooltipRect = cache.tooltipDiv.getBoundingClientRect();
    tooltipVW = (tooltipRect.width / windowWidth) * 100;
    tooltipVH = (tooltipRect.height / windowHeight) * 100;

    buttonBottomVH = (hoveredRect.bottom / windowHeight) * 100;
    buttonTopVH = (hoveredRect.top / windowHeight) * 100;
    buttonLeftVW = (hoveredRect.left / windowWidth) * 100;

    // Move tooltip above or below hovered elem, based on screen space
    if (tooltipVH < 100 - buttonBottomVH - marginVH * 2)
        cache.tooltipDiv.style.top = "" + (buttonBottomVH + marginVH) + "vh";
    else
        cache.tooltipDiv.style.bottom =
            "" + (100 - buttonTopVH + marginVH) + "vh";

    // Set horizontal position, based on screen space
    if (tooltipVW < 100 - buttonLeftVW - marginVW * 2)
        cache.tooltipDiv.style.left = "" + buttonLeftVW + "vw";
    else cache.tooltipDiv.style.right = "" + (0 + marginVW) + "vw";
}

/**
 * Hide and reset tooltip.
 */
function HideTooltip() {
    const cache = GetCacheUI();
    cache.tooltipDiv.style.display = "none";
    cache.tooltipHeading.innerHTML = "";
    cache.tooltipParagraph.innerHTML = "";
    cache.tooltipDiv.style.top = "";
    cache.tooltipDiv.style.bottom = "";
    cache.tooltipDiv.style.left = "";
    cache.tooltipDiv.style.right = "";
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function SendBuildingEvent(type: string, i: number) {
    const buildingCache = GetBuildingCache();
    window.dispatchEvent(
        new CustomEvent<BuildingMsg>(type, {
            detail: {
                index: i,
                building: buildingCache.buildings[i],
            },
        })
    );
}

function SendActionEvent(type: string, i: number, checkReqs: boolean = false) {
    const buildingCache = GetBuildingCache();
    const enemyCache = GetEnemyCache();
    const playerCache = GetPlayerCache();

    const building = buildingCache.buildings[buildingCache.selected];
    const enemy = enemyCache.enemies[enemyCache.selected];
    const action = building?.actions[i] || enemy?.actions[i];
    if (!action) return;

    if (checkReqs) {
        for (const key in action.min)
            if (playerCache.current[key] < action.min[key]) return;
        for (const key in action.max)
            if (playerCache.current[key] >= action.max[key]) return;
    }

    window.dispatchEvent(
        new CustomEvent<ActionMsg>(type, {
            detail: {
                buttonIndex: i,
                building: building,
                enemy: enemy,
                action: action,
            },
        })
    );
}

function SendCounterEvent(type: string, i: number) {
    const buildingCache = GetBuildingCache();
    const enemyCache = GetEnemyCache();
    const playerCache = GetPlayerCache();
    const obj =
        buildingCache.selected != undefined
            ? buildingCache.buildings[buildingCache.selected]
            : enemyCache.enemies[enemyCache.selected];
    window.dispatchEvent(
        new CustomEvent<CounterMsg>(type, {
            detail: {
                index: i,
                counter: playerCache.counters[obj.counterIDs[i]],
            },
        })
    );
}

function SendEnemyEvent(type: string, i: number) {
    const enemyCache = GetEnemyCache();
    window.dispatchEvent(
        new CustomEvent<EnemyMsg>(type, {
            detail: {
                index: i,
                enemy: enemyCache.enemies[i],
            },
        })
    );
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Set onclicks for all static UI buttons.
 * Each button dispatches a CustomEvent onclick.
 * Other libraries can listen to this event to modularly add button functionality.
 */
function SetButtonEvents() {
    const cacheUI = GetCacheUI();
    for (let i = 0; i < cacheUI.gridButtons.length; i++)
        cacheUI.gridButtons[i].onclick = () =>
            SendBuildingEvent("click_grid", i);
    for (let i = 0; i < cacheUI.panelButtons.length; i++)
        cacheUI.panelButtons[i].onclick = () =>
            SendActionEvent("click_action", i, true);
}

/**
 * Set onmouseenter for all static UI elements.
 * Each element dispatches a CustomEvent onmouseenter.
 * Other libraries can listen to this event to modularly add functionality.
 */
function SetHoverEvents() {
    const cacheUI = GetCacheUI();
    for (let i = 0; i < cacheUI.gridButtons.length; i++)
        cacheUI.gridButtons[i].onmouseenter = () =>
            SendBuildingEvent("hover_grid", i);
    for (let i = 0; i < cacheUI.panelSpans.length; i++)
        cacheUI.panelSpans[i].onmouseenter = () =>
            SendCounterEvent("hover_counter", i);
    for (let i = 0; i < cacheUI.panelButtons.length; i++)
        cacheUI.panelButtons[i].onmouseenter = () =>
            SendActionEvent("hover_action", i, false);
}

/**
 * Set onmouseleave for all static UI elements.
 * Each element dispatches a CustomEvent onmouseleave.
 * Other libraries can listen to this event to modularly add functionality.
 */
function SetUnhoverEvents() {
    const cacheUI = GetCacheUI();
    for (let i = 0; i < cacheUI.gridButtons.length; i++)
        cacheUI.gridButtons[i].onmouseleave = () =>
            SendBuildingEvent("unhover_grid", i);
    for (let i = 0; i < cacheUI.panelSpans.length; i++)
        cacheUI.panelSpans[i].onmouseleave = () =>
            SendCounterEvent("unhover_counter", i);
    for (let i = 0; i < cacheUI.panelButtons.length; i++)
        cacheUI.panelButtons[i].onmouseleave = () =>
            SendActionEvent("unhover_action", i, false);
}

/**
 * For all existing enemy card buttons:
 * - Reset onclicks
 * - Reset onmouseenters
 * - Reset onmouseleaves
 * Run this after splicing an enemy and enemy card to reset button indices.
 */
function ResetEnemyEvents() {
    const cacheUI = GetCacheUI();
    const cards = cacheUI.fightBarDiv.children;
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLButtonElement;
        card.onclick = () => SendEnemyEvent("click_enemy", i);
        card.onmouseenter = () => SendEnemyEvent("hover_enemy", i);
        card.onmouseleave = () => SendEnemyEvent("unhover_enemy", i);
    }
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Listen for Building and Enemy click events:
 * - Unhide and update Panel to show selection's details.
 * - Set Panel id to apply build-related-css.
 */
function ListenButtonEvents() {
    const cache = GetCacheUI();
    window.addEventListener("click_grid", (e: BuildingEvent) => {
        UpdatePanel(e.detail.building);
        cache.panelDiv.style.display = "";
        cache.panelDiv.id = "build";
    });
    window.addEventListener("click_enemy", (e: EnemyEvent) => {
        UpdatePanel(e.detail.enemy);
        cache.panelDiv.style.display = "";
        cache.panelDiv.id = "combat";
    });
}

/**
 * Listen for onmouseenter events from Enemies and all static UI elems:
 * - Show tooltip.
 */
function ListenHoverEvents() {
    const cache = GetCacheUI();
    window.addEventListener("hover_grid", (e: BuildingEvent) => {
        if (!e.detail.building) return;
        const elem = cache.gridButtons[e.detail.index];
        const title = e.detail.building.title;
        const desc = e.detail.building.desc;
        ShowTooltip(elem, title, desc);
    });
    window.addEventListener("hover_counter", (e: CounterEvent) => {
        if (!e.detail.counter) return;
        const elem = cache.panelSpans[e.detail.index];
        const desc = e.detail.counter.tooltip;
        ShowTooltip(elem, undefined, desc);
    });
    window.addEventListener("hover_action", (e: ActionEvent) => {
        if (!e.detail.action) return;
        const elem = cache.panelButtons[e.detail.buttonIndex];
        const title = e.detail.action.title;
        const desc = e.detail.action.desc;
        ShowTooltip(elem, title, desc);
    });
    window.addEventListener("hover_enemy", (e: EnemyEvent) => {
        if (!e.detail.enemy) return;
        const elem = cache.fightBarDiv.children[e.detail.index] as HTMLElement;
        const desc =
            "Hit Chance: " +
            e.detail.enemy.hitChance +
            "%" +
            "\n" +
            "Hit Damage: " +
            e.detail.enemy.hitDamage;
        ShowTooltip(elem, undefined, desc);
    });
}

/**
 * Listen for Building, Counter, and Enemy onmouseleave events:
 * - Hide tooltip.
 */
function ListenUnhoverEvents() {
    window.addEventListener("unhover_grid", () => HideTooltip());
    window.addEventListener("unhover_counter", () => HideTooltip());
    window.addEventListener("unhover_action", () => HideTooltip());
    window.addEventListener("unhover_enemy", () => HideTooltip());
}

/**
 * Listen for Building spawn event:
 * - Set Grid button icon.
 */
function ListenBuildingEvents() {
    const cache = GetCacheUI();
    window.addEventListener("spawn_building", (e: BuildingEvent) => {
        cache.gridButtonImgs[e.detail.index].src = e.detail.building.iconURI;
    });
}

/**
 * Listen for enemies spawn event:
 * - Clone new enemy card elems into fight bar.
 * - Set cards' titles, arts, and numbers.
 * - Animate:
 *     - Slide new cards from off-screen to the left.
 *     - Slide existing cards slightly to the left.
 * - Set onclick: Dispatch a CustomEvent named "click_enemy".
 * - Set onmouseenter: Dispatch a CustomEvent named "hover_enemy".
 * - Set onmouseleave: Dispatch a CustomEvent named "unhover_enemy".
 * - Other libraries can listen to these events to modularly add functionality.
 */
function ListenEnemySpawnEvents() {
    const cache = GetCacheUI();
    const animOpt = {
        easing: "cubic-bezier(0, 1, 0.4, 1)",
        duration: 1000,
        iterations: 1,
    };

    window.addEventListener("spawn_enemies", (e: SpawnEnemiesEvent) => {
        const lastExistingElemIndex = cache.fightBarDiv.childElementCount;

        for (let i = 0; i < e.detail.length; i++) {
            let card: HTMLButtonElement;
            let title: HTMLHeadingElement;
            let art: HTMLImageElement;
            let counters: NodeListOf<HTMLSpanElement>;

            cache.fightBarDiv.append(
                cache.enemyTemplate.content.cloneNode(true)
            );
            card = cache.fightBarDiv.lastElementChild as HTMLButtonElement;
            title = card.querySelector(".title");
            art = card.querySelector(".bg-art > img");
            counters = card.querySelectorAll(".counters > *");

            title.innerHTML = e.detail[i].enemy.name;
            art.src = e.detail[i].enemy.artURI;
            counters[0].innerHTML = "🎲" + e.detail[i].enemy.hitChance + "%";
            counters[1].innerHTML = "" + e.detail[i].enemy.hitDamage + "☠️";

            card.animate([{ translate: "100vw" }, { translate: "0" }], animOpt);

            card.onclick = () =>
                window.dispatchEvent(
                    new CustomEvent<EnemyMsg>("click_enemy", {
                        detail: {
                            index: e.detail[i].index,
                            enemy: e.detail[i].enemy,
                        },
                    })
                );

            card.onmouseenter = () =>
                window.dispatchEvent(
                    new CustomEvent<EnemyMsg>("hover_enemy", {
                        detail: {
                            index: e.detail[i].index,
                            enemy: e.detail[i].enemy,
                        },
                    })
                );

            card.onmouseleave = () =>
                window.dispatchEvent(
                    new CustomEvent<EnemyMsg>("unhover_enemy", {
                        detail: {
                            index: e.detail[i].index,
                            enemy: e.detail[i].enemy,
                        },
                    })
                );
        }

        for (let j = 0; j < lastExistingElemIndex; j++) {
            const _card = cache.fightBarDiv.children[j];
            const length = "" + 10 * e.detail.length + "vw";
            _card.animate([{ translate: length }, { translate: "0" }], animOpt);
        }
    });
}

/**
 * Listen for Enemy kill event:
 * - Clean up events.
 * - Delete Enemy card elem.
 * - Animate: slide remaining cards to new positions.
 * - Update button indices in enemy card onclicks.
 * - Clear and hide Panel.
 */
function ListenEnemyKillEvents() {
    const cache = GetCacheUI();
    const animOpt = {
        easing: "cubic-bezier(0, 1, 0.4, 1)",
        duration: 1000,
        iterations: 1,
    };

    window.addEventListener("kill_enemy", (e: EnemyEvent) => {
        let cardCount: number;
        let killedCard = <HTMLButtonElement>(
            cache.fightBarDiv.children[e.detail.index]
        );

        killedCard.removeEventListener("click", killedCard.onclick);
        killedCard.removeEventListener("mouseenter", killedCard.onmouseenter);
        killedCard.removeEventListener("mouseleave", killedCard.onmouseleave);

        cache.fightBarDiv.removeChild(killedCard);
        killedCard.remove();
        cardCount = cache.fightBarDiv.childElementCount;

        for (let i = 0; i < e.detail.index; i++) {
            const card = cache.fightBarDiv.children[i];
            card.animate([{ translate: "-10vw" }, { translate: "0" }], animOpt);
        }
        for (let j = e.detail.index; j < cardCount; j++) {
            const card = cache.fightBarDiv.children[j];
            card.animate([{ translate: "10vw" }, { translate: "0" }], animOpt);
        }

        ResetEnemyEvents();
        UpdatePanel();
        cache.panelDiv.style.display = "";
        cache.panelDiv.id = "";
    });
}

/**
 * Listen for player variable change events:
 * - Update dashboard.
 * - Update panel counters.
 * - Show toast animation if game day changes.
 */
function ListenResourceEvents() {
    const cacheUI = GetCacheUI();
    const cacheBuild = GetBuildingCache();
    const cachePlayer = GetPlayerCache();

    window.addEventListener("adjustCurr", (e: NumChangeEvent) => {
        if (e.detail.key == "days") ShowGameDay(e.detail.newTotal);
        else if (e.detail.key == "wood")
            cacheUI.woodSpan.innerHTML = "🌲" + e.detail.newTotal.toString();
        else if (e.detail.key == "troops")
            cacheUI.troopsSpan.innerHTML = "🤺" + e.detail.newTotal.toString();
        else if (e.detail.key == "hp") {
            const index = cacheBuild.selected;
            if (index == undefined) return;

            const building = cacheBuild.buildings[index];
            if (!building.counterIDs) return;

            for (let i = 0; i < building.counterIDs.length; i++)
                if (e.detail.key == building.counterIDs[i]) {
                    const counter = cachePlayer.counters[e.detail.key];
                    if (!counter) continue;

                    const span = cacheUI.panelSpans[i];
                    const value =
                        counter.number || cachePlayer.current[counter.key];
                    span.innerHTML = counter.emblem.repeat(value);
                }
        }
    });
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Init all UI systems.
 * Run this once at game start.
 */
export function Init() {
    SetButtonEvents();
    SetHoverEvents();
    SetUnhoverEvents();
    ListenButtonEvents();
    ListenHoverEvents();
    ListenUnhoverEvents();
    ListenBuildingEvents();
    ListenEnemySpawnEvents();
    ListenEnemyKillEvents();
    ListenResourceEvents();
}
