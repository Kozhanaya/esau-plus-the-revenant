import type {ButtonAction} from "isaac-typescript-definitions";
import { CacheFlag, TearFlag, InputHook, ModCallback, SoundEffect, EntityType, DamageFlag } from "isaac-typescript-definitions";
import { characters, defaultControls } from "../enums";
import type { PlayerIndex } from "isaacscript-common";
import { addFlag, Callback, CallbackCustom, DefaultMap, getPlayerIndex, hasFlag, isSelfDamage, MAX_PLAYER_SPEED_IN_UNITS, ModCallbackCustom, ModFeature, sfxManager } from "isaacscript-common";
import { changeTearVariantToBlood } from "../functions";

// variables
const contactDamageCooldown = 10;
const dashAcceleration = 30; // the speed added when dashing
const defaultContactDamage = 10;
const defaultDashCooldown = 60; // frames
const defaultDashDamage = 25;
const hairCostume = Isaac.GetCostumeIdByPath("gfx/characters/character_revenant_hair.anm2");
const minVelocityForContactDamage = 3.2;
const unavoidableDamageSources = new Set([EntityType.PROJECTILE, EntityType.SLOT]);
const unavoidableDamageFlags = new Set([
  DamageFlag.LASER,
  DamageFlag.CURSED_DOOR,
  DamageFlag.EXPLOSION,
  DamageFlag.CRUSH,
  DamageFlag.RED_HEARTS,
  DamageFlag.POOP,
  DamageFlag.TNT,
  DamageFlag.INVINCIBLE,
  DamageFlag.IV_BAG,
  DamageFlag.CHEST,
  DamageFlag.SPIKES,
]);

export const revenantDefaultStats = new Map<CacheFlag, number>([
  [CacheFlag.SPEED, 1.3],
  [CacheFlag.LUCK, -2],
]);

const v = {
  run: {
    nextDashFrame: new DefaultMap<PlayerIndex, int>(0),
    dashCooldown: new DefaultMap<PlayerIndex, int>(defaultDashCooldown),
  },
  room: {
    entityNextContactDamageFrame: new DefaultMap<PtrHash, int>(0),
  },
};



// getters
function canEntityTakeContactDamage(entity: Entity): boolean {
  return GetGameFrameCount() > getEntityNextContactDamageFrame(entity);
}

function canRevenantDash(player: EntityPlayer): boolean {
  return GetGameFrameCount() > getNextDashFrame(player)
}

function canRevenantDealContactDamage(player: EntityPlayer): boolean {
  return (
    player.Velocity.X >= minVelocityForContactDamage ||
    player.Velocity.X <= -minVelocityForContactDamage ||
    player.Velocity.Y >= minVelocityForContactDamage ||
    player.Velocity.Y <= -minVelocityForContactDamage
  );
}

function doesPlayerHaveDamageFlag(flags: BitFlags<DamageFlag>, flagsToCheck: ReadonlySet<DamageFlag>): boolean {
  for(const flagToCheck of flagsToCheck) {
    if(hasFlag(flags, flagToCheck)) {
      return true;
    }
  }

  return false;
}

function getEntityNextContactDamageFrame(entity: Entity) {
  const ptrHash = GetPtrHash(entity);
  const entityNextContactDamageFrame = v.room.entityNextContactDamageFrame.getAndSetDefault(ptrHash);

  return entityNextContactDamageFrame;
}

function GetGameFrameCount() {
  return Game().GetFrameCount();
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
  return (
    player.Velocity.X > MAX_PLAYER_SPEED_IN_UNITS ||
    player.Velocity.X < -MAX_PLAYER_SPEED_IN_UNITS ||
    player.Velocity.Y > MAX_PLAYER_SPEED_IN_UNITS ||
    player.Velocity.Y < -MAX_PLAYER_SPEED_IN_UNITS
  );
}

function shouldRevenantTakeDamage(player: EntityPlayer, damageFlags: BitFlags<DamageFlag>, source: EntityRef) {
  if(!isPlayerRevenant(player)) { return undefined; }
  if(source.Type === EntityType.FIREPLACE) { return false; }
  if(isRevenantDashing(player)) { return false; }

  if(
    canRevenantDealContactDamage(player) &&
    !unavoidableDamageSources.has(source.Type) &&
    !doesPlayerHaveDamageFlag(damageFlags, unavoidableDamageFlags) &&
    !isSelfDamage(damageFlags)
  ) { return false; }

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

function applyContactEffectsToEntity(player: EntityPlayer, entity: Entity) {
  if(!entity.IsVulnerableEnemy()) { return; }

  entity.AddBurn(EntityRef(player), 100, 5);
}

function applyDamageToEntity(amount: number, player: EntityPlayer, entity: Entity) {
  if(!entity.IsVulnerableEnemy()) { return; }

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

    if(getNextDashFrame(player) !== GetGameFrameCount()) { return; }

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

  v.run.nextDashFrame.set(playerIndex, GetGameFrameCount() + cooldownDuration);
}

function setEntityNextContactDamageFrame(entity: Entity) {
  const ptrHash = GetPtrHash(entity);
  v.room.entityNextContactDamageFrame.set(ptrHash, GetGameFrameCount() + contactDamageCooldown);
}



export class TheRevenant extends ModFeature {
  v = v;

  @CallbackCustom(ModCallbackCustom.ENTITY_TAKE_DMG_PLAYER)
  onEntityTakeDamage(player: EntityPlayer, amount: float, damageFlags: BitFlags<DamageFlag>, source: EntityRef, countdownFrames: int): boolean | undefined {
    return shouldRevenantTakeDamage(player, damageFlags, source);
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
    if(!canEntityTakeContactDamage(collider)) { return undefined; }

    applyContactEffectsToEntity(player, collider);
    applyContactDamage(player, collider);
    applyDashDamage(player, collider);
    setEntityNextContactDamageFrame(collider);

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
