import { Addon, addonName } from "./addon";
import AddonModule from "./module";

class AddonPrefs extends AddonModule {
  private _window: Window;
  constructor(parent: Addon) {
    super(parent);
  }
  public initPreferences(_window: Window) {
    // This function is called when the prefs window is opened
    // See addon/chrome/content/preferences.xul onpaneload
    this._window = _window;
    Zotero.debug(`${addonName}: init preferences`);
    this.updatePrefsUI();
  }

  private updatePrefsUI() {
    // You can initialize some UI elements on prefs window
    // with this._window.document
    // Or bind some events to the elements
    Zotero.debug(`${addonName}: init preferences UI`);
  }
}

export default AddonPrefs;
