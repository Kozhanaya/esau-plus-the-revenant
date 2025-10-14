import type {ButtonAction} from "isaac-typescript-definitions";
import { CacheFlag, TearFlag, InputHook, ModCallback, SoundEffect, EntityType, DamageFlag } from "isaac-typescript-definitions";
import { characters, defaultControls } from "../enums";
import type { PlayerIndex } from "isaacscript-common";
import { addFlag, Callback, CallbackCustom, DefaultMap, getPlayerIndex, MAX_PLAYER_SPEED_IN_UNITS, ModCallbackCustom, ModFeature, sfxManager } from "isaacscript-common";
import { changeTearVariantToBlood } from "../functions";

// variables
const dashAcceleration = 45; // the speed added when dashing
const defaultContactDamage = 10;
const defaultDashCooldown = 60; // frames
const defaultDashDamage = 25;
const hairCostume = Isaac.GetCostumeIdByPath("gfx/characters/character_revenant_hair.anm2");
const minVelocityForContactDamage = 3.2;

export const revenantDefaultStats = new Map<CacheFlag, number>([
  [CacheFlag.SPEED, 1.3],
  [CacheFlag.LUCK, -2],
]);

const v = {
  run: {
    nextDashFrame: new DefaultMap<PlayerIndex, int>(0),
    dashCooldown: new DefaultMap<PlayerIndex, int>(defaultDashCooldown),
  },
};



// getters
function canRevenantDash(player: EntityPlayer): boolean {
  if(Game().GetFrameCount() < getNextDashFrame(player)) { return false; }

  return true;
}

function canRevenantDealContactDamage(player: EntityPlayer): boolean {
  if (
    player.Velocity.X < minVelocityForContactDamage &&
    player.Velocity.X > -minVelocityForContactDamage &&
    player.Velocity.Y < minVelocityForContactDamage &&
    player.Velocity.Y > -minVelocityForContactDamage
  ) { return false; }

  return true;
}

function getNextDashFrame(player: EntityPlayer) {
  const playerIndex = getPlayerIndex(player);
  const nextDashFrame = v.run.nextDashFrame.getAndSetDefault(playerIndex);

  return nextDashFrame;
}

function isPlayerRevenant(player: EntityPlayer): boolean {
  return player.GetPlayerType() === characters.THE_REVENANT;
}

function isRevenantDashing(player: EntityPlayer): boolean {
  if(
    player.Velocity.X > MAX_PLAYER_SPEED_IN_UNITS ||
    player.Velocity.X < -MAX_PLAYER_SPEED_IN_UNITS ||
    player.Velocity.Y > MAX_PLAYER_SPEED_IN_UNITS ||
    player.Velocity.Y < -MAX_PLAYER_SPEED_IN_UNITS
  ) { return true; }

  return false;
}

function shouldRevenantTakeDamage(player: EntityPlayer, source: EntityRef) {
  if(source.Type === EntityType.FIREPLACE) { return false; }
  if(isRevenantDashing(player)) { return false; }
  if(canRevenantDealContactDamage(player)) { return false; }

  return true;
}



// functions
function addRevenantHairCostume(player: EntityPlayer) {
  if(!isPlayerRevenant(player)) { return; }

  player.AddNullCostume(hairCostume);
}

function applyContactDamage(player: EntityPlayer, collider: Entity) {
  if(!canRevenantDealContactDamage(player)) { return; }

  applyDamageToEntity(defaultContactDamage, player, collider);
}

function applyDamageToEntity(amount: number, player: EntityPlayer, entity: Entity) {
  if(!entity.IsVulnerableEnemy()) { return; }

  player.Mass = 5000;
  entity.Mass = 1;
  entity.TakeDamage(amount, DamageFlag.COUNTDOWN, EntityRef(player), 0)
}

function applyDashDamage(player: EntityPlayer, collider: Entity) {
  if(!isRevenantDashing(player)) { return };
  applyDamageToEntity(defaultDashDamage, player, collider);
}

function changeRevenantTearVariant(tear: EntityTear) {
  const player = tear.Parent?.ToPlayer();

  if(!player) { return; }
  if(!isPlayerRevenant(player)) { return; }

  changeTearVariantToBlood(tear);
}

function dash(player: EntityPlayer) {
  player.Velocity = player.Velocity.Resized(dashAcceleration);
}

