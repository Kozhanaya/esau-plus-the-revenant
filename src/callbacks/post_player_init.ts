import { addEsauHairCostume } from "../characters/esau";
import { addRevenantHairCostume } from "../characters/the_revenant";

export function OnPostPlayerInit(player: EntityPlayer): void {
  addHairCostumes(player);
}

function addHairCostumes(player: EntityPlayer) {
  addEsauHairCostume(player);
  addRevenantHairCostume(player);
}
