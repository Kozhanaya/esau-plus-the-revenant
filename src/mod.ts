import { ISCFeature, upgradeMod } from "isaacscript-common";
import { name } from "../package.json";

const modFeatures = [
  ISCFeature.CHARACTER_STATS,
] as const;

const modVanilla = RegisterMod(name, 1);

export const mod = upgradeMod(modVanilla, modFeatures);
