import { characters } from "../enums";

const hairCostume = Isaac.GetCostumeIdByPath("gfx/characters/character_esau_hair.anm2");

export function addEsauHairCostume(player: EntityPlayer): void {
  if(player.GetPlayerType() !== characters.ESAU) { return; }

  player.AddNullCostume(hairCostume);
}
