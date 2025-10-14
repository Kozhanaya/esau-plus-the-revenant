import { HeartSubType } from "isaac-typescript-definitions";
import { mod } from "./mod";
import { characters } from "./enums";
import { Esau, esauDefaultStats } from "./characters/esau";
import { revenantDefaultStats, TheRevenant } from "./characters/the_revenant";
import { initModFeatures } from "isaacscript-common";

const modFeatures = [Esau, TheRevenant] as const;

export function main(): void {
  initModFeatures(mod, modFeatures);
  registerAllCharacters();
}

function registerAllCharacters() {
  mod.registerCharacterStats(characters.ESAU, esauDefaultStats);
  mod.registerCharacterStats(characters.THE_REVENANT, revenantDefaultStats);
  mod.registerCharacterHealthConversion(characters.THE_REVENANT, HeartSubType.BLACK);
}
