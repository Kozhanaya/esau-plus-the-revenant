import { CacheFlag } from "isaac-typescript-definitions";
import { characters } from "../enums";
import { changeTearVariantToBlood } from "../functions";

const hairCostume = Isaac.GetCostumeIdByPath("gfx/characters/character_esau_hair.anm2");

export const esauDefaultStats = new Map<CacheFlag, number>([
  [CacheFlag.FIRE_DELAY, 2.5],
  [CacheFlag.DAMAGE, 3.75],
  [CacheFlag.RANGE, 66.4], // how does this convert to 8??
  [CacheFlag.SHOT_SPEED, 0.85],
  [CacheFlag.LUCK, -1],
]);

export function addEsauHairCostume(player: EntityPlayer): void {
  if(player.GetPlayerType() !== characters.ESAU) { return; }

  player.AddNullCostume(hairCostume);
}

export function changeEsauTearVariant(tear: EntityTear): void {
  const player = tear.Parent?.ToPlayer();

  if(!player) { return; }
  if(player.GetPlayerType() !== characters.ESAU) { return; }

  changeTearVariantToBlood(tear);
}