function evaluateRevenantCache(player: EntityPlayer, cacheFlag: CacheFlag) {
  if(!isPlayerRevenant(player)) { return; }

  if(cacheFlag === CacheFlag.FLYING) { player.CanFly = true; }
  if(cacheFlag === CacheFlag.TEAR_COLOR) { player.TearColor = Color(1.5, 2, 2, 0.7) }
  if(cacheFlag === CacheFlag.TEAR_FLAG) { player.TearFlags = addFlag(player.TearFlags, TearFlag.SPECTRAL); }
}

function initDash(player: EntityPlayer, inputHook: InputHook, buttonAction: ButtonAction) {
  if(Game().IsPaused()) { return; }
  if(!isPlayerRevenant(player)) { return; }
  if(inputHook !== InputHook.IS_ACTION_PRESSED && inputHook !== InputHook.IS_ACTION_TRIGGERED) { return; }

  if(
    !Input.IsButtonPressed(defaultControls.REVENANT_DASH_KEY_PRIMARY, player.ControllerIndex) &&
    !Input.IsButtonPressed(defaultControls.REVENANT_DASH_KEY_SECONDARY, player.ControllerIndex) &&
    !Input.IsActionPressed(defaultControls.REVENANT_DASH_BUTTON_PRIMARY, player.ControllerIndex)
  ) { return; }

  if(!canRevenantDash(player)) { return; }

  dash(player);
  playDashSFX();
  setDashCooldown(player);
}

function initDashReadyGFX(player: EntityPlayer) {
	player.SetColor(Color(1, 1, 1, 1, 1, 0, 0), 3, -1, true, false)
}

function notifyDashReadiness() {
  for(let i = 0; i < Game().GetNumPlayers(); i++) {
    const player = Isaac.GetPlayer(i);

    if(getNextDashFrame(player) !== Game().GetFrameCount()) { return; }

    initDashReadyGFX(player);
    playDashReadySFX();
  }
}

function playDashReadySFX() {
  sfxManager.Play(SoundEffect.BEEP, 1);
  sfxManager.AdjustPitch(SoundEffect.BEEP, 0.8);
}

function playDashSFX() {
  sfxManager.Play(SoundEffect.MONSTER_YELL_A, 1, 2, false);
}

function setDashCooldown(player: EntityPlayer) {
  const playerIndex = getPlayerIndex(player);
  const cooldownDuration = v.run.dashCooldown.getAndSetDefault(playerIndex);

  v.run.nextDashFrame.set(playerIndex, Game().GetFrameCount() + cooldownDuration);
}



export class TheRevenant extends ModFeature {
  v = v;

  @CallbackCustom(ModCallbackCustom.ENTITY_TAKE_DMG_PLAYER)
  onEntityTakeDamage(player: EntityPlayer, amount: float, damageFlags: BitFlags<DamageFlag>, source: EntityRef, countdownFrames: int): boolean | undefined {
    return shouldRevenantTakeDamage(player, source);
  }

  @Callback(ModCallback.EVALUATE_CACHE)
  onEvaluateCache(player: EntityPlayer, cacheFlag: CacheFlag): void {
    evaluateRevenantCache(player, cacheFlag);
  }

  @CallbackCustom(ModCallbackCustom.INPUT_ACTION_PLAYER)
  onInputAction(player: EntityPlayer, inputHook: InputHook, buttonAction: ButtonAction): boolean | float | undefined {
    initDash(player, inputHook, buttonAction);

    return undefined;
  }

  @Callback(ModCallback.PRE_PLAYER_COLLISION)
  onPrePlayerCollision(player: EntityPlayer, collider: Entity, low: boolean): boolean | undefined {
    if(!low) { return undefined; }

    applyContactDamage(player, collider);
    applyDashDamage(player, collider);

    return undefined;
  }

  @Callback(ModCallback.POST_FIRE_TEAR)
  onPostFireTear(tear: EntityTear): void {
    changeRevenantTearVariant(tear);
  }

  @Callback(ModCallback.POST_PLAYER_INIT)
  onPostPlayerInit(player: EntityPlayer): void {
    addRevenantHairCostume(player);
  }

  @Callback(ModCallback.POST_UPDATE)
  onPostUpdate(): void {
    notifyDashReadiness();
  }
}
