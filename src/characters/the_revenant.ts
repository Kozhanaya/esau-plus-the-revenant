import { characters } from "../enums";

const hairCostume = Isaac.GetCostumeIdByPath("gfx/characters/character_revenant_hair.anm2");

export function addRevenantHairCostume(player: EntityPlayer): void {
  if(player.GetPlayerType() !== characters.THE_REVENANT) { return; }

  player.AddNullCostume(hairCostume);
}
