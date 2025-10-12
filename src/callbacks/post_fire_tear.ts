import { changeEsauTearVariant } from "../characters/esau";
import { changeRevenantTearVariant } from "../characters/the_revenant";

export function onPostFireTear(tear: EntityTear): void {
  changeCharacterTearVariant(tear);
}

function changeCharacterTearVariant(tear: EntityTear) {
  changeEsauTearVariant(tear);
  changeRevenantTearVariant(tear);
}
