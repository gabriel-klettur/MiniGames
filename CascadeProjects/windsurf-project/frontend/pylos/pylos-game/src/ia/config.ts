// Runtime engine flags configurable from UI via Worker cfg
export type IAFlags = {
  precomputedSupports: boolean;
  precomputedCenter: boolean;
  pvsEnabled: boolean;
  aspirationEnabled: boolean;
  ttEnabled: boolean;
};

const flags: IAFlags = {
  precomputedSupports: true,
  precomputedCenter: true,
  pvsEnabled: true,
  aspirationEnabled: true,
  ttEnabled: true,
};

export function setIAFlags(partial: Partial<IAFlags>): void {
  if (typeof partial.precomputedSupports === 'boolean') flags.precomputedSupports = partial.precomputedSupports;
  if (typeof partial.precomputedCenter === 'boolean') flags.precomputedCenter = partial.precomputedCenter;
  if (typeof partial.pvsEnabled === 'boolean') flags.pvsEnabled = partial.pvsEnabled;
  if (typeof partial.aspirationEnabled === 'boolean') flags.aspirationEnabled = partial.aspirationEnabled;
  if (typeof partial.ttEnabled === 'boolean') flags.ttEnabled = partial.ttEnabled;
}

export function getIAFlags(): IAFlags {
  return { ...flags };
}
