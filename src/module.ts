import Addon from "./addon";

class AddonModule {
  protected _Addon: Addon;
  constructor(parent: Addon) {
    this._Addon = parent;
  }
}

export default AddonModule;
