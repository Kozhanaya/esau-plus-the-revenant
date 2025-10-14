import { ButtonAction, Keyboard } from "isaac-typescript-definitions";

export const characters = {
  ESAU: Isaac.GetPlayerTypeByName("Esau"),
  THE_REVENANT: Isaac.GetPlayerTypeByName("The Revenant", true),
};

export const defaultControls = {
  REVENANT_DASH_KEY_PRIMARY: Keyboard.RIGHT_CONTROL,
  REVENANT_DASH_KEY_SECONDARY: Keyboard.LEFT_SHIFT,
  REVENANT_DASH_BUTTON_PRIMARY: ButtonAction.DROP,
}