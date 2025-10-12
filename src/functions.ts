import { TearVariant } from "isaac-typescript-definitions";

export function changeTearVariantToBlood(tear: EntityTear): void {
  const tearVariants = {
		[TearVariant.BLUE]: TearVariant.BLOOD,
		[TearVariant.CUPID_BLUE]: TearVariant.CUPID_BLOOD,
		[TearVariant.PUPULA]: TearVariant.PUPULA_BLOOD,
		[TearVariant.GODS_FLESH]: TearVariant.GODS_FLESH_BLOOD,
		[TearVariant.NAIL]: TearVariant.NAIL_BLOOD,
		[TearVariant.GLAUCOMA]: TearVariant.GLAUCOMA_BLOOD,
		[TearVariant.EYE]: TearVariant.EYE_BLOOD,
		[TearVariant.KEY]: TearVariant.KEY_BLOOD,
	}

	const bloodyVariant = tearVariants[tear.Variant as keyof typeof tearVariants];

	if(typeof bloodyVariant !== "number") { return; }
  if(tear.Variant === bloodyVariant) { return; }

  tear.ChangeVariant(bloodyVariant);
}
