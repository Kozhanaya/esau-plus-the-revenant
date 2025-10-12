import { CacheFlag, TearFlag } from "isaac-typescript-definitions";
import { characters } from "../enums";
import { addFlag } from "isaacscript-common";
import { changeTearVariantToBlood } from "../functions";

const hairCostume = Isaac.GetCostumeIdByPath("gfx/characters/character_revenant_hair.anm2");

export const revenantDefaultStats = new Map<CacheFlag, number>([
  [CacheFlag.SPEED, 1.3],
  [CacheFlag.LUCK, -2],
]);

export function addRevenantHairCostume(player: EntityPlayer): void {
  if(player.GetPlayerType() !== characters.THE_REVENANT) { return; }

  player.AddNullCostume(hairCostume);
}

export function evaluateRevenantCache(player: EntityPlayer, cacheFlag: CacheFlag): void {
  if(player.GetPlayerType() !== characters.THE_REVENANT) { return; }

  if(cacheFlag === CacheFlag.FLYING) { player.CanFly = true; }
  if(cacheFlag === CacheFlag.TEAR_FLAG) { player.TearFlags = addFlag(player.TearFlags, TearFlag.SPECTRAL); }
}

export function changeRevenantTearVariant(tear: EntityTear): void {
  const player = tear.Parent?.ToPlayer();

  if(!player) { return; }
  if(player.GetPlayerType() !== characters.THE_REVENANT) { return; }

  changeTearVariantToBlood(tear);
}
