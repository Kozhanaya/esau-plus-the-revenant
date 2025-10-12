import { ModCallback } from "isaac-typescript-definitions";
import { OnPostPlayerInit } from "./callbacks/post_player_init";
import { mod } from "./mod";
import { characters } from "./enums";
import { esauDefaultStats } from "./characters/esau";
import { revenantDefaultStats } from "./characters/the_revenant";
import { onEvaluateCache } from "./callbacks/evaluate_cache";
import { onPostFireTear } from "./callbacks/post_fire_tear";

export function main(): void {
  registerAllCharacterStats();
  addCallbacks();
}

function registerAllCharacterStats() {
  mod.registerCharacterStats(characters.ESAU, esauDefaultStats);
  mod.registerCharacterStats(characters.THE_REVENANT, revenantDefaultStats);
}

function addCallbacks() {
  mod.AddCallback(ModCallback.POST_PLAYER_INIT, OnPostPlayerInit);
  mod.AddCallback(ModCallback.EVALUATE_CACHE, onEvaluateCache);
  mod.AddCallback(ModCallback.POST_FIRE_TEAR, onPostFireTear);
}
