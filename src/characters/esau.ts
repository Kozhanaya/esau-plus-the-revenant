import { CacheFlag, CollectibleType, ModCallback  } from "isaac-typescript-definitions";
import type {UseFlag} from "isaac-typescript-definitions";
import { characters } from "../enums";
import { changeTearVariantToBlood } from "../functions";
import { Callback, ModFeature } from "isaacscript-common";

// variables
const hairCostume = Isaac.GetCostumeIdByPath("gfx/characters/character_esau_hair.anm2");

export const esauDefaultStats = new Map<CacheFlag, number>([
  [CacheFlag.FIRE_DELAY, 2.5],
  [CacheFlag.DAMAGE, 3.75],
  [CacheFlag.RANGE, 66.4], // how does this convert to 8??
  [CacheFlag.SHOT_SPEED, 0.85],
  [CacheFlag.LUCK, -1],
]);



// getters
function isPlayerEsau(player: EntityPlayer): boolean {
  return player.GetPlayerType() === characters.ESAU;
}



// functions
function addEsauHairCostume(player: EntityPlayer) {
  if(!isPlayerEsau(player)) { return; }

  player.AddNullCostume(hairCostume);
}

function changeEsauTearVariant(tear: EntityTear) {
  const player = tear.Parent?.ToPlayer();

  if(!player) { return; }
  if(!isPlayerEsau(player)) { return; }

  changeTearVariantToBlood(tear);
}



export class Esau extends ModFeature {
  @Callback(ModCallback.POST_FIRE_TEAR)
  onPostFireTear(tear: EntityTear): void {
    changeEsauTearVariant(tear);
  }

  @Callback(ModCallback.POST_PLAYER_INIT)
  onPostPlayerInit(player: EntityPlayer): void {
    addEsauHairCostume(player);
  }

  @Callback(ModCallback.POST_USE_ITEM)
  onPostUseItem(
    collectibleType: CollectibleType,
    rng: RNG,
    player: EntityPlayer,
    useFlags: BitFlags<UseFlag>,
    activeSlot: int,
    customVarData: int,
  ): boolean | undefined {

    if(collectibleType !== CollectibleType.D4 && collectibleType !== CollectibleType.D100) { return undefined; }
    if(isPlayerEsau(player)) { addEsauHairCostume(player); }

    return true;
  }
}