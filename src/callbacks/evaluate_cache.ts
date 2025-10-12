import type { CacheFlag } from "isaac-typescript-definitions";
import { evaluateRevenantCache } from "../characters/the_revenant";

export function onEvaluateCache(player: EntityPlayer, cacheFlag: CacheFlag): void {
  evaluateRevenantCache(player, cacheFlag);
}
